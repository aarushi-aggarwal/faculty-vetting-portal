from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.db.session import get_db
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.dependencies import require_role
from app.schemas.user import UserWithRoles
from pydantic import BaseModel
from uuid import UUID

router = APIRouter(prefix="/users", tags=["users"])

class AssignRoleRequest(BaseModel):
    user_id: UUID
    role_name: str

@router.get("/", response_model=List[UserWithRoles])
def list_users(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    users = db.query(User).filter(User.deleted_at == None).order_by(User.full_name).all()
    result = []
    for u in users:
        roles = (
            db.query(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == u.id, UserRole.revoked_at == None)
            .all()
        )
        result.append(UserWithRoles(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            is_active=u.is_active,
            roles=[r.name for r in roles],
        ))
    return result

@router.post("/assign-role")
def assign_role(
    data: AssignRoleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin"))
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
        UserRole.revoked_at == None
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Role already assigned")

    user_role = UserRole(
        user_id=data.user_id,
        role_id=role.id,
        granted_by=current_user.id
    )
    db.add(user_role)
    db.commit()
    return {"message": f"Role '{data.role_name}' assigned successfully"}

@router.get("/me")
def get_me(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
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
        "roles": [{"name": r.name, "display_name": r.display_name} for r in roles]
    }