from sqlalchemy import Column, String, DateTime, Text, Boolean, Numeric, ForeignKey, JSON, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class Review(Base):
    __tablename__ = "reviews"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    assignment_id = Column(Uuid(as_uuid=True), ForeignKey("assignments.id"), nullable=False)
    reviewer_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    verdict = Column(String(30), nullable=True)
    strengths = Column(Text, nullable=True)
    concerns = Column(Text, nullable=True)
    recommendation = Column(Text, nullable=True)
    scores = Column(JSON, nullable=True)
    overall_score = Column(Numeric(3, 1), nullable=True)
    is_final = Column(Boolean, default=False)
    submitted_at = Column(DateTime, nullable=True)

    # Admin response to the teacher's verdict: "accepted" keeps it, "overridden" inverts it.
    # NULL means the review is still waiting on an admin.
    admin_action = Column(String(20), nullable=True)
    admin_action_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    admin_action_at = Column(DateTime, nullable=True)
    admin_note = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)