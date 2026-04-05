import json
from datetime import date, datetime

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.admin import Admin
from app.models.appointment import Appointment, AppointmentStatus
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
