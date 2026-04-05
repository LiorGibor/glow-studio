import logging
from typing import Any

import httpx

from app.config import get_settings

logger = logging.getLogger(__name__)


async def send_telegram_notification(message: str) -> bool:
    """Send a message via the Telegram Bot API.

    Silently skips if the bot token or chat ID is not configured.

    Returns:
        ``True`` if the message was sent successfully, ``False`` otherwise.
    """
    settings = get_settings()

    if not settings.telegram_bot_token or not settings.telegram_chat_id:
        logger.debug("Telegram not configured — skipping notification")
        return False

    url = f"https://api.telegram.org/bot{settings.telegram_bot_token}/sendMessage"
    payload = {
        "chat_id": settings.telegram_chat_id,
        "text": message,
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            logger.info("Telegram notification sent successfully")
            return True
    except httpx.HTTPError as exc:
        logger.error("Failed to send Telegram notification: %s", exc)
        return False


async def send_email_notification(to_email: str, subject: str, body: str) -> bool:
    """Send an email via SMTP using ``aiosmtplib``.

    Silently skips if SMTP is not configured.

    Returns:
        ``True`` if the email was sent successfully, ``False`` otherwise.
    """
    settings = get_settings()

    if not settings.smtp_host or not settings.smtp_user:
        logger.debug("SMTP not configured — skipping email notification")
        return False

    try:
        import aiosmtplib
        from email.mime.text import MIMEText
        from email.mime.multipart import MIMEMultipart

        msg = MIMEMultipart()
        msg["From"] = settings.smtp_from_email or settings.smtp_user
        msg["To"] = to_email
        msg["Subject"] = subject
        msg.attach(MIMEText(body, "html"))

        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user,
            password=settings.smtp_password,
            use_tls=True,
        )
        logger.info("Email sent to %s", to_email)
        return True
    except Exception as exc:
        logger.error("Failed to send email to %s: %s", to_email, exc)
        return False


async def notify_new_booking(appointment: Any, treatment: Any) -> None:
    """Send booking confirmation notifications via all configured channels.

    Args:
        appointment: The ``Appointment`` ORM instance.
        treatment: The ``Treatment`` ORM instance.
    """
    date_str = appointment.appointment_date.strftime("%A, %B %d, %Y")
    time_str = appointment.appointment_date.strftime("%H:%M")
    end_str = appointment.end_time.strftime("%H:%M")

    telegram_message = (
        f"<b>✅ New Booking</b>\n\n"
        f"<b>Client:</b> {appointment.customer_name}\n"
        f"<b>Phone:</b> {appointment.customer_phone}\n"
        f"<b>Treatment:</b> {treatment.name}\n"
        f"<b>Date:</b> {date_str}\n"
        f"<b>Time:</b> {time_str} – {end_str}\n"
        f"<b>Duration:</b> {treatment.duration_minutes} min\n"
        f"<b>Price:</b> ₪{treatment.price:.0f}"
    )
    if appointment.notes:
        telegram_message += f"\n<b>Notes:</b> {appointment.notes}"

    await send_telegram_notification(telegram_message)

    if appointment.customer_email:
        email_body = (
            f"<h2>Booking Confirmation</h2>"
            f"<p>Hi {appointment.customer_name},</p>"
            f"<p>Your appointment has been confirmed:</p>"
            f"<ul>"
            f"<li><strong>Treatment:</strong> {treatment.name}</li>"
            f"<li><strong>Date:</strong> {date_str}</li>"
            f"<li><strong>Time:</strong> {time_str} – {end_str}</li>"
            f"<li><strong>Duration:</strong> {treatment.duration_minutes} min</li>"
            f"<li><strong>Price:</strong> ₪{treatment.price:.0f}</li>"
            f"</ul>"
            f"<p>If you need to cancel or reschedule, please contact us.</p>"
        )
        await send_email_notification(
            to_email=appointment.customer_email,
            subject=f"Booking Confirmation — {treatment.name}",
            body=email_body,
        )


async def notify_cancellation(appointment: Any, treatment: Any) -> None:
    """Send cancellation notifications via all configured channels.

    Args:
        appointment: The ``Appointment`` ORM instance.
        treatment: The ``Treatment`` ORM instance.
    """
    date_str = appointment.appointment_date.strftime("%A, %B %d, %Y")
    time_str = appointment.appointment_date.strftime("%H:%M")

    telegram_message = (
        f"<b>❌ Booking Cancelled</b>\n\n"
        f"<b>Client:</b> {appointment.customer_name}\n"
        f"<b>Phone:</b> {appointment.customer_phone}\n"
        f"<b>Treatment:</b> {treatment.name}\n"
        f"<b>Date:</b> {date_str}\n"
        f"<b>Time:</b> {time_str}"
    )

    await send_telegram_notification(telegram_message)

    if appointment.customer_email:
        email_body = (
            f"<h2>Appointment Cancelled</h2>"
            f"<p>Hi {appointment.customer_name},</p>"
            f"<p>Your appointment for <strong>{treatment.name}</strong> on "
            f"<strong>{date_str}</strong> at <strong>{time_str}</strong> "
            f"has been cancelled.</p>"
            f"<p>If this was a mistake, please contact us to rebook.</p>"
        )
        await send_email_notification(
            to_email=appointment.customer_email,
            subject=f"Appointment Cancelled — {treatment.name}",
            body=email_body,
        )
