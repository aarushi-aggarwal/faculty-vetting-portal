from sqlalchemy import Column, String, DateTime, Text, Integer, ForeignKey, SmallInteger
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
from app.db.base import Base

class Interview(Base):
    __tablename__ = "interviews"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(UUID(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    round_number = Column(SmallInteger, nullable=False, default=1)
    parent_interview_id = Column(UUID(as_uuid=True), ForeignKey("interviews.id"), nullable=True)
    scheduled_by = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=False)
    timezone = Column(String(50), nullable=False, default="Asia/Kolkata")
    meeting_link = Column(Text, nullable=True)
    meeting_platform = Column(String(50), nullable=True)
    calendar_event_id = Column(Text, nullable=True)
    status = Column(String(30), nullable=False, default="scheduled")
    reschedule_count = Column(SmallInteger, nullable=False, default=0)
    cancellation_reason = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)