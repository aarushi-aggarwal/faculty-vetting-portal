from sqlalchemy import Column, String, DateTime, Text, Boolean, ForeignKey, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class ReviewComment(Base):
    __tablename__ = "review_comments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    author_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(Uuid(as_uuid=True), ForeignKey("review_comments.id"), nullable=True)
    body = Column(Text, nullable=False)
    is_internal = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)