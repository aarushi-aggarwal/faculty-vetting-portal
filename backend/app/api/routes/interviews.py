from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime

from app.db.session import get_db
from app.models.interview import Interview
from app.models.interview_participant import InterviewParticipant
from app.models.interview_feedback import InterviewFeedback
from app.models.candidate import Candidate
from app.models.user import User
from app.schemas.interview import (
    InterviewCreate, InterviewOut, InterviewWithNames, RescheduleRequest,
    FeedbackCreate, FeedbackOut, VALID_OUTCOMES
)
from app.core.dependencies import require_role, get_current_user
from app.core.calendar import create_interview_event, update_interview_event
from app.core.email_notify import notify_interview_scheduled, notify_interview_rescheduled

router = APIRouter(prefix="/interviews", tags=["interviews"])

@router.post("/", response_model=InterviewOut)
def schedule_interview(
    data: InterviewCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    candidate = db.query(Candidate).filter(Candidate.id == data.candidate_id).first()
    if not candidate:
        raise HTTPException(status_code=404, detail="Candidate not found")

    # Get round number
    previous = db.query(Interview).filter(
        Interview.candidate_id == data.candidate_id
    ).count()
    round_number = previous + 1

    interview = Interview(
        candidate_id=data.candidate_id,
        round_number=round_number,
        parent_interview_id=data.parent_interview_id,
        scheduled_by=current_user.id,
        start_time=data.start_time,
        end_time=data.end_time,
        timezone=data.timezone,
        meeting_link=data.meeting_link,
        meeting_platform=data.meeting_platform,
        notes=data.notes
    )
    db.add(interview)
    db.flush()

    # Add participants
    for p in data.participants:
        participant = InterviewParticipant(
            interview_id=interview.id,
            user_id=p.user_id,
            role=p.role
        )
        db.add(participant)

    # Update candidate status
    candidate.current_status = "INTERVIEW_SCHEDULED"
    db.commit()
    db.refresh(interview)

    # Collect participant emails for calendar + email
    participant_users = db.query(User).filter(
        User.id.in_([p.user_id for p in data.participants])
    ).all()
    attendee_emails = [candidate.email] + [u.email for u in participant_users] + [current_user.email]

    # Auto-generate Google Meet link + calendar invite
    meet_link, cal_event_id = create_interview_event(
        interview_id=interview.id,
        candidate_name=candidate.full_name,
        round_number=round_number,
        start_time=data.start_time,
        end_time=data.end_time,
        timezone=data.timezone or "Asia/Kolkata",
        attendee_emails=attendee_emails,
        notes=data.notes,
    )
    if meet_link or cal_event_id:
        interview.meeting_link = meet_link or interview.meeting_link
        interview.meeting_platform = interview.meeting_platform or "Google Meet"
        interview.calendar_event_id = cal_event_id
        db.commit()

    # Send branded email notification
    notify_interview_scheduled(
        candidate_name=candidate.full_name,
        candidate_email=candidate.email,
        interviewer_emails=[u.email for u in participant_users],
        round_number=round_number,
        start_time=data.start_time,
        end_time=data.end_time,
        meet_link=meet_link or data.meeting_link,
        platform=interview.meeting_platform,
    )

    return interview

@router.get("/", response_model=List[InterviewWithNames])
def list_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    rows = (
        db.query(Interview, Candidate.full_name, Candidate.email)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .order_by(Interview.start_time.desc())
        .all()
    )
    return [
        InterviewWithNames(
            id=iv.id,
            candidate_id=iv.candidate_id,
            candidate_name=cname,
            candidate_email=cemail,
            round_number=iv.round_number,
            status=iv.status,
            start_time=iv.start_time,
            end_time=iv.end_time,
            meeting_platform=iv.meeting_platform,
            meeting_link=iv.meeting_link,
        )
        for iv, cname, cemail in rows
    ]

@router.get("/my", response_model=List[InterviewWithNames])
def my_interviews(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    participations = db.query(InterviewParticipant).filter(
        InterviewParticipant.user_id == current_user.id
    ).all()
    interview_ids = [p.interview_id for p in participations]
    rows = (
        db.query(Interview, Candidate.full_name, Candidate.email)
        .join(Candidate, Candidate.id == Interview.candidate_id)
        .filter(Interview.id.in_(interview_ids))
        .all()
    )
    return [
        InterviewWithNames(
            id=iv.id,
            candidate_id=iv.candidate_id,
            candidate_name=cname,
            candidate_email=cemail,
            round_number=iv.round_number,
            status=iv.status,
            start_time=iv.start_time,
            end_time=iv.end_time,
            meeting_platform=iv.meeting_platform,
            meeting_link=iv.meeting_link,
        )
        for iv, cname, cemail in rows
    ]

@router.get("/{interview_id}", response_model=InterviewOut)
def get_interview(
    interview_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview

@router.patch("/{interview_id}/reschedule", response_model=InterviewOut)
def reschedule_interview(
    interview_id: UUID,
    data: RescheduleRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.start_time = data.start_time
    interview.end_time = data.end_time
    interview.status = "rescheduled"
    interview.reschedule_count += 1
    interview.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(interview)

    # Update Google Calendar event and notify attendees
    if interview.calendar_event_id:
        update_interview_event(
            calendar_event_id=interview.calendar_event_id,
            start_time=data.start_time,
            end_time=data.end_time,
            timezone=interview.timezone,
            reason=getattr(data, "reason", None),
        )

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    participants = db.query(InterviewParticipant).filter(
        InterviewParticipant.interview_id == interview.id
    ).all()
    participant_users = db.query(User).filter(
        User.id.in_([p.user_id for p in participants])
    ).all()

    if candidate:
        notify_interview_rescheduled(
            candidate_name=candidate.full_name,
            candidate_email=candidate.email,
            interviewer_emails=[u.email for u in participant_users],
            round_number=interview.round_number,
            new_start=data.start_time,
            new_end=data.end_time,
            reason=getattr(data, "reason", None),
            meet_link=interview.meeting_link,
        )

    return interview

@router.patch("/{interview_id}/complete")
def mark_complete(
    interview_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    interview.status = "completed"
    interview.updated_at = datetime.utcnow()

    candidate = db.query(Candidate).filter(Candidate.id == interview.candidate_id).first()
    if candidate:
        candidate.current_status = "INTERVIEW_DONE"

    db.commit()
    return {"message": "Interview marked as completed"}

@router.post("/{interview_id}/feedback", response_model=FeedbackOut)
def submit_feedback(
    interview_id: UUID,
    data: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    if not interview:
        raise HTTPException(status_code=404, detail="Interview not found")

    if data.outcome and data.outcome not in VALID_OUTCOMES:
        raise HTTPException(status_code=400, detail=f"Invalid outcome. Choose from {VALID_OUTCOMES}")

    existing = db.query(InterviewFeedback).filter(
        InterviewFeedback.interview_id == interview_id,
        InterviewFeedback.interviewer_id == current_user.id,
        InterviewFeedback.is_final == False
    ).first()

    if existing:
        for key, value in data.model_dump(exclude_unset=True).items():
            setattr(existing, key, value)
        existing.updated_at = datetime.utcnow()
        db.commit()
        db.refresh(existing)
        return existing

    feedback = InterviewFeedback(
        **data.model_dump(),
        interview_id=interview_id,
        interviewer_id=current_user.id
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return feedback

@router.post("/{interview_id}/feedback/submit")
def finalize_feedback(
    interview_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2", "teacher"))
):
    feedback = db.query(InterviewFeedback).filter(
        InterviewFeedback.interview_id == interview_id,
        InterviewFeedback.interviewer_id == current_user.id,
        InterviewFeedback.is_final == False
    ).first()
    if not feedback:
        raise HTTPException(status_code=404, detail="No draft feedback found")
    if not feedback.outcome:
        raise HTTPException(status_code=400, detail="Outcome required before submitting")

    feedback.is_final = True
    feedback.submitted_at = datetime.utcnow()

    # Check if all participants submitted — update candidate status
    interview = db.query(Interview).filter(Interview.id == interview_id).first()
    participant_count = db.query(InterviewParticipant).filter(
        InterviewParticipant.interview_id == interview_id
    ).count()
    final_feedback_count = db.query(InterviewFeedback).filter(
        InterviewFeedback.interview_id == interview_id,
        InterviewFeedback.is_final == True
    ).count()

    if final_feedback_count + 1 >= participant_count:
        feedbacks = db.query(InterviewFeedback).filter(
            InterviewFeedback.interview_id == interview_id,
            InterviewFeedback.is_final == True
        ).all()
        outcomes = [f.outcome for f in feedbacks] + [feedback.outcome]
        if all(o == "proceed" for o in outcomes):
            candidate = db.query(Candidate).filter(
                Candidate.id == interview.candidate_id
            ).first()
            if candidate:
                candidate.current_status = "OFFER_PENDING"

    db.commit()
    return {"message": "Feedback submitted"}

@router.get("/{interview_id}/feedback/summary")
def feedback_summary(
    interview_id: UUID,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_role("master_admin", "admin_l2"))
):
    feedbacks = db.query(InterviewFeedback).filter(
        InterviewFeedback.interview_id == interview_id,
        InterviewFeedback.is_final == True
    ).all()

    outcomes = [f.outcome for f in feedbacks]
    scores = [float(f.overall_score) for f in feedbacks if f.overall_score]

    return {
        "interview_id": interview_id,
        "total_feedback": len(feedbacks),
        "outcomes": {
            "proceed": outcomes.count("proceed"),
            "hold": outcomes.count("hold"),
            "reject": outcomes.count("reject")
        },
        "average_score": round(sum(scores) / len(scores), 2) if scores else None,
        "feedbacks": [
            {
                "outcome": f.outcome,
                "overall_score": f.overall_score,
                "domain_score": f.domain_score,
                "communication_score": f.communication_score,
                "strengths": f.strengths,
                "concerns": f.concerns,
                "submitted_at": f.submitted_at
            } for f in feedbacks
        ]
    }