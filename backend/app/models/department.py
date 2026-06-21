from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class Department(Base):
    __tablename__ = "departments"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=True)
    head_user_id = Column(Uuid(as_uuid=True), ForeignKey("users.id"), nullable=True)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)