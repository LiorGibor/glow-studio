import json
import logging
from datetime import datetime, date, time, timedelta
from typing import Any

from sqlalchemy.orm import Session

from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_slot import BlockedSlot
from app.models.settings import BusinessSettings
from app.models.treatment import Treatment
from app.schemas.appointment import TimeSlot

logger = logging.getLogger(__name__)

# ── Default business configuration ──────────────────────────────────────────

DEFAULT_WORKING_HOURS: dict[str, dict[str, Any]] = {
    "monday":    {"open": "09:00", "close": "18:00", "is_open": True},
    "tuesday":   {"open": "09:00", "close": "18:00", "is_open": True},
    "wednesday": {"open": "09:00", "close": "18:00", "is_open": True},
    "thursday":  {"open": "09:00", "close": "18:00", "is_open": True},
    "friday":    {"open": "09:00", "close": "18:00", "is_open": True},
    "saturday":  {"open": "09:00", "close": "14:00", "is_open": True},
    "sunday":    {"open": "09:00", "close": "18:00", "is_open": False},
}

DEFAULT_BREAK_TIMES: list[dict[str, str]] = [
    {"start": "13:00", "end": "14:00"},
]

DEFAULT_SLOT_DURATION = 30  # minutes
DEFAULT_BOOKING_ADVANCE_DAYS = 30


# ── Helpers ─────────────────────────────────────────────────────────────────

def _parse_time(t: str) -> time:
    """Parse an ``HH:MM`` string into a :class:`datetime.time`."""
    return datetime.strptime(t, "%H:%M").time()


def _time_to_minutes(t: time) -> int:
    return t.hour * 60 + t.minute


def _minutes_to_time(minutes: int) -> time:
    return time(hour=minutes // 60, minute=minutes % 60)


# ── Public API ──────────────────────────────────────────────────────────────

def get_business_settings(db: Session) -> dict[str, Any]:
    """Load all business settings from the DB and merge with defaults.

    Settings are stored as individual key/value rows.  Values are JSON-encoded
    where appropriate.

    Returns:
        A dict with keys: ``working_hours``, ``break_times``,
        ``slot_duration``, ``booking_advance_days``, ``business_name``,
        ``business_phone``, ``business_address``.
    """
    defaults: dict[str, Any] = {
        "working_hours": DEFAULT_WORKING_HOURS,
        "break_times": DEFAULT_BREAK_TIMES,
        "slot_duration": DEFAULT_SLOT_DURATION,
        "booking_advance_days": DEFAULT_BOOKING_ADVANCE_DAYS,
        "business_name": "Glow Studio",
        "business_phone": "",
        "business_address": "",
    }

    rows = db.query(BusinessSettings).all()
    for row in rows:
        try:
            defaults[row.key] = json.loads(row.value)
        except (json.JSONDecodeError, TypeError):
            # Plain string values that are not JSON-encoded.
            defaults[row.key] = row.value

    return defaults


def get_available_slots(
    db: Session,
    treatment_id: int,
    date_str: str,
) -> list[TimeSlot]:
    """Calculate available booking slots for *treatment_id* on *date_str*.

    Args:
        db: SQLAlchemy database session.
        treatment_id: The treatment to calculate slots for (determines
            duration).
        date_str: Date in ``YYYY-MM-DD`` format.

    Returns:
        A list of :class:`TimeSlot` objects, each with a ``time`` and an
        ``available`` flag.
    """
    # ── Resolve treatment ───────────────────────────────────────────────
    treatment = db.query(Treatment).filter(Treatment.id == treatment_id).first()
    if treatment is None:
        return []

    treatment_duration = treatment.duration_minutes

    # ── Parse target date ───────────────────────────────────────────────
    try:
        target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    except ValueError:
        logger.warning("Invalid date format: %s", date_str)
        return []

    # ── Load business settings ──────────────────────────────────────────
    settings = get_business_settings(db)
    working_hours: dict[str, Any] = settings["working_hours"]
    break_times: list[dict[str, str]] = settings["break_times"]
    slot_duration: int = settings["slot_duration"]

    # ── Determine day schedule ──────────────────────────────────────────
    day_name = target_date.strftime("%A").lower()
    day_config = working_hours.get(day_name)

    if day_config is None or not day_config.get("is_open", False):
        return []

    open_time = _parse_time(day_config["open"])
    close_time = _parse_time(day_config["close"])

    # ── Build break intervals (in minutes from midnight) ────────────────
    break_intervals: list[tuple[int, int]] = []
    for brk in break_times:
        break_intervals.append((
            _time_to_minutes(_parse_time(brk["start"])),
            _time_to_minutes(_parse_time(brk["end"])),
        ))

    # ── Fetch existing appointments for that day ────────────────────────
    day_start = datetime.combine(target_date, time.min)
    day_end = datetime.combine(target_date, time.max)

    existing_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date >= day_start,
            Appointment.appointment_date <= day_end,
            Appointment.status.notin_([
                AppointmentStatus.CANCELLED.value,
            ]),
        )
        .all()
    )

    # Pre-compute booked intervals in minutes from midnight.
    booked_intervals: list[tuple[int, int]] = []
    for appt in existing_appointments:
        appt_start = _time_to_minutes(appt.appointment_date.time())
        appt_end = _time_to_minutes(appt.end_time.time())
        booked_intervals.append((appt_start, appt_end))

    # ── Fetch blocked slots for that day ───────────────────────────────
    blocked_slots = (
        db.query(BlockedSlot)
        .filter(BlockedSlot.date == target_date)
        .all()
    )
    blocked_intervals: list[tuple[int, int]] = []
    for bs in blocked_slots:
        blocked_intervals.append((
            _time_to_minutes(bs.start_time),
            _time_to_minutes(bs.end_time),
        ))

    # ── Generate slots ──────────────────────────────────────────────────
    slots: list[TimeSlot] = []
    current_minutes = _time_to_minutes(open_time)
    close_minutes = _time_to_minutes(close_time)

    while current_minutes + treatment_duration <= close_minutes:
        slot_start = current_minutes
        slot_end = current_minutes + treatment_duration

        available = True

        # Check overlap with break times.
        for brk_start, brk_end in break_intervals:
            if slot_start < brk_end and slot_end > brk_start:
                available = False
                break

        # Check overlap with blocked slots.
        if available:
            for blk_start, blk_end in blocked_intervals:
                if slot_start < blk_end and slot_end > blk_start:
                    available = False
                    break

        # Check overlap with existing appointments.
        if available:
            for appt_start, appt_end in booked_intervals:
                if slot_start < appt_end and slot_end > appt_start:
                    available = False
                    break

        # Check that the slot is not in the past.
        if available and target_date == date.today():
            now_minutes = _time_to_minutes(datetime.now().time())
            if slot_start <= now_minutes:
                available = False

        slot_time = _minutes_to_time(current_minutes)
        slots.append(TimeSlot(
            time=slot_time.strftime("%H:%M"),
            available=available,
        ))

        current_minutes += slot_duration

    return slots
