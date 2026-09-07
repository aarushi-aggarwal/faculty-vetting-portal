from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional
from uuid import UUID
import os, shutil

from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.candidate_status_history import CandidateStatusHistory
from app.models.assignment import Assignment
from app.models.interview import Interview
from app.models.interview_participant import InterviewParticipant
from app.models.interview_feedback import InterviewFeedback
from app.models.user import User
from app.schemas.candidate import (
    CandidateCreate, CandidateOut, StatusUpdate, VALID_STATUSES,
    CandidateBoardOut, CandidateHistoryOut,
)
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/candidates", tags=["candidates"])

UPLOAD_DIR = "uploads/cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


# Terminal / gray states: nothing further to do.
_CLOSED_STATUSES = {"ACCEPTED", "REJECTED"}


def _action_needed(
    status: str,
    latest_interview: Optional[Interview],
    feedback_counts: tuple[int, int],
) -> tuple[str, bool]:
    """
    Derive the single "what happens next" label for a candidate, per the fixed
    mapping the admin Candidates table is built around. Returns (label, highlight).
    `feedback_counts` is (participant_count, final_feedback_count) for the
    candidate's latest interview round, if any.
    """
    if status in ("UPLOADED", "PENDING_ASSIGNMENT"):
        return "Assign to teacher", False
    if status in ("ASSIGNED", "UNDER_REVIEW"):
        return "Awaiting review", False
    if status == "PENDING_DECISION":
        return "Decision required", True
    if status == "SHORTLISTED":
        return "Schedule interview", False
    if status in ("INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "OFFER_PENDING"):
        participant_count, final_count = feedback_counts
        if participant_count > 0 and final_count >= participant_count:
            return "Final decision", True
        return "Feedback pending", False
    if status in _CLOSED_STATUSES:
        return "Closed", False
    if status == "ON_HOLD":
        return "Archived", False
    return status.replace("_", " ").title(), False


@router.post("/", response_model=CandidateOut)
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


@router.get("/", response_model=List[CandidateOut])
def list_candidates(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    query = db.query(Candidate).filter(Candidate.deleted_at == None)
    if status:
        query = query.filter(Candidate.current_status == status)
    return query.order_by(Candidate.created_at.desc()).all()


# /board must come before /{candidate_id} to avoid routing conflict
@router.get("/board", response_model=List[CandidateBoardOut])
def candidates_board(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    """Everything the admin Candidates table needs, in one call: who has the CV,
    and what the single next action is."""
    candidates = db.query(Candidate).filter(Candidate.deleted_at == None).all()
    if not candidates:
        return []
    candidate_ids = [c.id for c in candidates]

    # Who currently has each CV (skip reassigned-away assignments).
    assignment_rows = (
        db.query(Assignment.candidate_id, User.full_name)
        .join(User, User.id == Assignment.teacher_id)
        .filter(Assignment.candidate_id.in_(candidate_ids), Assignment.status != "reassigned")
        .all()
    )
    assigned_to: dict = {}
    for cid, name in assignment_rows:
        assigned_to.setdefault(cid, []).append(name)

    # Latest interview round per candidate, for the feedback-pending / final-decision split.
    interviews = (
        db.query(Interview)
        .filter(Interview.candidate_id.in_(candidate_ids))
        .order_by(Interview.round_number.desc())
        .all()
    )
    latest_interview: dict = {}
    for iv in interviews:
        latest_interview.setdefault(iv.candidate_id, iv)  # first hit per id = highest round

    latest_ids = [iv.id for iv in latest_interview.values()]
    participant_counts: dict = {}
    final_counts: dict = {}
    if latest_ids:
        for iid, cnt in (
            db.query(InterviewParticipant.interview_id, func.count())
            .filter(InterviewParticipant.interview_id.in_(latest_ids))
            .group_by(InterviewParticipant.interview_id)
            .all()
        ):
            participant_counts[iid] = cnt
        for iid, cnt in (
            db.query(InterviewFeedback.interview_id, func.count())
            .filter(InterviewFeedback.interview_id.in_(latest_ids), InterviewFeedback.is_final == True)
            .group_by(InterviewFeedback.interview_id)
            .all()
        ):
            final_counts[iid] = cnt

    rows = []
    for c in candidates:
        iv = latest_interview.get(c.id)
        counts = (participant_counts.get(iv.id, 0), final_counts.get(iv.id, 0)) if iv else (0, 0)
        label, highlight = _action_needed(c.current_status, iv, counts)
        rows.append(CandidateBoardOut(
            id=c.id, full_name=c.full_name, email=c.email,
            preferred_subject=c.preferred_subject, years_experience=c.years_experience,
            current_status=c.current_status,
            assigned_to=assigned_to.get(c.id, []),
            action_needed=label, action_highlight=highlight,
            updated_at=c.updated_at, created_at=c.created_at,
        ))
    return rows


@router.get("/{candidate_id}/history", response_model=List[CandidateHistoryOut])
def candidate_history(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    """Full status-change timeline for one candidate, most recent first."""
    rows = (
        db.query(CandidateStatusHistory, User.full_name)
        .outerjoin(User, User.id == CandidateStatusHistory.changed_by)
        .filter(CandidateStatusHistory.candidate_id == candidate_id)
        .order_by(CandidateStatusHistory.changed_at.desc())
        .all()
    )
    return [
        CandidateHistoryOut(
            from_status=h.from_status, to_status=h.to_status,
            changed_by_name=name, reason=h.reason, changed_at=h.changed_at,
        )
        for h, name in rows
    ]


@router.post("/{candidate_id}/upload-cv")
def upload_cv(
    candidate_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    db.query(CV).filter(CV.candidate_id == candidate_id).update({"is_current": False})
    version = db.query(CV).filter(CV.candidate_id == candidate_id).count() + 1
    file_key = f"{UPLOAD_DIR}/{candidate_id}_v{version}_{file.filename}"
    with open(file_key, "wb") as f:
        shutil.copyfileobj(file.file, f)

    cv = CV(
        candidate_id=candidate_id, version=version, file_key=file_key,
        file_name=file.filename, file_size_kb=os.path.getsize(file_key) // 1024,
        uploaded_by=current_user.id,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return {"message": "CV uploaded", "cv_id": cv.id, "version": version}


@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.patch("/{candidate_id}/status")
def update_status(
    candidate_id: UUID,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {VALID_STATUSES}")

    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status=candidate.current_status,
        to_status=data.status, changed_by=current_user.id, reason=data.reason,
    ))
    candidate.current_status = data.status
    db.commit()
    return {"message": f"Status updated to {data.status}"}


@router.patch("/{candidate_id}/archive")
def archive_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status=candidate.current_status,
        to_status="ON_HOLD", changed_by=current_user.id, reason="Archived",
    ))
    candidate.current_status = "ON_HOLD"
    db.commit()
    return {"message": "Candidate archived"}


@router.patch("/{candidate_id}/unarchive")
def unarchive_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status="ON_HOLD",
        to_status="PENDING_ASSIGNMENT", changed_by=current_user.id, reason="Unarchived",
    ))
    candidate.current_status = "PENDING_ASSIGNMENT"
    db.commit()
    return {"message": "Candidate unarchived"}
