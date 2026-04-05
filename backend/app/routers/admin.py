import json
from datetime import date, datetime, timedelta, time as dt_time

from fastapi import APIRouter, Body, Depends, HTTPException, Query, status
from fastapi.security import OAuth2PasswordRequestForm
from pydantic import BaseModel
from sqlalchemy import func as sa_func
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.admin import Admin
from app.models.appointment import Appointment, AppointmentStatus
from app.models.blocked_slot import BlockedSlot
from app.models.notification import Notification
from app.models.settings import BusinessSettings
from app.models.treatment import Treatment
from app.schemas.admin import (
    AdminLogin,
    AdminResponse,
    BusinessSettingsResponse,
    BusinessSettingsUpdate,
    Token,
)
from app.services.auth import create_access_token, get_current_admin
from app.services.availability import get_business_settings


# ── Pydantic models for new endpoints ─────────────────────────────────────

class BlockedSlotCreate(BaseModel):
    date: str  # YYYY-MM-DD
    start_time: str  # HH:MM
    end_time: str  # HH:MM
    reason: str | None = None

class BlockedSlotResponse(BaseModel):
    id: int
    date: str
    start_time: str
    end_time: str
    reason: str | None
    created_at: str | None

class ReorderItem(BaseModel):
    id: int
    sort_order: int

router = APIRouter(prefix="/api/admin", tags=["Admin"])


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------


