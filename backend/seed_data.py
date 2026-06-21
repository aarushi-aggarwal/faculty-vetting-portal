"""
Full demo seed — covers every portal feature.
Run AFTER: backend is running (tables created) + seed_admins.py has run.
Usage: python seed_data.py
"""
import sys, os
sys.path.insert(0, os.path.dirname(__file__))

from datetime import datetime, timedelta
import uuid

from app.db.session import SessionLocal
from app.models.user import User
from app.models.role import Role, UserRole
from app.models.candidate import Candidate
from app.models.cv import CV
from app.models.candidate_status_history import CandidateStatusHistory
from app.models.assignment import Assignment
from app.models.review import Review
from app.models.interview import Interview
from app.models.interview_participant import InterviewParticipant
from app.models.interview_feedback import InterviewFeedback
from app.core.security import hash_password

def ago(days=0, hours=0):
    return datetime.utcnow() - timedelta(days=days, hours=hours)

def ahead(days=0, hours=0):
    return datetime.utcnow() + timedelta(days=days, hours=hours)

# ── Users ──────────────────────────────────────────────────────────────────────

USERS = [
    # admin_l2
    {"email": "ravi.shah@portal.edu",     "full_name": "Ravi Shah",         "role": "admin_l2"},
    # teachers
    {"email": "priya.sharma@portal.edu",  "full_name": "Dr. Priya Sharma",  "role": "teacher"},
    {"email": "anil.kumar@portal.edu",    "full_name": "Dr. Anil Kumar",    "role": "teacher"},
    {"email": "kavita.rao@portal.edu",    "full_name": "Dr. Kavita Rao",    "role": "teacher"},
    {"email": "neha.gupta@portal.edu",    "full_name": "Dr. Neha Gupta",    "role": "teacher"},
    {"email": "rajesh.menon@portal.edu",  "full_name": "Dr. Rajesh Menon",  "role": "teacher"},
    {"email": "suresh.pillai@portal.edu", "full_name": "Dr. Suresh Pillai", "role": "teacher"},
]

# ── Candidates (one per status) ────────────────────────────────────────────────

CANDIDATES = [
    # status              name                    email                      phone          subject               yrs  qual        employer             uploaded_ago
    ("UPLOADED",          "Sahil Kapoor",         "sahil.k@test.com",        "9800001111",  "Statistics",          4,  "PhD",      "Flipkart",           2),
    ("PENDING_ASSIGNMENT","Ritu Agarwal",          "ritu.a@test.com",         "9800002222",  "Psychology",          5,  "PhD",      "FLAME University",   5),
    ("PENDING_ASSIGNMENT","Rohan Deshmukh",        "rohan.d@test.com",        "9800003333",  "Physics",             8,  "PhD",      "Fergusson College",  7),
    ("ASSIGNED",          "Ananya Das",            "ananya.d@test.com",       "9800004444",  "Biology",             2,  "PhD",      "Ashoka University",  10),
    ("ASSIGNED",          "Vikram Nair",           "vikram.n@test.com",       "9800005555",  "Chemistry",           3,  "PhD",      "Loyola College",     12),
    ("UNDER_REVIEW",      "Sneha Iyer",            "sneha.i@test.com",        "9800006666",  "Mathematics",         4,  "PhD",      "Christ University",  18),
    ("UNDER_REVIEW",      "Aditya Verma",          "aditya.v@test.com",       "9800007777",  "Computer Science",    9,  "PhD",      "TCS Research",       20),
    ("UNDER_REVIEW",      "Divya Menon",           "divya.m@test.com",        "9800008888",  "History",             6,  "PhD",      "Presidency Univ",   22),
    ("SHORTLISTED",       "Arjun Mehta",           "arjun.m@test.com",        "9800009999",  "Computer Science",    6,  "PhD",      "Persistent Systems", 30),
    ("SHORTLISTED",       "Preethi Nair",          "preethi.n@test.com",      "9800010001",  "Mathematics",         7,  "PhD",      "IIT Madras",         28),
    ("INTERVIEW_SCHEDULED","Meera Joshi",          "meera.j@test.com",        "9800010000",  "Economics",           5,  "PhD",      "St. Xavier's",       35),
    ("INTERVIEW_DONE",    "Kabir Khan",            "kabir.k@test.com",        "9800011111",  "English Literature",  7,  "PhD",      "Jadavpur Univ",      42),
    ("OFFER_PENDING",     "Farhan Qureshi",        "farhan.q@test.com",       "9800012222",  "Mechanical Engg",    11,  "PhD",      "L&T Technology",     50),
    ("ACCEPTED",          "Pooja Reddy",           "pooja.r@test.com",        "9800013333",  "Chemistry",           5,  "Masters",  "IIT Hyderabad",      60),
    ("REJECTED",          "Tarun Saxena",          "tarun.s@test.com",        "9800014444",  "English Literature",  3,  "Masters",  "Freelance",          45),
    ("ON_HOLD",           "Kiran Pillai",          "kiran.p@test.com",        "9800015555",  "Chemistry",           6,  "PhD",      "BARC",               25),
]

