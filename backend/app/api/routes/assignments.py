from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Dict
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.review import Review
from app.models.user import User
from app.schemas.assignment import (
    AssignmentCreate, AssignmentOut, AssignmentWithNames,
    ReassignRequest, DecisionRequest, VALID_VERDICTS,
)
from app.core.dependencies import require_role

router = APIRouter(prefix="/assignments", tags=["assignments"])


def _verdicts_for(db: Session, assignments) -> Dict[UUID, str]:
    """Map assignment_id -> final verdict, for assignments that have been decided."""
    ids = [a.id for a in assignments]
    if not ids:
        return {}
    rows = (
        db.query(Review.assignment_id, Review.verdict)
        .filter(Review.assignment_id.in_(ids), Review.is_final == True)
        .all()
    )
    return {aid: verdict for aid, verdict in rows}


def _map_row(a, cname, csubj, tname, verdict=None) -> AssignmentWithNames:
    today = datetime.utcnow().date()
    return AssignmentWithNames(
        id=a.id, candidate_id=a.candidate_id, candidate_name=cname,
        candidate_subject=csubj, teacher_id=a.teacher_id, teacher_name=tname,
        priority=a.priority, status=a.status, due_date=a.due_date,
        assigned_at=a.assigned_at, completed_at=a.completed_at, verdict=verdict,
        overdue=bool(a.due_date and a.due_date < today and a.status not in ("completed", "reassigned")),
    )


def _rows_to_out(db: Session, rows) -> List[AssignmentWithNames]:
    verdicts = _verdicts_for(db, [r[0] for r in rows])
    return [_map_row(a, cn, cs, tn, verdicts.get(a.id)) for a, cn, cs, tn in rows]


# /my must come before /{assignment_id} to avoid routing conflicts

@router.get("/my", response_model=List[AssignmentWithNames])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    """Every CV ever assigned to the logged-in teacher — pending and already scanned."""
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .filter(
            Assignment.teacher_id == current_user.id,
            Assignment.status != "reassigned",
        )
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return _rows_to_out(db, rows)


@router.get("/", response_model=List[AssignmentWithNames])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    return _rows_to_out(db, rows)


@router.post("/", response_model=AssignmentOut)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    """Admin assigns a candidate's CV to a teacher to scan and shortlist."""
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    if data.cv_id:
        cv = db.query(CV).filter(CV.id == data.cv_id).first()
    else:
        cv = db.query(CV).filter(
            CV.candidate_id == data.candidate_id, CV.is_current == True
        ).first()
    if not cv:
        raise HTTPException(status_code=404, detail="No CV found for this candidate")

    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    existing = db.query(Assignment).filter(
        Assignment.candidate_id == data.candidate_id,
        Assignment.teacher_id == data.teacher_id,
        Assignment.status.notin_(["reassigned", "completed"]),
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="CV already assigned to this teacher")

    a = Assignment(
        cv_id=cv.id, candidate_id=data.candidate_id,
        teacher_id=data.teacher_id, assigned_by=current_user.id,
        priority=data.priority, due_date=data.due_date,
    )
    db.add(a)
    if candidate.current_status in ("UPLOADED", "PENDING_ASSIGNMENT"):
        candidate.current_status = "ASSIGNED"
    db.commit()
    db.refresh(a)
    return a


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
        candidate = db.query(Candidate).filter(Candidate.id == a.candidate_id).first()
        if candidate and candidate.current_status in ("UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED"):
            candidate.current_status = "UNDER_REVIEW"
        db.commit()
    return {"message": "Marked as opened"}


@router.post("/{assignment_id}/decision")
def record_decision(
    assignment_id: UUID,
    data: DecisionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    """Teacher scans an assigned CV and decides: shortlist for interview, or reject."""
    if data.verdict not in VALID_VERDICTS:
        raise HTTPException(status_code=400, detail=f"Invalid verdict. Choose from {VALID_VERDICTS}")

    a = db.query(Assignment).filter(
        Assignment.id == assignment_id, Assignment.teacher_id == current_user.id
    ).first()
    if not a:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if a.status == "completed":
        raise HTTPException(status_code=400, detail="This CV has already been scanned")

    now = datetime.utcnow()
    db.add(Review(
        assignment_id=a.id, reviewer_id=current_user.id,
        verdict=data.verdict, recommendation=data.notes,
        is_final=True, submitted_at=now,
    ))
    a.status = "completed"
    a.completed_at = now

    candidate = db.query(Candidate).filter(Candidate.id == a.candidate_id).first()
    if candidate:
        if data.verdict == "shortlist":
            # Shortlisted CVs go back to Admin L2 to be put up for interviews.
            if candidate.current_status in ("UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW"):
                candidate.current_status = "SHORTLISTED"
        else:
            # Only reject once nobody else is still scanning this candidate.
            others_open = db.query(Assignment).filter(
                Assignment.candidate_id == a.candidate_id,
                Assignment.id != a.id,
                Assignment.status.notin_(["completed", "reassigned"]),
            ).count()
            if not others_open and candidate.current_status in ("ASSIGNED", "UNDER_REVIEW"):
                candidate.current_status = "REJECTED"

    db.commit()
    return {"message": f"Recorded as {data.verdict}"}


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
