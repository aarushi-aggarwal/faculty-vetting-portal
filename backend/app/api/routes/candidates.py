from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional
from uuid import UUID
import os, shutil

from app.db.session import get_db
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.candidate_status_history import CandidateStatusHistory
from app.schemas.candidate import CandidateCreate, CandidateOut, StatusUpdate, VALID_STATUSES
from app.core.dependencies import require_role, get_current_user
from app.models.user import User

router = APIRouter(prefix="/candidates", tags=["candidates"])

UPLOAD_DIR = "uploads/cvs"
os.makedirs(UPLOAD_DIR, exist_ok=True)


@router.post("/", response_model=CandidateOut)
def create_candidate(
    data: CandidateCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = Candidate(**data.model_dump())
    db.add(candidate)
    db.commit()
    db.refresh(candidate)
    return candidate


# /available must come before /{candidate_id} to avoid routing conflict
@router.get("/available", response_model=List[CandidateOut])
def available_candidates(
    subject: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    """Candidates in PENDING_ASSIGNMENT or UPLOADED state — shown to teachers for self-selection."""
    query = db.query(Candidate).filter(
        Candidate.deleted_at == None,
        Candidate.current_status.in_(["PENDING_ASSIGNMENT", "UPLOADED"]),
    )
    if subject:
        query = query.filter(Candidate.preferred_subject.ilike(f"%{subject}%"))
    return query.order_by(Candidate.created_at.desc()).all()


@router.get("/", response_model=List[CandidateOut])
def list_candidates(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    query = db.query(Candidate).filter(Candidate.deleted_at == None)
    if status:
        query = query.filter(Candidate.current_status == status)
    return query.order_by(Candidate.created_at.desc()).all()


@router.post("/{candidate_id}/upload-cv")
def upload_cv(
    candidate_id: UUID,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    if not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files allowed")

    db.query(CV).filter(CV.candidate_id == candidate_id).update({"is_current": False})
    version = db.query(CV).filter(CV.candidate_id == candidate_id).count() + 1
    file_key = f"{UPLOAD_DIR}/{candidate_id}_v{version}_{file.filename}"
    with open(file_key, "wb") as f:
        shutil.copyfileobj(file.file, f)

    cv = CV(
        candidate_id=candidate_id, version=version, file_key=file_key,
        file_name=file.filename, file_size_kb=os.path.getsize(file_key) // 1024,
        uploaded_by=current_user.id,
    )
    db.add(cv)
    db.commit()
    db.refresh(cv)
    return {"message": "CV uploaded", "cv_id": cv.id, "version": version}


@router.get("/{candidate_id}", response_model=CandidateOut)
def get_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    return candidate


@router.patch("/{candidate_id}/status")
def update_status(
    candidate_id: UUID,
    data: StatusUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    if data.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Invalid status: {VALID_STATUSES}")

    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status=candidate.current_status,
        to_status=data.status, changed_by=current_user.id, reason=data.reason,
    ))
    candidate.current_status = data.status
    db.commit()
    return {"message": f"Status updated to {data.status}"}


@router.patch("/{candidate_id}/archive")
def archive_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status=candidate.current_status,
        to_status="ON_HOLD", changed_by=current_user.id, reason="Archived",
    ))
    candidate.current_status = "ON_HOLD"
    db.commit()
    return {"message": "Candidate archived"}


@router.patch("/{candidate_id}/unarchive")
def unarchive_candidate(
    candidate_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    candidate = db.query(Candidate).filter(
        Candidate.id == candidate_id, Candidate.deleted_at == None
    ).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")
    db.add(CandidateStatusHistory(
        candidate_id=candidate_id, from_status="ON_HOLD",
        to_status="PENDING_ASSIGNMENT", changed_by=current_user.id, reason="Unarchived",
    ))
    candidate.current_status = "PENDING_ASSIGNMENT"
    db.commit()
    return {"message": "Candidate unarchived"}