# status journey for history
STATUS_JOURNEY = {
    "UPLOADED":           ["UPLOADED"],
    "PENDING_ASSIGNMENT": ["UPLOADED", "PENDING_ASSIGNMENT"],
    "ASSIGNED":           ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED"],
    "UNDER_REVIEW":       ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW"],
    "SHORTLISTED":        ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "SHORTLISTED"],
    "INTERVIEW_SCHEDULED":["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED"],
    "INTERVIEW_DONE":     ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE"],
    "OFFER_PENDING":      ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "OFFER_PENDING"],
    "ACCEPTED":           ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "SHORTLISTED", "INTERVIEW_SCHEDULED", "INTERVIEW_DONE", "OFFER_PENDING", "ACCEPTED"],
    "REJECTED":           ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "REJECTED"],
    "ON_HOLD":            ["UPLOADED", "PENDING_ASSIGNMENT", "ASSIGNED", "UNDER_REVIEW", "ON_HOLD"],
}

REVIEW_DATA = [
    ("shortlist", "Exceptionally strong research output and teaching philosophy.", "Limited undergrad teaching; confirm availability.", 5, 4, 5, 4, 4.5),
    ("shortlist", "Deep domain expertise and published work in top journals.",      "Wants remote arrangement — needs discussion.",      4, 5, 4, 3, 4.0),
    ("flag",      "Good communication skills and relevant experience.",             "Subject overlap with existing faculty; verify.",    4, 4, 3, 4, 3.8),
    ("reject",    "Basic domain coverage only.",                                    "No publications and limited research background.",  2, 3, 2, 4, 2.5),
    ("shortlist", "Strong industry background complements academic profile.",       "No prior teaching experience — may need support.",  4, 4, 5, 3, 4.0),
    ("shortlist", "Outstanding scores across all dimensions.",                      "Minor concern on long-term commitment.",             5, 5, 5, 4, 4.8),
    ("flag",      "Solid fundamentals and clear articulation.",                     "Research output below expectations for the role.",  3, 4, 3, 4, 3.5),
]

INTERVIEW_DATA = {
    # status          platform          link                                    days_from_now  round  iv_status
    "INTERVIEW_SCHEDULED": ("Google Meet",    "https://meet.google.com/abc-defg-hij",  3,   1, "scheduled"),
    "INTERVIEW_DONE":      ("Zoom",           "https://zoom.us/j/98765432100",         -3,  1, "completed"),
    "OFFER_PENDING":       ("Microsoft Teams","https://teams.microsoft.com/l/meetup/x",-10, 2, "completed"),
}


