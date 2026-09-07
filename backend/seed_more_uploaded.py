"""Add more UPLOADED candidates, ready to be assigned. Run once: python seed_more_uploaded.py"""
from app.db.session import SessionLocal
from app.models.user import User  # noqa: F401 — registers users table for CV's FK
from app.models.candidate import Candidate
from app.models.cv import CV

NEW_CANDIDATES = [
    ("Meera Krishnan", "meera.k@example.com", "Physics", 4, "M.Sc. Physics", "Delhi Public School"),
    ("Arjun Nair", "arjun.nair@example.com", "Mathematics", 6, "M.Sc. Mathematics", "St. Xavier's College"),
    ("Fatima Sheikh", "fatima.sheikh@example.com", "English", 3, "M.A. English Literature", "Ryan International"),
    ("Vikram Malhotra", "vikram.m@example.com", "Chemistry", 8, "Ph.D. Chemistry", "IIT Kanpur"),
    ("Ananya Reddy", "ananya.reddy@example.com", "Biology", 5, "M.Sc. Zoology", "National Public School"),
    ("Rohan Kapoor", "rohan.kapoor@example.com", "Computer Science", 2, "B.Tech CSE", "DPS Bangalore"),
]

db = SessionLocal()
try:
    added = 0
    for name, email, subject, exp, qual, employer in NEW_CANDIDATES:
        if db.query(Candidate).filter(Candidate.email == email).first():
            continue
        c = Candidate(
            full_name=name, email=email, preferred_subject=subject,
            years_experience=exp, highest_qualification=qual, current_employer=employer,
            current_status="UPLOADED", source="seed_more_uploaded",
        )
        db.add(c)
        db.flush()
        db.add(CV(candidate_id=c.id, version=1, is_current=True,
                  file_key=f"uploads/cvs/{c.id}_v1_seed.pdf", file_name=f"{name.replace(' ', '_')}_CV.pdf"))
        added += 1
        print(f"  + {name} ({subject})")
    db.commit()
    print(f"\nAdded {added} candidate(s).")
finally:
    db.close()
