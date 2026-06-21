from app.db.session import SessionLocal
from app.models.role import Role

def seed_roles():
    db = SessionLocal()
    try:
        existing = db.query(Role).first()
        if existing:
            print("Roles already seeded.")
            return

        roles = [
            Role(
                name="master_admin",
                display_name="Master Admin",
                permissions=["*"]
            ),
            Role(
                name="admin_l2",
                display_name="Admin L2",
                permissions=[
                    "cv.view", "cv.assign", "cv.upload",
                    "interview.schedule", "interview.view",
                    "dashboard.view", "user.view"
                ]
            ),
            Role(
                name="teacher",
                display_name="Teacher",
                permissions=[
                    "cv.view_assigned",
                    "review.submit",
                    "interview.participate",
                    "interview_feedback.submit"
                ]
            ),
        ]

        db.add_all(roles)
        db.commit()
        print("Roles seeded successfully.")
    finally:
        db.close()