"""
Email notifications via Resend.
Requires RESEND_API_KEY and PORTAL_FROM_EMAIL in .env
"""
import os
import logging
from datetime import datetime

logger = logging.getLogger(__name__)


def _send(to: list[str], subject: str, html: str):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        logger.warning("[email] RESEND_API_KEY not set — skipping email.")
        return
    try:
        import resend
        resend.api_key = api_key
        from_email = os.getenv("PORTAL_FROM_EMAIL", "portal@yourinstitution.com")
        resend.Emails.send({"from": from_email, "to": to, "subject": subject, "html": html})
        logger.info(f"[email] Sent '{subject}' to {to}")
    except Exception as e:
        logger.error(f"[email] Failed to send '{subject}': {e}")


def notify_interview_scheduled(
    candidate_name: str,
    candidate_email: str,
    interviewer_emails: list[str],
    round_number: int,
    start_time: datetime,
    end_time: datetime,
    meet_link: str | None,
    platform: str | None,
):
    formatted_date = start_time.strftime("%d %B %Y")
    formatted_time = f"{start_time.strftime('%I:%M %p')} – {end_time.strftime('%I:%M %p')} IST"
    meet_html = (
        f'<p><strong>Meeting Link:</strong> <a href="{meet_link}">{meet_link}</a></p>'
        if meet_link else ""
    )
    platform_label = platform or "Virtual"

    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
      <div style="background:#1b3a6b;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">Faculty Vetting Portal</h2>
        <p style="color:#a8c0e8;margin:4px 0 0;font-size:13px">Interview Scheduled</p>
      </div>
      <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <p>An interview has been scheduled for <strong>{candidate_name}</strong>.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280;width:130px">Round</td><td><strong>{round_number}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Date</td><td><strong>{formatted_date}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Time</td><td><strong>{formatted_time}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">Platform</td><td><strong>{platform_label}</strong></td></tr>
        </table>
        {meet_html}
        <hr style="border:none;border-top:1px solid #e5e7eb;margin:20px 0">
        <p style="font-size:12px;color:#9ca3af;margin:0">You are receiving this because you are part of the interview panel. Log in to the portal for full details.</p>
      </div>
    </div>
    """

    all_recipients = list({candidate_email} | set(interviewer_emails))
    _send(
        to=all_recipients,
        subject=f"Interview Scheduled — {candidate_name} (Round {round_number})",
        html=html,
    )


def notify_interview_rescheduled(
    candidate_name: str,
    candidate_email: str,
    interviewer_emails: list[str],
    round_number: int,
    new_start: datetime,
    new_end: datetime,
    reason: str | None,
    meet_link: str | None,
):
    formatted_date = new_start.strftime("%d %B %Y")
    formatted_time = f"{new_start.strftime('%I:%M %p')} – {new_end.strftime('%I:%M %p')} IST"
    meet_html = f'<p><strong>Updated Meeting Link:</strong> <a href="{meet_link}">{meet_link}</a></p>' if meet_link else ""
    reason_html = f'<p><strong>Reason:</strong> {reason}</p>' if reason else ""

    html = f"""
    <div style="font-family:sans-serif;max-width:560px;margin:auto;color:#1a1a1a">
      <div style="background:#b45309;padding:20px 24px;border-radius:8px 8px 0 0">
        <h2 style="color:#fff;margin:0;font-size:18px">Faculty Vetting Portal</h2>
        <p style="color:#fde68a;margin:4px 0 0;font-size:13px">Interview Rescheduled</p>
      </div>
      <div style="padding:24px;background:#f9fafb;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 8px 8px">
        <p>The interview for <strong>{candidate_name}</strong> has been rescheduled.</p>
        <table style="border-collapse:collapse;width:100%;font-size:14px">
          <tr><td style="padding:6px 0;color:#6b7280;width:130px">Round</td><td><strong>{round_number}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">New Date</td><td><strong>{formatted_date}</strong></td></tr>
          <tr><td style="padding:6px 0;color:#6b7280">New Time</td><td><strong>{formatted_time}</strong></td></tr>
        </table>
        {reason_html}
        {meet_html}
      </div>
    </div>
    """

    all_recipients = list({candidate_email} | set(interviewer_emails))
    _send(
        to=all_recipients,
        subject=f"Interview Rescheduled — {candidate_name} (Round {round_number})",
        html=html,
    )
