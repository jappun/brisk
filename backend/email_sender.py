import os

import resend


def send_email(to: str, subject: str, body: str) -> None:
    api_key = os.getenv("RESEND_API_KEY", "").strip()
    from_email = os.getenv("RESEND_FROM_EMAIL", "").strip()

    if not api_key:
        raise RuntimeError(
            "RESEND_API_KEY is not set. Add it to backend/.env to enable email sending."
        )
    if not from_email:
        raise RuntimeError(
            "RESEND_FROM_EMAIL is not set. Add it to backend/.env (e.g. "
            "'IEP Intake Companion <onboarding@resend.dev>')."
        )

    resend.api_key = api_key
    resend.Emails.send(
        {
            "from": from_email,
            "to": [to],
            "subject": subject,
            "text": body,
        }
    )
