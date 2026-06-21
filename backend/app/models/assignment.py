from sqlalchemy import Column, String, DateTime, Date, ForeignKey, Text, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class Assignment(Base):
    __tablename__ = "assignments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    cv_id = Column(Uuid(as_uuid=True), ForeignKey("cvs.id"), nullable=False)
    candidate_id = Column(Uuid(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    teacher_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    assigned_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    status = Column(String(50), nullable=False, default="pending")
    priority = Column(String(20), nullable=False, default="normal")
    due_date = Column(Date, nullable=True)
    assigned_at = Column(DateTime, default=datetime.utcnow)
    opened_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    reassigned_at = Column(DateTime, nullable=True)
    reassign_reason = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)