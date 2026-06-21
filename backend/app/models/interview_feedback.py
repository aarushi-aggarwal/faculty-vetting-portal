from sqlalchemy import Column, String, DateTime, Text, Boolean, Numeric, ForeignKey, SmallInteger, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class InterviewFeedback(Base):
    __tablename__ = "interview_feedback"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(Uuid(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    interviewer_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    outcome = Column(String(20), nullable=True)
    domain_score = Column(SmallInteger, nullable=True)
    communication_score = Column(SmallInteger, nullable=True)
    experience_score = Column(SmallInteger, nullable=True)
    availability_score = Column(SmallInteger, nullable=True)
    overall_score = Column(Numeric(3, 1), nullable=True)
    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)
    is_final = Column(Boolean, default=False)
    submitted_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)