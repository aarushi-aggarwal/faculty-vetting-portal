from pydantic import BaseModel, EmailStr
from typing import Optional
from uuid import UUID
from datetime import datetime

VALID_STATUSES = [
    "UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW",
    "PENDING_DECISION",          # teacher has scanned it; waiting on an admin
    "SHORTLISTED",               # admin cleared it for interview
    "INTERVIEW_SCHEDULED", "INTERVIEW_DONE",
    "OFFER_PENDING", "ACCEPTED", "REJECTED", "ON_HOLD"
]

class CandidateCreate(BaseModel):
    full_name: str
    email: EmailStr
    phone: Optional[str] = None
    current_employer: Optional[str] = None
    years_experience: Optional[int] = None
    highest_qualification: Optional[str] = None
    preferred_subject: Optional[str] = None
    source: Optional[str] = None
    notes: Optional[str] = None

class CandidateOut(BaseModel):
    id: UUID
    full_name: str
    email: str
    phone: Optional[str]
    current_employer: Optional[str]
    years_experience: Optional[int]
    highest_qualification: Optional[str]
    preferred_subject: Optional[str]
    current_status: str
    source: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True

class StatusUpdate(BaseModel):
    status: str
    reason: Optional[str] = None