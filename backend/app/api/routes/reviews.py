from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.review import Review
from app.models.review_comment import ReviewComment
from app.models.assignment import Assignment
from app.models.candidate import Candidate
from app.models.candidate_status_history import CandidateStatusHistory
from app.models.user import User
from app.schemas.review import (
    ReviewCreate, ReviewOut, CommentCreate, CommentOut, VALID_VERDICTS,
    AdminDecisionRequest, PendingReviewOut, VALID_ADMIN_ACTIONS,
)
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])


def effective_outcome(verdict: str, action: str) -> str:
    """
    Accepting follows the teacher; overriding inverts them.

        shortlist  + accepted   -> interview
        reject     + overridden -> interview
        reject     + accepted   -> archive
        shortlist  + overridden -> archive
    """
    shortlisted = verdict == "shortlist"
    if action == "overridden":
        shortlisted = not shortlisted
    return "interview" if shortlisted else "archive"

@router.post("/", response_model=ReviewOut)
def create_or_update_review(
    data: ReviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    if data.verdict and data.verdict not in VALID_VERDICTS:
        raise HTTPException(status_code=400, detail=f"Invalid verdict. Choose from {VALID_VERDICTS}")

    assignment = db.query(Assignment).filter(Assignment.id == data.assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    # Check existing draft
    existing = db.query(Review).filter(
        Review.assignment_id == data.assignment_id,
        Review.reviewer_id == current_user.id,
        Review.is_final == False
    ).first()

    if existing:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    review = Review(
        **data.model_dump(),
        reviewer_id=current_user.id
    )
    db.add(review)

    # Update assignment status
    assignment.status = "in_review"
    db.commit()
    db.refresh(review)
    return review

@router.post("/{review_id}/submit", response_model=ReviewOut)
def submit_review(
    review_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    review = db.query(Review).filter(
        Review.id == review_id,
        Review.reviewer_id == current_user.id
    ).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.is_final:
        raise HTTPException(status_code=400, detail="Review already submitted")
    if not review.verdict:
        raise HTTPException(status_code=400, detail="Verdict required before submitting")

    review.is_final = True
    review.submitted_at = datetime.utcnow()

    # Update assignment as completed
    assignment = db.query(Assignment).filter(Assignment.id == review.assignment_id).first()
    if assignment:
        assignment.status = "completed"
        assignment.completed_at = datetime.utcnow()

    # Update candidate status if shortlisted
    if review.verdict == "shortlist":
        candidate = db.query(Candidate).filter(Candidate.id == assignment.candidate_id).first()
        if candidate:
            candidate.current_status = "SHORTLISTED"

    db.commit()
    db.refresh(review)
    return review

@router.get("/pending", response_model=List[PendingReviewOut])
def pending_decisions(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    """
    Teacher verdicts waiting for an admin to accept or override.

    Scoped to candidates actually sitting at PENDING_DECISION — a candidate who has
    already moved on (or predates this flow) must not be re-decided, which would
    drag their status backwards.
    """
    rows = (
        db.query(Review, Candidate, User.full_name)
        .join(Assignment, Assignment.id == Review.assignment_id)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Review.reviewer_id)
        .filter(
            Review.is_final == True,
            Review.admin_action == None,
            Candidate.current_status == "PENDING_DECISION",
            Candidate.deleted_at == None,
        )
        .order_by(Review.submitted_at.asc())
        .all()
    )
    return [
        PendingReviewOut(
            review_id=r.id,
            candidate_id=c.id,
            candidate_name=c.full_name,
            candidate_subject=c.preferred_subject,
            teacher_name=tname,
            verdict=r.verdict,
            reasoning=r.recommendation,
            submitted_at=r.submitted_at,
        )
        for r, c, tname in rows
    ]


@router.post("/{review_id}/admin-decision")
def admin_decision(
    review_id: UUID,
    data: AdminDecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    """
    Admin accepts or overrides a teacher's verdict. The result either clears the
    candidate for interview scheduling, or archives them.
    """
    if data.action not in VALID_ADMIN_ACTIONS:
        raise HTTPException(status_code=400, detail=f"Invalid action. Choose from {VALID_ADMIN_ACTIONS}")

    review = db.query(Review).filter(Review.id == review_id, Review.is_final == True).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.admin_action:
        raise HTTPException(status_code=400, detail="This review has already been decided")

    assignment = db.query(Assignment).filter(Assignment.id == review.assignment_id).first()
    candidate = db.query(Candidate).filter(Candidate.id == assignment.candidate_id).first()
    if candidate and candidate.current_status != "PENDING_DECISION":
        raise HTTPException(
            status_code=400,
            detail=f"This candidate has already moved on (currently {candidate.current_status})",
        )

    review.admin_action = data.action
    review.admin_action_by = current_user.id
    review.admin_action_at = datetime.utcnow()
    review.admin_note = data.note

    outcome = effective_outcome(review.verdict, data.action)
    if candidate:
        to_status = "SHORTLISTED" if outcome == "interview" else "ON_HOLD"
        db.add(CandidateStatusHistory(
            candidate_id=candidate.id,
            from_status=candidate.current_status,
            to_status=to_status,
            changed_by=current_user.id,
            reason=data.note or f"Teacher verdict '{review.verdict}' {data.action} by admin",
        ))
        candidate.current_status = to_status

    db.commit()
    return {
        "message": "Cleared for interview" if outcome == "interview" else "Archived",
        "outcome": outcome,
    }


@router.get("/assignment/{assignment_id}", response_model=List[ReviewOut])
def get_reviews_for_assignment(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    return db.query(Review).filter(Review.assignment_id == assignment_id).all()

@router.get("/candidate/{candidate_id}/summary")
def get_candidate_review_summary(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    assignments = db.query(Assignment).filter(Assignment.candidate_id == candidate_id).all()
    assignment_ids = [a.id for a in assignments]

    rows = (
        db.query(Review, User.full_name)
        .join(User, User.id == Review.reviewer_id)
        .filter(Review.assignment_id.in_(assignment_ids), Review.is_final == True)
        .order_by(Review.submitted_at.asc())
        .all()
    ) if assignment_ids else []

    verdicts = [r.verdict for r, _ in rows]

    return {
        "candidate_id": candidate_id,
        "total_reviews": len(rows),
        "verdicts": {
            "shortlist": verdicts.count("shortlist"),
            "reject": verdicts.count("reject"),
        },
        "reviews": [
            {
                "reviewer_name": name,
                "verdict": r.verdict,
                "notes": r.recommendation,
                "submitted_at": r.submitted_at,
                "admin_action": r.admin_action,
                "admin_note": r.admin_note,
                "outcome": effective_outcome(r.verdict, r.admin_action) if r.admin_action else None,
            } for r, name in rows
        ]
    }

@router.post("/comments", response_model=CommentOut)
def add_comment(
    data: CommentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    comment = ReviewComment(
        **data.model_dump(),
        author_id=current_user.id
    )
    db.add(comment)
    db.commit()
    db.refresh(comment)
    return comment

@router.get("/comments/{candidate_id}", response_model=List[CommentOut])
def get_comments(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    return db.query(ReviewComment).filter(
        ReviewComment.candidate_id == candidate_id,
        ReviewComment.deleted_at == None
    ).order_by(ReviewComment.created_at.asc()).all()