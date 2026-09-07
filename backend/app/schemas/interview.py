from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

VALID_OUTCOMES = ["proceed", "hold", "reject"]
VALID_PLATFORMS = ["google_meet", "zoom", "teams", "in_person"]

class ParticipantIn(BaseModel):
    user_id: UUID
    role: Optional[str] = "co_interviewer"

class InterviewCreate(BaseModel):
    candidate_id: UUID
    start_time: datetime
    end_time: datetime
    timezone: Optional[str] = "Asia/Kolkata"
    meeting_link: Optional[str] = None
    meeting_platform: Optional[str] = None
    notes: Optional[str] = None
    participants: Optional[List[ParticipantIn]] = []
    parent_interview_id: Optional[UUID] = None

class InterviewOut(BaseModel):
    id: UUID
    candidate_id: UUID
    round_number: int
    scheduled_by: UUID
    start_time: datetime
    end_time: datetime
    timezone: str
    meeting_link: Optional[str]
    meeting_platform: Optional[str]
    status: str
    reschedule_count: int
    notes: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class InterviewWithNames(BaseModel):
    id: UUID
    candidate_id: UUID
    candidate_name: str
    candidate_email: str
    round_number: int
    status: str
    start_time: datetime
    end_time: datetime
    meeting_platform: Optional[str]
    meeting_link: Optional[str]
    panel: List[str] = []

class RescheduleRequest(BaseModel):
    start_time: datetime
    end_time: datetime
    reason: Optional[str] = None

class FeedbackCreate(BaseModel):
    outcome: Optional[str] = None
    domain_score: Optional[int] = None
    communication_score: Optional[int] = None
    experience_score: Optional[int] = None
    availability_score: Optional[int] = None
    overall_score: Optional[float] = None
    strengths: Optional[str] = None
    concerns: Optional[str] = None
    notes: Optional[str] = None

class FeedbackOut(BaseModel):
    id: UUID
    interview_id: UUID
    interviewer_id: UUID
    outcome: Optional[str]
    domain_score: Optional[int]
    communication_score: Optional[int]
    experience_score: Optional[int]
    availability_score: Optional[int]
    overall_score: Optional[float]
    strengths: Optional[str]
    concerns: Optional[str]
    notes: Optional[str]
    is_final: bool
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True