def main():
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "aarushi.ois1212@gmail.com").first()
        if not admin:
            print("ERROR: Run seed_admins.py first.")
            return

        roles = {r.name: r for r in db.query(Role).all()}
        if not roles:
            print("ERROR: Start the backend once so roles are seeded, then re-run.")
            return

        # ── 1. Users ───────────────────────────────────────────────────────────
        user_objs = {}
        for u in USERS:
            existing = db.query(User).filter(User.email == u["email"]).first()
            if existing:
                user_objs[u["email"]] = existing
                continue
            new_u = User(email=u["email"], full_name=u["full_name"],
                         password_hash=hash_password("Portal@1234"), is_active=True)
            db.add(new_u)
            db.flush()
            db.add(UserRole(user_id=new_u.id, role_id=roles[u["role"]].id))
            user_objs[u["email"]] = new_u
            print(f"  USER: {u['full_name']} [{u['role']}]")
        db.commit()

        teachers = [user_objs[u["email"]] for u in USERS if u["role"] == "teacher"]
        admin_l2 = user_objs["ravi.shah@portal.edu"]

        # ── 2. Candidates + CVs + History ──────────────────────────────────────
        cand_objs = []
        for row in CANDIDATES:
            status, name, email, phone, subject, yrs, qual, employer, uploaded_days_ago = row

            existing = db.query(Candidate).filter(Candidate.email == email).first()
            if existing:
                cand_objs.append(existing)
                continue

            cand = Candidate(
                full_name=name, email=email, phone=phone,
                preferred_subject=subject, years_experience=yrs,
                highest_qualification=qual, current_employer=employer,
                current_status=status,
                created_at=ago(days=uploaded_days_ago),
            )
            db.add(cand)
            db.flush()

            # CV record (no actual file needed for UI testing)
            cv = CV(
                candidate_id=cand.id, version=1, is_current=True,
                file_key=f"uploads/cvs/{cand.id}_v1_{name.replace(' ','_')}_CV.pdf",
                file_name=f"{name.replace(' ','_')}_CV.pdf",
                file_size_kb=380, uploaded_by=admin.id,
                uploaded_at=ago(days=uploaded_days_ago),
            )
            db.add(cv)

            # Status history
            journey = STATUS_JOURNEY.get(status, ["UPLOADED"])
            step_days = uploaded_days_ago
            prev = None
            for step in journey:
                step_days = max(0, step_days - 3)
                db.add(CandidateStatusHistory(
                    candidate_id=cand.id,
                    from_status=prev,
                    to_status=step,
                    changed_by=admin.id,
                    changed_at=ago(days=step_days),
                    reason=None,
                ))
                prev = step

            cand_objs.append(cand)
            print(f"  CANDIDATE: {name} [{status}]")
        db.commit()

        # ── 3. Assignments ─────────────────────────────────────────────────────
        assign_cfg = {
            "ASSIGNED":           [("pending",   "normal", 5)],
            "UNDER_REVIEW":       [("in_review", "high",  -2), ("in_review", "normal", -1)],
            "SHORTLISTED":        [("completed", "high",  -8), ("completed", "urgent", -6)],
            "INTERVIEW_SCHEDULED":[("completed", "urgent",-10)],
            "INTERVIEW_DONE":     [("completed", "high",  -14)],
            "OFFER_PENDING":      [("completed", "urgent",-20)],
            "ACCEPTED":           [("completed", "normal",-30)],
            "REJECTED":           [("completed", "normal",-18), ("declined", "normal", -16)],
            "ON_HOLD":            [("in_review", "normal", 4)],
        }

        assignment_map = {}   # candidate_id → first assignment
        for i, cand in enumerate(cand_objs):
            status = CANDIDATES[i][0]
            if status not in assign_cfg:
                continue
            cv = db.query(CV).filter(CV.candidate_id == cand.id, CV.is_current == True).first()
            if not cv:
                continue
            first = None
            for j, (a_status, priority, due_offset) in enumerate(assign_cfg[status]):
                teacher = teachers[(i + j) % len(teachers)]
                exists = db.query(Assignment).filter(
                    Assignment.candidate_id == cand.id,
                    Assignment.teacher_id == teacher.id,
                ).first()
                if exists:
                    if first is None:
                        first = exists
                    continue
                a = Assignment(
                    cv_id=cv.id, candidate_id=cand.id,
                    teacher_id=teacher.id, assigned_by=admin_l2.id,
                    status=a_status, priority=priority,
                    due_date=(datetime.utcnow() + timedelta(days=due_offset)).date(),
                    assigned_at=ago(days=abs(due_offset) + 2),
                )
                db.add(a)
                db.flush()
                if first is None:
                    first = a
            if first:
                assignment_map[cand.id] = first
        db.commit()
        print(f"  ASSIGNMENTS: {len(assignment_map)} candidate(s) assigned")

        # ── 4. Reviews ─────────────────────────────────────────────────────────
        review_statuses = {"UNDER_REVIEW","SHORTLISTED","INTERVIEW_SCHEDULED",
                           "INTERVIEW_DONE","OFFER_PENDING","ACCEPTED","REJECTED","ON_HOLD"}
        ri = 0
        for i, cand in enumerate(cand_objs):
            if CANDIDATES[i][0] not in review_statuses:
                continue
            a = assignment_map.get(cand.id)
            if not a:
                continue
            if db.query(Review).filter(Review.assignment_id == a.id).first():
                continue
            verdict, strengths, concerns, d, c, e, av, overall = REVIEW_DATA[ri % len(REVIEW_DATA)]
            db.add(Review(
                assignment_id=a.id, reviewer_id=a.teacher_id,
                verdict=verdict, strengths=strengths, concerns=concerns,
                recommendation="Proceed to interview." if verdict == "shortlist" else "Review further.",
                scores={"domain": d, "communication": c, "experience": e, "availability": av},
                overall_score=overall, is_final=True,
                submitted_at=ago(days=5),
            ))
            ri += 1
        db.commit()
        print(f"  REVIEWS: {ri} submitted")

        # ── 5. Interviews + Participants + Feedback ────────────────────────────
        for i, cand in enumerate(cand_objs):
            status = CANDIDATES[i][0]
            if status not in INTERVIEW_DATA:
                continue
            if db.query(Interview).filter(Interview.candidate_id == cand.id).first():
                continue
            platform, link, day_offset, round_num, iv_status = INTERVIEW_DATA[status]
            start = datetime.utcnow() + timedelta(days=day_offset, hours=10)
            end   = start + timedelta(hours=1)
            teacher = teachers[i % len(teachers)]

            iv = Interview(
                candidate_id=cand.id, round_number=round_num,
                scheduled_by=admin.id,
                start_time=start, end_time=end,
                timezone="Asia/Kolkata",
                meeting_platform=platform, meeting_link=link,
                status=iv_status,
            )
            db.add(iv)
            db.flush()

            # Lead = admin, co-interviewer = teacher
            db.add(InterviewParticipant(interview_id=iv.id, user_id=admin.id,   role="lead"))
            db.add(InterviewParticipant(interview_id=iv.id, user_id=teacher.id, role="co_interviewer"))

            if iv_status == "completed":
                db.add(InterviewFeedback(
                    interview_id=iv.id, interviewer_id=teacher.id,
                    outcome="proceed",
                    domain_score=4, communication_score=5,
                    experience_score=4, availability_score=3,
                    overall_score=4.2,
                    strengths="Strong technical depth; communicates clearly under pressure.",
                    concerns="Availability from next semester — confirm before offer.",
                    is_final=True, submitted_at=ago(days=2),
                ))
            print(f"  INTERVIEW: {CANDIDATES[i][1]} — {platform} [{iv_status}]")
        db.commit()

        print("\n✓ Seed complete.")
        print("  All user passwords: Portal@1234")
        print("  Teachers: priya.sharma@portal.edu, anil.kumar@portal.edu, kavita.rao@portal.edu,")
        print("            neha.gupta@portal.edu, rajesh.menon@portal.edu, suresh.pillai@portal.edu")
        print("  Admin L2: ravi.shah@portal.edu")

    finally:
        db.close()


if __name__ == "__main__":
    main()
