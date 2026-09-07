from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import date, datetime

VALID_VERDICTS = ["shortlist", "reject"]

class AssignmentCreate(BaseModel):
    candidate_id: UUID
    teacher_id: UUID
    cv_id: Optional[UUID] = None
    priority: Optional[str] = "normal"
    due_date: Optional[date] = None

class AssignmentOut(BaseModel):
    id: UUID
    cv_id: UUID
    candidate_id: UUID
    teacher_id: UUID
    assigned_by: UUID
    status: str
    priority: str
    due_date: Optional[date]
    assigned_at: datetime
    opened_at: Optional[datetime]
    completed_at: Optional[datetime]

    class Config:
        from_attributes = True

class ReassignRequest(BaseModel):
    new_teacher_id: UUID
    reason: str

class DecisionRequest(BaseModel):
    verdict: str
    notes: Optional[str] = None

class AssignmentWithNames(BaseModel):
    id: UUID
    candidate_id: UUID
    candidate_name: str
    candidate_subject: Optional[str]
    teacher_id: UUID
    teacher_name: str
    priority: str
    status: str
    due_date: Optional[date]
    assigned_at: datetime
    completed_at: Optional[datetime] = None
    verdict: Optional[str] = None
    overdue: bool
