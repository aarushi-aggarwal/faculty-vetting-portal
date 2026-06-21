import requests

BASE = "http://127.0.0.1:8000/api/v1"

res = requests.post(f"{BASE}/auth/login", json={"email": "admin@portal.com", "password": "admin123"})
token = res.json()["access_token"]
headers = {"Authorization": f"Bearer {token}"}

# First get CVs for each candidate
candidates = requests.get(f"{BASE}/candidates/", headers=headers).json()

teachers = {
    "priya":  "18d2d68b-750f-4807-b355-f259657438b4",
    "rajesh": "a8a35164-be94-4db8-8b24-e9c2f690230c",
    "anita":  "aa964ba2-7b01-46a8-babe-b066c99c7442",
    "suresh": "8ca34a13-4f7e-408f-8d7b-31df76b47be2",
}

candidate_ids = {
    "Arjun Mehta":    "8864a783-ae14-453e-a212-33f7f9249127",
    "Sneha Patel":    "d5301938-2bf0-4e85-b05b-473863821bd8",
    "Vikram Singh":   "b5916701-ad5d-43b2-bc2d-633329702984",
    "Meera Iyer":     "fb197db5-6845-4071-a61e-108c6c405cfa",
    "Rahul Gupta":    "740f375f-dedd-4f03-ab11-fbe33587d992",
    "Pooja Reddy":    "c02e982f-1d6d-4089-85b5-648c4b816741",
    "Amit Joshi":     "78d459ce-dd7c-4d01-bf74-087bcf06a05c",
    "Kavya Nambiar":  "b07660f4-d938-4dcc-9ab4-61d2bb9a3a38",
    "Rohan Desai":    "a5caef8f-a412-4cc7-8739-df925922b4bd",
    "Divya Krishnan": "bb7d3a46-8b69-4daa-b254-c5ce04bcbb0d",
}

# We need CV IDs — seed dummy CVs first via psql since we have no files
# Instead assign with a placeholder by inserting directly
import psycopg2
from datetime import date

conn = psycopg2.connect(
    host="localhost",
    database="faculty_vetting",
    user="postgres",
    password="postgres@12"
)
cur = conn.cursor()

assignments = [
    ("Arjun Mehta",    "priya",  "high",   "2026-07-01"),
    ("Sneha Patel",    "priya",  "normal", "2026-07-05"),
    ("Vikram Singh",   "rajesh", "urgent", "2026-06-28"),
    ("Meera Iyer",     "rajesh", "normal", "2026-07-10"),
    ("Rahul Gupta",    "anita",  "high",   "2026-07-03"),
    ("Pooja Reddy",    "anita",  "normal", "2026-07-08"),
    ("Amit Joshi",     "suresh", "normal", "2026-07-15"),
    ("Kavya Nambiar",  "suresh", "high",   "2026-07-02"),
    ("Rohan Desai",    "priya",  "normal", "2026-07-12"),
    ("Divya Krishnan", "rajesh", "urgent", "2026-06-30"),
]

admin_id = "fa56f104-f25a-49fa-8d24-f8277dda9428"

for name, teacher_key, priority, due_date in assignments:
    cid = candidate_ids[name]
    tid = teachers[teacher_key]

    # Create a dummy CV record
    cur.execute("""
        INSERT INTO cvs (id, candidate_id, version, is_current, file_key, file_name, mime_type, uploaded_by, uploaded_at)
        VALUES (gen_random_uuid(), %s, 1, true, %s, %s, 'application/pdf', %s, NOW())
        RETURNING id
    """, (cid, f"uploads/cvs/{cid}_v1_cv.pdf", f"{name.replace(' ', '_')}_CV.pdf", admin_id))
    cv_id = cur.fetchone()[0]

    # Create assignment
    cur.execute("""
        INSERT INTO assignments (id, cv_id, candidate_id, teacher_id, assigned_by, status, priority, due_date, assigned_at, created_at, updated_at)
        VALUES (gen_random_uuid(), %s, %s, %s, %s, 'pending', %s, %s, NOW(), NOW(), NOW())
    """, (cv_id, cid, tid, admin_id, priority, due_date))

    print(f"Assigned {name} → {teacher_key} ({priority}, due {due_date})")

conn.commit()
cur.close()
conn.close()
print("\nAll assignments created.")