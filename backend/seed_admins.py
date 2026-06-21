"""
Run once to create the 3 master admin accounts.
Usage:  python seed_admins.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from app.db.session import SessionLocal
from app.models.user import User
from app.models.role import Role, UserRole
from app.core.security import hash_password

ADMINS = [
    {"email": "aarushi.ois1212@gmail.com",              "full_name": "Aarushi"},
    {"email": "harisha@hotmail.com",                     "full_name": "Harisha"},
    {"email": "harish.aggarwal@pilani.bits-pilani.ac.in","full_name": "Harish Aggarwal"},
]
DEFAULT_PASSWORD = "Admin@1234"

def main():
    db = SessionLocal()
    try:
        role = db.query(Role).filter(Role.name == "master_admin").first()
        if not role:
            print("ERROR: Roles not seeded yet. Start the FastAPI server once first, then re-run this script.")
            return

        for a in ADMINS:
            existing = db.query(User).filter(User.email == a["email"]).first()
            if existing:
                print(f"  SKIP (already exists): {a['email']}")
                continue

            user = User(
                email=a["email"],
                full_name=a["full_name"],
                password_hash=hash_password(DEFAULT_PASSWORD),
                is_active=True,
            )
            db.add(user)
            db.flush()

            db.add(UserRole(user_id=user.id, role_id=role.id))
            db.commit()
            print(f"  CREATED master_admin: {a['email']}")

        print("\nDone. Password for all 3 accounts: Admin@1234")
    finally:
        db.close()

if __name__ == "__main__":
    main()
