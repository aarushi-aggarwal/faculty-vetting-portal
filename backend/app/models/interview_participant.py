from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class InterviewParticipant(Base):
    __tablename__ = "interview_participants"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    interview_id = Column(Uuid(as_uuid=True), ForeignKey("interviews.id"), nullable=False)
    user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    role = Column(String(30), nullable=False, default="co_interviewer")
    invite_sent_at = Column(DateTime, nullable=True)
    rsvp_status = Column(String(20), nullable=True, default="no_response")
    added_at = Column(DateTime, default=datetime.utcnow)