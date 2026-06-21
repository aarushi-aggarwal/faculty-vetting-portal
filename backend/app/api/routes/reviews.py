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
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewOut, CommentCreate, CommentOut, VALID_VERDICTS
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/reviews", tags=["reviews"])

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
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    assignments = db.query(Assignment).filter(Assignment.candidate_id == candidate_id).all()
    assignment_ids = [a.id for a in assignments]

    reviews = db.query(Review).filter(
        Review.assignment_id.in_(assignment_ids),
        Review.is_final == True
    ).all()

    verdicts = [r.verdict for r in reviews]
    scores = [float(r.overall_score) for r in reviews if r.overall_score]

    return {
        "candidate_id": candidate_id,
        "total_reviews": len(reviews),
        "verdicts": {
            "shortlist": verdicts.count("shortlist"),
            "reject": verdicts.count("reject"),
            "flag_discussion": verdicts.count("flag_discussion")
        },
        "average_score": round(sum(scores) / len(scores), 2) if scores else None,
        "reviews": [
            {
                "verdict": r.verdict,
                "overall_score": r.overall_score,
                "strengths": r.strengths,
                "concerns": r.concerns,
                "submitted_at": r.submitted_at
            } for r in reviews
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