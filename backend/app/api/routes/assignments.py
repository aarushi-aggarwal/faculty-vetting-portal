from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
from datetime import datetime
from pydantic import BaseModel

from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentOut, AssignmentWithNames, ReassignRequest
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _map_row(a, cname, csubj, tname) -> AssignmentWithNames:
    today = datetime.utcnow().date()
    return AssignmentWithNames(
        id=a.id, candidate_id=a.candidate_id, candidate_name=cname,
        candidate_subject=csubj, teacher_id=a.teacher_id, teacher_name=tname,
        priority=a.priority, status=a.status, due_date=a.due_date,
        assigned_at=a.assigned_at,
        overdue=bool(a.due_date and a.due_date < today and a.status not in ("completed", "reassigned")),
    )


# /requests and /my must come before /{assignment_id} to avoid routing conflicts

@router.get("/requests", response_model=List[AssignmentWithNames])
def list_requests(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    """Teacher-submitted review requests waiting for admin approval."""
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .filter(Assignment.status == "requested")
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return [_map_row(a, cn, cs, tn) for a, cn, cs, tn in rows]


@router.get("/my", response_model=List[AssignmentWithNames])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .filter(
            Assignment.teacher_id == current_user.id,
            Assignment.status.notin_(["reassigned", "requested"]),
        )
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return [_map_row(a, cn, cs, tn) for a, cn, cs, tn in rows]


@router.get("/", response_model=List[AssignmentWithNames])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .filter(Assignment.status != "requested")
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return [_map_row(a, cn, cs, tn) for a, cn, cs, tn in rows]


@router.post("/", response_model=AssignmentOut)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    cv = db.query(CV).filter(CV.id == data.cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")
    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")
    existing = db.query(Assignment).filter(
        Assignment.cv_id == data.cv_id, Assignment.teacher_id == data.teacher_id,
        Assignment.status != "reassigned",
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="CV already assigned to this teacher")

    a = Assignment(
        cv_id=data.cv_id, candidate_id=data.candidate_id,
        teacher_id=data.teacher_id, assigned_by=current_user.id,
        priority=data.priority, due_date=data.due_date,
    )
    db.add(a)
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if candidate:
        candidate.current_status = "ASSIGNED"
    db.commit()
    db.refresh(a)
    return a


class RequestReviewInput(BaseModel):
    candidate_id: UUID
    message: Optional[str] = None


@router.post("/request")
def request_review(
    data: RequestReviewInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    """Teacher self-selects a CV and requests to review it."""
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    cv = db.query(CV).filter(CV.candidate_id == data.candidate_id, CV.is_current == True).first()
    if not cv:
        raise HTTPException(status_code=404, detail="No CV found for this candidate")

    existing = db.query(Assignment).filter(
        Assignment.candidate_id == data.candidate_id,
        Assignment.teacher_id == current_user.id,
        Assignment.status.in_(["requested", "pending", "in_review"]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Already requested or assigned for this candidate")

    db.add(Assignment(
        cv_id=cv.id, candidate_id=data.candidate_id,
        teacher_id=current_user.id, assigned_by=current_user.id,
        status="requested", priority="normal",
        reassign_reason=data.message,
    ))
    db.commit()
    return {"message": "Review request submitted — waiting for admin approval"}


@router.patch("/{assignment_id}/approve")
def approve_request(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    a = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.status == "requested"
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Request not found")
    a.status = "pending"
    a.assigned_by = current_user.id
    candidate = db.query(Candidate).filter(Candidate.id == a.candidate_id).first()
    if candidate and candidate.current_status in ("UPLOADED", "PENDING_ASSIGNMENT"):
        candidate.current_status = "ASSIGNED"
    db.commit()
    return {"message": "Request approved — assignment is now pending"}


class DeclineInput(BaseModel):
    reason: Optional[str] = None


@router.patch("/{assignment_id}/decline-request")
def decline_request(
    assignment_id: UUID,
    data: DeclineInput,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    a = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.status == "requested"
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Request not found")
    a.status = "declined"
    a.reassign_reason = data.reason
    db.commit()
    return {"message": "Request declined"}


@router.patch("/{assignment_id}/open")
def mark_opened(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not a.opened_at:
        a.opened_at = datetime.utcnow()
        a.status = "in_review"
        db.commit()
    return {"message": "Marked as opened"}


@router.patch("/{assignment_id}/reassign")
def reassign(
    assignment_id: UUID,
    data: ReassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    a = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not db.query(User).filter(User.id == data.new_teacher_id).first():
        raise HTTPException(status_code=404, detail="New teacher not found")

    a.status = "reassigned"
    a.reassigned_at = datetime.utcnow()
    a.reassign_reason = data.reason

    db.add(Assignment(
        cv_id=a.cv_id, candidate_id=a.candidate_id,
        teacher_id=data.new_teacher_id, assigned_by=current_user.id,
        priority=a.priority, due_date=a.due_date,
    ))
    db.commit()
    return {"message": "Reassigned successfully"}
