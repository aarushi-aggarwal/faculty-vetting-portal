from sqlalchemy import Column, String, DateTime, ForeignKey, Uuid
# from sqlalchemy.dialects.postgresql import UUID  # switch back for PostgreSQL
from datetime import datetime
import uuid
from app.db.base import Base

class Subject(Base):
    __tablename__ = "subjects"

    id = Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)
    department_id = Column(Uuid(as_uuid=True), ForeignKey("departments.id"), nullable=False)
    name = Column(String(200), nullable=False)
    code = Column(String(20), nullable=True)
    level = Column(String(20), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)