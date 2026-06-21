import requests
import json

BASE = "http://127.0.0.1:8000/api/v1"

# ── Login as admin ─────────────────────────────────────────────────────────────
res = requests.post(f"{BASE}/auth/login", json={"email": "admin@portal.com", "password": "admin123"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# ── Create teachers ────────────────────────────────────────────────────────────
teachers = [
    {"email": "priya.sharma@portal.com",   "full_name": "Dr. Priya Sharma",   "password": "teacher123"},
    {"email": "rajesh.kumar@portal.com",   "full_name": "Prof. Rajesh Kumar",  "password": "teacher123"},
    {"email": "anita.verma@portal.com",    "full_name": "Dr. Anita Verma",     "password": "teacher123"},
    {"email": "suresh.nair@portal.com",    "full_name": "Prof. Suresh Nair",   "password": "teacher123"},
]

teacher_ids = []
for t in teachers:
    r = requests.post(f"{BASE}/auth/register", json=t)
    uid = r.json()["id"]
    teacher_ids.append(uid)
    # Assign teacher role
    requests.post(f"{BASE}/users/assign-role", json={"user_id": uid, "role_name": "teacher"}, headers=headers)
    print(f"Created teacher: {t['full_name']} — {uid}")

# ── Create candidates ──────────────────────────────────────────────────────────
candidates = [
    {"full_name": "Arjun Mehta",       "email": "arjun.mehta@gmail.com",      "phone": "9876543210", "preferred_subject": "Mathematics",       "years_experience": 5,  "highest_qualification": "PhD",     "current_employer": "Delhi University"},
    {"full_name": "Sneha Patel",        "email": "sneha.patel@gmail.com",       "phone": "9876543211", "preferred_subject": "Physics",           "years_experience": 3,  "highest_qualification": "Masters",  "current_employer": "IIT Bombay"},
    {"full_name": "Vikram Singh",       "email": "vikram.singh@gmail.com",      "phone": "9876543212", "preferred_subject": "Computer Science",  "years_experience": 7,  "highest_qualification": "PhD",     "current_employer": "TCS"},
    {"full_name": "Meera Iyer",         "email": "meera.iyer@gmail.com",        "phone": "9876543213", "preferred_subject": "Economics",         "years_experience": 4,  "highest_qualification": "Masters",  "current_employer": "RBI"},
    {"full_name": "Rahul Gupta",        "email": "rahul.gupta@gmail.com",       "phone": "9876543214", "preferred_subject": "English Literature","years_experience": 6,  "highest_qualification": "PhD",     "current_employer": "JNU"},
    {"full_name": "Pooja Reddy",        "email": "pooja.reddy@gmail.com",       "phone": "9876543215", "preferred_subject": "Chemistry",         "years_experience": 2,  "highest_qualification": "Masters",  "current_employer": "Freelance"},
    {"full_name": "Amit Joshi",         "email": "amit.joshi@gmail.com",        "phone": "9876543216", "preferred_subject": "History",           "years_experience": 8,  "highest_qualification": "PhD",     "current_employer": "Pune University"},
    {"full_name": "Kavya Nambiar",      "email": "kavya.nambiar@gmail.com",     "phone": "9876543217", "preferred_subject": "Biology",           "years_experience": 3,  "highest_qualification": "Masters",  "current_employer": "AIIMS"},
    {"full_name": "Rohan Desai",        "email": "rohan.desai@gmail.com",       "phone": "9876543218", "preferred_subject": "Computer Science",  "years_experience": 5,  "highest_qualification": "Masters",  "current_employer": "Infosys"},
    {"full_name": "Divya Krishnan",     "email": "divya.krishnan@gmail.com",    "phone": "9876543219", "preferred_subject": "Mathematics",       "years_experience": 4,  "highest_qualification": "PhD",     "current_employer": "TIFR"},
    {"full_name": "Sanjay Bose",        "email": "sanjay.bose@gmail.com",       "phone": "9876543220", "preferred_subject": "Physics",           "years_experience": 9,  "highest_qualification": "PhD",     "current_employer": "ISRO"},
    {"full_name": "Nisha Agarwal",      "email": "nisha.agarwal@gmail.com",     "phone": "9876543221", "preferred_subject": "Economics",         "years_experience": 2,  "highest_qualification": "Masters",  "current_employer": "NITI Aayog"},
    {"full_name": "Kiran Pillai",       "email": "kiran.pillai@gmail.com",      "phone": "9876543222", "preferred_subject": "Chemistry",         "years_experience": 6,  "highest_qualification": "PhD",     "current_employer": "BARC"},
    {"full_name": "Tarun Saxena",       "email": "tarun.saxena@gmail.com",      "phone": "9876543223", "preferred_subject": "English Literature","years_experience": 3,  "highest_qualification": "Masters",  "current_employer": "Freelance"},
    {"full_name": "Ananya Das",         "email": "ananya.das@gmail.com",        "phone": "9876543224", "preferred_subject": "History",           "years_experience": 5,  "highest_qualification": "PhD",     "current_employer": "Calcutta University"},
]

candidate_ids = []
for c in candidates:
    r = requests.post(f"{BASE}/candidates", json=c, headers=headers)
    cid = r.json()["id"]
    candidate_ids.append(cid)
    print(f"Created candidate: {c['full_name']} — {cid}")

# ── Update some candidate statuses ────────────────────────────────────────────
status_map = {
    0: "PENDING_ASSIGNMENT",
    1: "ASSIGNED",
    2: "UNDER_REVIEW",
    3: "SHORTLISTED",
    4: "INTERVIEW_SCHEDULED",
    5: "INTERVIEW_DONE",
    6: "ACCEPTED",
    7: "REJECTED",
    8: "ASSIGNED",
    9: "UNDER_REVIEW",
    10: "SHORTLISTED",
    11: "PENDING_ASSIGNMENT",
    12: "ASSIGNED",
    13: "UNDER_REVIEW",
    14: "REJECTED",
}

for i, cid in enumerate(candidate_ids):
    status = status_map.get(i, "UPLOADED")
    requests.patch(f"{BASE}/candidates/{cid}/status", json={"status": status}, headers=headers)
    print(f"Updated status: {status}")

print("\nDone! Summary:")
print(f"  Teachers created: {len(teacher_ids)}")
print(f"  Candidates created: {len(candidate_ids)}")
print("\nTeacher IDs:")
for i, tid in enumerate(teacher_ids):
    print(f"  {teachers[i]['full_name']}: {tid}")
print("\nCandidate IDs:")
for i, cid in enumerate(candidate_ids):
    print(f"  {candidates[i]['full_name']}: {cid}")