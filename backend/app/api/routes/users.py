from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from typing import List
from uuid import UUID

from app.db.session import get_db
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.dependencies import require_role
from app.core.security import hash_password
from app.schemas.user import UserWithRoles, UpdateProfileRequest
from pydantic import BaseModel

router = APIRouter(prefix="/users", tags=["users"])


def _user_with_roles(u: User, db: Session) -> UserWithRoles:
    roles = (
        db.query(Role.name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == u.id, UserRole.revoked_at == None)
        .all()
    )
    return UserWithRoles(
        id=u.id, email=u.email, full_name=u.full_name,
        is_active=u.is_active, roles=[r.name for r in roles],
    )


@router.get("/", response_model=List[UserWithRoles])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2")),
):
    users = db.query(User).filter(User.deleted_at == None).order_by(User.full_name).all()
    return [_user_with_roles(u, db) for u in users]


@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    roles = (
        db.query(Role.name, Role.display_name)
        .join(UserRole, UserRole.role_id == Role.id)
        .filter(UserRole.user_id == current_user.id, UserRole.revoked_at == None)
        .all()
    )
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "roles": [{"name": r.name, "display_name": r.display_name} for r in roles],
    }


@router.patch("/me")
def update_me(
    data: UpdateProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher")),
):
    if data.full_name:
        current_user.full_name = data.full_name
    if data.new_password:
        if len(data.new_password) < 6:
            raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
        current_user.password_hash = hash_password(data.new_password)
    current_user.updated_at = datetime.utcnow()
    db.commit()
    return {"message": "Profile updated"}


class AssignRoleRequest(BaseModel):
    user_id: UUID
    role_name: str


@router.post("/assign-role")
def assign_role(
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin")),
):
    user = db.query(User).filter(User.id == data.user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    role = db.query(Role).filter(Role.name == data.role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    existing = db.query(UserRole).filter(
        UserRole.user_id == data.user_id,
        UserRole.role_id == role.id,
        UserRole.revoked_at == None,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned")

    db.add(UserRole(user_id=data.user_id, role_id=role.id, granted_by=current_user.id))
    db.commit()
    return {"message": f"Role '{data.role_name}' assigned"}


@router.delete("/{user_id}/roles/{role_name}")
def revoke_role(
    user_id: UUID,
    role_name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin")),
):
    role = db.query(Role).filter(Role.name == role_name).first()
    if not role:
        raise HTTPException(status_code=404, detail="Role not found")

    user_role = db.query(UserRole).filter(
        UserRole.user_id == user_id,
        UserRole.role_id == role.id,
        UserRole.revoked_at == None,
    ).first()
    if not user_role:
        raise HTTPException(status_code=404, detail="Role not assigned to this user")

    user_role.revoked_at = datetime.utcnow()
    db.commit()
    return {"message": f"Role '{role_name}' revoked"}


@router.patch("/{user_id}/active")
def toggle_active(
    user_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin")),
):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    db.commit()
    return {"message": "Status updated", "is_active": user.is_active}
