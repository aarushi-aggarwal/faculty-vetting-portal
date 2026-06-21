"""
Google Calendar integration — auto-creates Google Meet link and sends calendar invites.
Requires GOOGLE_SERVICE_ACCOUNT_JSON and GOOGLE_CALENDAR_ID in .env
"""
import json
import os
import logging
from datetime import datetime
from uuid import UUID

logger = logging.getLogger(__name__)

def _get_service():
    key_json = os.getenv("GOOGLE_SERVICE_ACCOUNT_JSON")
    if not key_json:
        logger.warning("[calendar] GOOGLE_SERVICE_ACCOUNT_JSON not set — skipping.")
        return None
    try:
        from google.oauth2 import service_account
        from googleapiclient.discovery import build
        info = json.loads(key_json)
        creds = service_account.Credentials.from_service_account_info(
            info, scopes=["https://www.googleapis.com/auth/calendar"]
        )
        return build("calendar", "v3", credentials=creds)
    except Exception as e:
        logger.error(f"[calendar] Failed to build service: {e}")
        return None


def create_interview_event(
    interview_id: UUID,
    candidate_name: str,
    round_number: int,
    start_time: datetime,
    end_time: datetime,
    timezone: str,
    attendee_emails: list[str],
    notes: str | None = None,
) -> tuple[str | None, str | None]:
    """
    Creates a Google Calendar event with an auto-generated Google Meet link.
    Returns (meet_link, calendar_event_id). Both None if integration not configured.
    """
    service = _get_service()
    if not service:
        return None, None

    calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "primary")

    event = {
        "summary": f"Interview — {candidate_name} (Round {round_number})",
        "description": notes or "",
        "start": {"dateTime": start_time.isoformat(), "timeZone": timezone},
        "end":   {"dateTime": end_time.isoformat(),   "timeZone": timezone},
        "attendees": [{"email": e} for e in attendee_emails if e],
        "conferenceData": {
            "createRequest": {"requestId": str(interview_id)}
        },
        "reminders": {
            "useDefault": False,
            "overrides": [
                {"method": "email",  "minutes": 60 * 24},  # 1 day before
                {"method": "popup",  "minutes": 30},
            ],
        },
    }

    try:
        result = service.events().insert(
            calendarId=calendar_id,
            body=event,
            conferenceDataVersion=1,
            sendUpdates="all",   # emails calendar invites to all attendees
        ).execute()

        meet_link        = result.get("hangoutLink")
        calendar_event_id = result.get("id")
        logger.info(f"[calendar] Event created: {calendar_event_id} | Meet: {meet_link}")
        return meet_link, calendar_event_id

    except Exception as e:
        logger.error(f"[calendar] Event creation failed: {e}")
        return None, None


def update_interview_event(
    calendar_event_id: str,
    start_time: datetime,
    end_time: datetime,
    timezone: str,
    reason: str | None = None,
) -> bool:
    """Patches an existing calendar event when the interview is rescheduled."""
    service = _get_service()
    if not service:
        return False

    calendar_id = os.getenv("GOOGLE_CALENDAR_ID", "primary")

    patch_body = {
        "start": {"dateTime": start_time.isoformat(), "timeZone": timezone},
        "end":   {"dateTime": end_time.isoformat(),   "timeZone": timezone},
    }
    if reason:
        patch_body["description"] = f"Rescheduled — {reason}"

    try:
        service.events().patch(
            calendarId=calendar_id,
            eventId=calendar_event_id,
            body=patch_body,
            sendUpdates="all",
        ).execute()
        logger.info(f"[calendar] Event {calendar_event_id} rescheduled.")
        return True
    except Exception as e:
        logger.error(f"[calendar] Reschedule failed: {e}")
        return False
