from sqlalchemy import Column, String, DateTime, Integer, Boolean, ForeignKey, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class CV(Base):
    __tablename__ = "cvs"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    candidate_id = Column(Uuid(as_uuid=True), ForeignKey("candidates.id"), nullable=False)
    version = Column(Integer, nullable=False, default=1)
    is_current = Column(Boolean, default=True)
    file_key = Column(String, nullable=False)
    file_name = Column(String(255), nullable=False)
    file_size_kb = Column(Integer, nullable=True)
    mime_type = Column(String(100), nullable=False, default="application/pdf")
    uploaded_by = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    uploaded_at = Column(DateTime, default=datetime.utcnow)