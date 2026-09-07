"""
Idempotent schema + data migration. Safe to run repeatedly.

    python migrate.py

1. Adds the admin-decision columns to `reviews` (SQLAlchemy's create_all only
   creates missing tables, never missing columns).
2. Grants the `teacher` role to every admin, so admins can be put on review
   queues and interview panels like anyone else.
3. Normalises legacy assignment statuses from the removed request/decline flow.
"""
import sys

from sqlalchemy import inspect, text

from app.db.session import SessionLocal, engine
from app.models.role import Role, UserRole
from app.models.user import User

NEW_REVIEW_COLUMNS = {
    "admin_action": "VARCHAR(20)",
    "admin_action_by": "UUID",
    "admin_action_at": "TIMESTAMP",
    "admin_note": "TEXT",
}


def add_review_columns() -> None:
    existing = {c["name"] for c in inspect(engine).get_columns("reviews")}
    missing = {k: v for k, v in NEW_REVIEW_COLUMNS.items() if k not in existing}
    if not missing:
        print("reviews: all admin-decision columns already present")
        return
    with engine.begin() as conn:
        for name, ddl_type in missing.items():
            conn.execute(text(f"ALTER TABLE reviews ADD COLUMN {name} {ddl_type}"))
            print(f"reviews: added column {name}")


def backfill_teacher_role() -> None:
    db = SessionLocal()
    try:
        teacher = db.query(Role).filter(Role.name == "teacher").first()
        if not teacher:
            print("teacher role missing — run seed_data.py first")
            return

        admins = (
            db.query(User)
            .join(UserRole, UserRole.user_id == User.id)
            .join(Role, Role.id == UserRole.role_id)
            .filter(
                User.deleted_at == None,
                UserRole.revoked_at == None,
                Role.name.in_(["master_admin", "admin_l2"]),
            )
            .distinct()
            .all()
        )

        added = 0
        for user in admins:
            already = db.query(UserRole).filter(
                UserRole.user_id == user.id,
                UserRole.role_id == teacher.id,
                UserRole.revoked_at == None,
            ).first()
            if already:
                continue
            db.add(UserRole(user_id=user.id, role_id=teacher.id))
            print(f"  + teacher role -> {user.email}")
            added += 1
        db.commit()
        print(f"teacher role: {added} admin(s) updated, {len(admins)} admin(s) checked")
    finally:
        db.close()


def normalise_assignment_statuses() -> None:
    """`declined` and `requested` came from the teacher self-request flow, now removed."""
    with engine.begin() as conn:
        for legacy, replacement in (("declined", "completed"), ("requested", "pending")):
            result = conn.execute(
                text("UPDATE assignments SET status = :new WHERE status = :old"),
                {"new": replacement, "old": legacy},
            )
            if result.rowcount:
                print(f"assignments: {result.rowcount} '{legacy}' -> '{replacement}'")


if __name__ == "__main__":
    try:
        add_review_columns()
        backfill_teacher_role()
        normalise_assignment_statuses()
        print("\nMigration complete.")
    except Exception as exc:
        print(f"\nMigration failed: {exc}")
        sys.exit(1)
