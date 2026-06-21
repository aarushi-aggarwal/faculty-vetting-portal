from pydantic import BaseModel, EmailStr
from uuid import UUID
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str
    password: str

class UserOut(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserWithRoles(BaseModel):
    id: UUID
    email: str
    full_name: str
    is_active: bool
    roles: List[str]