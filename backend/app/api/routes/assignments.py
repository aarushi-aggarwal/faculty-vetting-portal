from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.assignment import Assignment
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.user import User
from app.schemas.assignment import AssignmentCreate, AssignmentOut, AssignmentWithNames, ReassignRequest
from app.core.dependencies import require_role, get_current_user

router = APIRouter(prefix="/assignments", tags=["assignments"])

@router.post("/", response_model=AssignmentOut)
def create_assignment(
    data: AssignmentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    # Verify CV exists
    cv = db.query(CV).filter(CV.id == data.cv_id).first()
    if not cv:
        raise HTTPException(status_code=404, detail="CV not found")

    # Verify teacher exists
    teacher = db.query(User).filter(User.id == data.teacher_id).first()
    if not teacher:
        raise HTTPException(status_code=404, detail="Teacher not found")

    # Check not already assigned to same teacher
    existing = db.query(Assignment).filter(
        Assignment.cv_id == data.cv_id,
        Assignment.teacher_id == data.teacher_id,
        Assignment.status != "reassigned"
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="CV already assigned to this teacher")

    assignment = Assignment(
        cv_id=data.cv_id,
        candidate_id=data.candidate_id,
        teacher_id=data.teacher_id,
        assigned_by=current_user.id,
        priority=data.priority,
        due_date=data.due_date
    )
    db.add(assignment)

    # Update candidate status
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if candidate:
        candidate.current_status = "ASSIGNED"

    db.commit()
    db.refresh(assignment)
    return assignment

@router.get("/", response_model=List[AssignmentWithNames])
def list_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    today = datetime.utcnow().date()
    return [
        AssignmentWithNames(
            id=a.id,
            candidate_id=a.candidate_id,
            candidate_name=cname,
            candidate_subject=csubj,
            teacher_id=a.teacher_id,
            teacher_name=tname,
            priority=a.priority,
            status=a.status,
            due_date=a.due_date,
            assigned_at=a.assigned_at,
            overdue=bool(a.due_date and a.due_date < today and a.status not in ("completed", "reassigned")),
        )
        for a, cname, csubj, tname in rows
    ]

@router.get("/my", response_model=List[AssignmentWithNames])
def my_assignments(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    rows = (
        db.query(Assignment, Candidate.full_name, Candidate.preferred_subject, User.full_name)
        .join(Candidate, Candidate.id == Assignment.candidate_id)
        .join(User, User.id == Assignment.teacher_id)
        .filter(Assignment.teacher_id == current_user.id, Assignment.status != "reassigned")
        .order_by(Assignment.assigned_at.desc())
        .all()
    )
    today = datetime.utcnow().date()
    return [
        AssignmentWithNames(
            id=a.id,
            candidate_id=a.candidate_id,
            candidate_name=cname,
            candidate_subject=csubj,
            teacher_id=a.teacher_id,
            teacher_name=tname,
            priority=a.priority,
            status=a.status,
            due_date=a.due_date,
            assigned_at=a.assigned_at,
            overdue=bool(a.due_date and a.due_date < today and a.status not in ("completed", "reassigned")),
        )
        for a, cname, csubj, tname in rows
    ]

@router.patch("/{assignment_id}/open")
def mark_opened(
    assignment_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")
    if not assignment.opened_at:
        assignment.opened_at = datetime.utcnow()
        assignment.status = "in_review"
        db.commit()
    return {"message": "Marked as opened"}

@router.patch("/{assignment_id}/reassign")
def reassign(
    assignment_id: UUID,
    data: ReassignRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    assignment = db.query(Assignment).filter(Assignment.id == assignment_id).first()
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    new_teacher = db.query(User).filter(User.id == data.new_teacher_id).first()
    if not new_teacher:
        raise HTTPException(status_code=404, detail="New teacher not found")

    # Mark old assignment as reassigned
    assignment.status = "reassigned"
    assignment.reassigned_at = datetime.utcnow()
    assignment.reassign_reason = data.reason

    # Create new assignment
    new_assignment = Assignment(
        cv_id=assignment.cv_id,
        candidate_id=assignment.candidate_id,
        teacher_id=data.new_teacher_id,
        assigned_by=current_user.id,
        priority=assignment.priority,
        due_date=assignment.due_date
    )
    db.add(new_assignment)
    db.commit()
    return {"message": "Reassigned successfully"}