from fastapi import FastAPI
from app.db.base import Base
from app.db.session import engine
from app.api.routes import auth, users, candidates, assignments, reviews, interviews
import app.models.user
import app.models.role
import app.models.candidate
import app.models.cv
import app.models.candidate_status_history
import app.models.department
import app.models.subject
import app.models.assignment
import app.models.review
import app.models.review_comment
import app.models.interview
import app.models.interview_participant
import app.models.interview_feedback
from app.db.seed import seed_roles
import os
from fastapi.middleware.cors import CORSMiddleware


app = FastAPI(title="Faculty Vetting Portal", version="1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)
seed_roles()

os.makedirs("uploads/cvs", exist_ok=True)

app.include_router(auth.router, prefix="/api/v1")
app.include_router(users.router, prefix="/api/v1")
app.include_router(candidates.router, prefix="/api/v1")
app.include_router(assignments.router, prefix="/api/v1")
app.include_router(reviews.router, prefix="/api/v1")
app.include_router(interviews.router, prefix="/api/v1")

@app.get("/")
def root():
    return {"status": "ok", "message": "Faculty Vetting Portal API"}