from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from uuid import UUID
from app.db.session import get_db
from app.models.user import User
from app.models.role import UserRole, Role
from app.core.security import decode_token
from jose import JWTError

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    try:
        payload = decode_token(token)
        user_id = payload.get("sub")
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

    user = db.query(User).filter(User.id == UUID(user_id), User.deleted_at == None).first()
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User not found or inactive")
    return user

def require_role(*role_names):
    def checker(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
        user_roles = (
            db.query(Role.name)
            .join(UserRole, UserRole.role_id == Role.id)
            .filter(UserRole.user_id == current_user.id, UserRole.revoked_at == None)
            .all()
        )
        user_role_names = [r.name for r in user_roles]

        if "master_admin" in user_role_names:
            return current_user
        if not any(r in user_role_names for r in role_names):
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return current_user
    return checker