@router.post("/login", response_model=Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """Authenticate an admin and return a JWT token.

    Accepts OAuth2 password form: username (email) + password.
    """
    admin = db.query(Admin).filter(Admin.email == form_data.username).first()
    if not admin or not admin.verify_password(form_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(data={"sub": admin.email})
    return Token(access_token=access_token, token_type="bearer")


# ---------------------------------------------------------------------------
# Protected endpoints
# ---------------------------------------------------------------------------


@router.get("/me", response_model=AdminResponse)
def get_current_admin_info(
    current_admin=Depends(get_current_admin),
):
    """Return the currently authenticated admin's information."""
    return current_admin


@router.get("/settings", response_model=BusinessSettingsResponse)
def get_settings(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Return the current business settings."""
    return get_business_settings(db)


@router.put("/settings", response_model=BusinessSettingsResponse)
def update_settings(
    settings_in: BusinessSettingsUpdate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Update business settings. Each non-None field is upserted as a key/value row."""
    update_data = settings_in.model_dump(exclude_unset=True)

    for key, value in update_data.items():
        existing = (
            db.query(BusinessSettings)
            .filter(BusinessSettings.key == key)
            .first()
        )
        serialized_value = json.dumps(value)

        if existing:
            existing.value = serialized_value
        else:
            new_setting = BusinessSettings(key=key, value=serialized_value)
            db.add(new_setting)

    db.commit()

    return get_business_settings(db)


@router.get("/dashboard-stats")
def get_dashboard_stats(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Return high-level dashboard statistics."""
    from sqlalchemy import func as sa_func
    from sqlalchemy.orm import joinedload

    today_start = datetime.combine(date.today(), datetime.min.time())
    today_end = datetime.combine(date.today(), datetime.max.time())
    now = datetime.now()

    # First day of current month
    month_start = datetime.combine(date.today().replace(day=1), datetime.min.time())

    total_appointments = db.query(Appointment).count()

    today_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date >= today_start,
            Appointment.appointment_date <= today_end,
        )
        .count()
    )

    upcoming_appointments = (
        db.query(Appointment)
        .filter(
            Appointment.appointment_date > now,
            Appointment.status != AppointmentStatus.CANCELLED.value,
        )
        .count()
    )

    total_treatments = (
        db.query(Treatment)
        .filter(Treatment.is_active == True)
        .count()
    )

    # Revenue: sum treatment prices for confirmed/completed appointments
    def _revenue_query(start: datetime, end: datetime) -> float:
        result = (
            db.query(sa_func.sum(Treatment.price))
            .join(Appointment, Appointment.treatment_id == Treatment.id)
            .filter(
                Appointment.appointment_date >= start,
                Appointment.appointment_date <= end,
                Appointment.status.in_([
                    AppointmentStatus.CONFIRMED.value,
                    AppointmentStatus.COMPLETED.value,
                ]),
            )
            .scalar()
        )
        return float(result or 0)

    revenue_today = _revenue_query(today_start, today_end)
    revenue_month = _revenue_query(month_start, today_end)

    # Recent appointments (last 10)
    recent_appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.treatment))
        .order_by(Appointment.appointment_date.desc())
        .limit(10)
        .all()
    )

    # Serialize recent appointments
    recent_list = []
    for appt in recent_appointments:
        treatment_info = None
        if appt.treatment:
            treatment_info = {
                "id": appt.treatment.id,
                "name": appt.treatment.name,
                "category": appt.treatment.category,
                "duration_minutes": appt.treatment.duration_minutes,
                "price": appt.treatment.price,
                "image_url": appt.treatment.image_url,
            }
        recent_list.append({
            "id": appt.id,
            "treatment_id": appt.treatment_id,
            "customer_name": appt.customer_name,
            "customer_phone": appt.customer_phone,
            "customer_email": appt.customer_email,
            "appointment_date": appt.appointment_date.isoformat() if appt.appointment_date else None,
            "end_time": appt.end_time.isoformat() if appt.end_time else None,
            "status": appt.status,
            "notes": appt.notes,
            "admin_notes": appt.admin_notes,
            "created_at": appt.created_at.isoformat() if appt.created_at else None,
            "updated_at": appt.updated_at.isoformat() if appt.updated_at else None,
            "treatment": treatment_info,
        })

    return {
        "total_appointments": total_appointments,
        "today_appointments": today_appointments,
        "upcoming_appointments": upcoming_appointments,
        "total_treatments": total_treatments,
        "revenue_today": revenue_today,
        "revenue_month": revenue_month,
        "recent_appointments": recent_list,
    }


# ---------------------------------------------------------------------------
# Chart data
# ---------------------------------------------------------------------------


@router.get("/chart-data")
def get_chart_data(
    days: int = Query(30, ge=7, le=90),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Return daily revenue and booking counts for the last N days, plus top treatments."""
    today = date.today()
    start_date = today - timedelta(days=days - 1)
    start_dt = datetime.combine(start_date, datetime.min.time())

    # Daily stats
    appointments = (
        db.query(Appointment)
        .filter(Appointment.appointment_date >= start_dt)
        .options(joinedload(Appointment.treatment))
        .all()
    )

    daily: dict[str, dict] = {}
    for d in range(days):
        day = start_date + timedelta(days=d)
        daily[day.isoformat()] = {"date": day.isoformat(), "revenue": 0, "bookings": 0}

    treatment_counts: dict[str, int] = {}

    for appt in appointments:
        day_key = appt.appointment_date.date().isoformat()
        if day_key in daily:
            daily[day_key]["bookings"] += 1
            if appt.status in (AppointmentStatus.CONFIRMED.value, AppointmentStatus.COMPLETED.value):
                price = appt.treatment.price if appt.treatment else 0
                daily[day_key]["revenue"] += price
        if appt.treatment:
            treatment_counts[appt.treatment.name] = treatment_counts.get(appt.treatment.name, 0) + 1

    # Top 5 treatments
    top_treatments = sorted(treatment_counts.items(), key=lambda x: x[1], reverse=True)[:5]

    return {
        "daily": list(daily.values()),
        "top_treatments": [{"name": name, "count": count} for name, count in top_treatments],
    }


# ---------------------------------------------------------------------------
# Customers (aggregated from appointments)
# ---------------------------------------------------------------------------


@router.get("/customers")
def get_customers(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Aggregate unique customers from appointments."""
    appointments = (
        db.query(Appointment)
        .options(joinedload(Appointment.treatment))
        .order_by(Appointment.appointment_date.desc())
        .all()
    )

    customers: dict[str, dict] = {}
    for appt in appointments:
        key = appt.customer_phone
        if key not in customers:
            customers[key] = {
                "customer_name": appt.customer_name,
                "customer_phone": appt.customer_phone,
                "customer_email": appt.customer_email,
                "total_bookings": 0,
                "total_spent": 0.0,
                "last_visit": None,
                "appointments": [],
            }
        c = customers[key]
        c["total_bookings"] += 1
        if appt.status in (AppointmentStatus.CONFIRMED.value, AppointmentStatus.COMPLETED.value):
            c["total_spent"] += appt.treatment.price if appt.treatment else 0
        if c["last_visit"] is None or appt.appointment_date.isoformat() > c["last_visit"]:
            c["last_visit"] = appt.appointment_date.isoformat()
        # Update name/email to latest
        c["customer_name"] = appt.customer_name
        if appt.customer_email:
            c["customer_email"] = appt.customer_email
        c["appointments"].append({
            "id": appt.id,
            "treatment_name": appt.treatment.name if appt.treatment else "Unknown",
            "appointment_date": appt.appointment_date.isoformat(),
            "status": appt.status,
            "price": appt.treatment.price if appt.treatment else 0,
        })

    return list(customers.values())


# ---------------------------------------------------------------------------
# Blocked Slots
# ---------------------------------------------------------------------------


@router.get("/blocked-slots")
def list_blocked_slots(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """List blocked time slots with optional date range filter."""
    query = db.query(BlockedSlot)
    if date_from:
        query = query.filter(BlockedSlot.date >= datetime.strptime(date_from, "%Y-%m-%d").date())
    if date_to:
        query = query.filter(BlockedSlot.date <= datetime.strptime(date_to, "%Y-%m-%d").date())
    slots = query.order_by(BlockedSlot.date, BlockedSlot.start_time).all()
    return [
        {
            "id": s.id,
            "date": s.date.isoformat(),
            "start_time": s.start_time.strftime("%H:%M"),
            "end_time": s.end_time.strftime("%H:%M"),
            "reason": s.reason,
            "created_at": s.created_at.isoformat() if s.created_at else None,
        }
        for s in slots
    ]


@router.post("/blocked-slots", status_code=status.HTTP_201_CREATED)
def create_blocked_slot(
    slot_in: BlockedSlotCreate,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Create a blocked time slot."""
    slot = BlockedSlot(
        date=datetime.strptime(slot_in.date, "%Y-%m-%d").date(),
        start_time=datetime.strptime(slot_in.start_time, "%H:%M").time(),
        end_time=datetime.strptime(slot_in.end_time, "%H:%M").time(),
        reason=slot_in.reason,
    )
    db.add(slot)
    db.commit()
    db.refresh(slot)
    return {
        "id": slot.id,
        "date": slot.date.isoformat(),
        "start_time": slot.start_time.strftime("%H:%M"),
        "end_time": slot.end_time.strftime("%H:%M"),
        "reason": slot.reason,
        "created_at": slot.created_at.isoformat() if slot.created_at else None,
    }


@router.delete("/blocked-slots/{slot_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_blocked_slot(
    slot_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Delete a blocked time slot."""
    slot = db.query(BlockedSlot).filter(BlockedSlot.id == slot_id).first()
    if not slot:
        raise HTTPException(status_code=404, detail="Blocked slot not found")
    db.delete(slot)
    db.commit()


# ---------------------------------------------------------------------------
# Notifications
# ---------------------------------------------------------------------------


@router.get("/notifications")
def list_notifications(
    unread_only: bool = Query(False),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """List notifications, newest first."""
    query = db.query(Notification)
    if unread_only:
        query = query.filter(Notification.is_read == False)
    notifications = query.order_by(Notification.created_at.desc()).limit(50).all()
    unread_count = db.query(Notification).filter(Notification.is_read == False).count()
    return {
        "notifications": [
            {
                "id": n.id,
                "type": n.type,
                "title": n.title,
                "message": n.message,
                "is_read": n.is_read,
                "created_at": n.created_at.isoformat() if n.created_at else None,
            }
            for n in notifications
        ],
        "unread_count": unread_count,
    }


@router.put("/notifications/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Mark a notification as read."""
    n = db.query(Notification).filter(Notification.id == notification_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Notification not found")
    n.is_read = True
    db.commit()
    return {"ok": True}


@router.put("/notifications/read-all")
def mark_all_notifications_read(
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Mark all notifications as read."""
    db.query(Notification).filter(Notification.is_read == False).update({"is_read": True})
    db.commit()
    return {"ok": True}
