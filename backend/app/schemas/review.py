from pydantic import BaseModel
from typing import Optional, Dict
from uuid import UUID
from datetime import datetime

VALID_VERDICTS = ["shortlist", "reject", "flag_discussion"]

# What an admin can do with a teacher's verdict.
VALID_ADMIN_ACTIONS = ["accepted", "overridden"]


class AdminDecisionRequest(BaseModel):
    """Admin accepts the teacher's verdict, or overrides it (inverting the outcome)."""
    action: str
    note: Optional[str] = None


class PendingReviewOut(BaseModel):
    review_id: UUID
    candidate_id: UUID
    candidate_name: str
    candidate_subject: Optional[str]
    teacher_name: str
    verdict: str
    reasoning: Optional[str]
    submitted_at: Optional[datetime]

class ReviewCreate(BaseModel):
    assignment_id: UUID
    verdict: Optional[str] = None
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    recommendation: Optional[str] = None
    scores: Optional[Dict[str, float]] = None
    overall_score: Optional[float] = None

class ReviewOut(BaseModel):
    id: UUID
    assignment_id: UUID
    reviewer_id: UUID
    verdict: Optional[str]
    strengths: Optional[str]
    concerns: Optional[str]
    recommendation: Optional[str]
    scores: Optional[Dict]
    overall_score: Optional[float]
    is_final: bool
    submitted_at: Optional[datetime]
    created_at: datetime

    class Config:
        from_attributes = True

class CommentCreate(BaseModel):
    candidate_id: UUID
    body: str
    parent_id: Optional[UUID] = None
    is_internal: Optional[bool] = False

class CommentOut(BaseModel):
    id: UUID
    candidate_id: UUID
    author_id: UUID
    parent_id: Optional[UUID]
    body: str
    is_internal: bool
    created_at: datetime

    class Config:
        from_attributes = True