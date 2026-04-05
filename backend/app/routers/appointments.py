from datetime import datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import and_
from sqlalchemy.orm import Session, joinedload

from app.database import get_db
from app.models.appointment import Appointment, AppointmentStatus
from app.models.treatment import Treatment
from app.schemas.appointment import (
    AppointmentCreate,
    AppointmentResponse,
    AppointmentUpdate,
    TimeSlot,
)
from app.services.auth import get_current_admin
from app.services.availability import get_available_slots
from app.services.notification import notify_cancellation, notify_new_booking

router = APIRouter(prefix="/api/appointments", tags=["Appointments"])


def _calculate_end_time(appointment_date: datetime, duration_minutes: int) -> datetime:
    return appointment_date + timedelta(minutes=duration_minutes)


def _check_overlap(
    db: Session,
    appointment_date: datetime,
    end_time: datetime,
    exclude_id: int | None = None,
) -> bool:
    """Return True if an overlapping confirmed appointment exists."""
    query = db.query(Appointment).filter(
        Appointment.status == AppointmentStatus.CONFIRMED.value,
        Appointment.appointment_date < end_time,
        Appointment.end_time > appointment_date,
    )
    if exclude_id is not None:
        query = query.filter(Appointment.id != exclude_id)
    return query.first() is not None


def _create_appointment(
    appointment_in: AppointmentCreate,
    db: Session,
    background_tasks: BackgroundTasks,
) -> Appointment:
    """Shared logic for both public and admin appointment creation."""
    treatment = db.query(Treatment).filter(Treatment.id == appointment_in.treatment_id).first()
    if not treatment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Treatment not found",
        )

    end_time = _calculate_end_time(
        appointment_in.appointment_date,
        treatment.duration_minutes,
    )

    if _check_overlap(db, appointment_in.appointment_date, end_time):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Time slot overlaps with an existing confirmed appointment",
        )

    appointment = Appointment(
        **appointment_in.model_dump(),
        end_time=end_time,
    )
    db.add(appointment)
    db.commit()
    db.refresh(appointment)

    background_tasks.add_task(notify_new_booking, appointment, treatment)

    return appointment


# ---------------------------------------------------------------------------
# Public endpoints
# ---------------------------------------------------------------------------


@router.get("/available-slots", response_model=list[TimeSlot])
def available_slots(
    treatment_id: int = Query(...),
    date: str = Query(..., pattern=r"^\d{4}-\d{2}-\d{2}$"),
    db: Session = Depends(get_db),
):
    """Return available booking slots for a given treatment and date."""
    return get_available_slots(db, treatment_id, date)


@router.post("/", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def create_appointment(
    appointment_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """Book a new appointment (public)."""
    return _create_appointment(appointment_in, db, background_tasks)


# ---------------------------------------------------------------------------
# Admin endpoints
# ---------------------------------------------------------------------------


@router.get("/", response_model=list[AppointmentResponse])
def list_appointments(
    date_from: str | None = Query(None),
    date_to: str | None = Query(None),
    appointment_status: str | None = Query(None, alias="status"),
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """List all appointments with optional filters (admin only)."""
    query = db.query(Appointment).options(joinedload(Appointment.treatment))

    if date_from:
        try:
            dt_from = datetime.fromisoformat(date_from)
            query = query.filter(Appointment.appointment_date >= dt_from)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_from format. Use ISO format.",
            )

    if date_to:
        try:
            dt_to = datetime.fromisoformat(date_to)
            query = query.filter(Appointment.appointment_date <= dt_to)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid date_to format. Use ISO format.",
            )

    if appointment_status:
        query = query.filter(Appointment.status == appointment_status)

    appointments = query.order_by(Appointment.appointment_date.desc()).all()
    return appointments


@router.get("/{appointment_id}", response_model=AppointmentResponse)
def get_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Get a single appointment by ID (admin only)."""
    appointment = (
        db.query(Appointment)
        .options(joinedload(Appointment.treatment))
        .filter(Appointment.id == appointment_id)
        .first()
    )
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )
    return appointment


@router.put("/{appointment_id}", response_model=AppointmentResponse)
def update_appointment(
    appointment_id: int,
    appointment_in: AppointmentUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Update an appointment (admin only)."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    update_data = appointment_in.model_dump(exclude_unset=True)

    # If the appointment date changes, recalculate end_time
    if "appointment_date" in update_data:
        treatment = db.query(Treatment).filter(Treatment.id == appointment.treatment_id).first()
        if treatment:
            new_end_time = _calculate_end_time(
                update_data["appointment_date"],
                treatment.duration_minutes,
            )
            if _check_overlap(
                db,
                update_data["appointment_date"],
                new_end_time,
                exclude_id=appointment_id,
            ):
                raise HTTPException(
                    status_code=status.HTTP_409_CONFLICT,
                    detail="New time slot overlaps with an existing confirmed appointment",
                )
            update_data["end_time"] = new_end_time

    # Check if status is changing to cancelled
    old_status = appointment.status
    new_status = update_data.get("status")

    for field, value in update_data.items():
        setattr(appointment, field, value)

    db.commit()
    db.refresh(appointment)

    if new_status == AppointmentStatus.CANCELLED.value and old_status != AppointmentStatus.CANCELLED.value:
        treatment = db.query(Treatment).filter(Treatment.id == appointment.treatment_id).first()
        if treatment:
            background_tasks.add_task(notify_cancellation, appointment, treatment)

    return appointment


@router.delete("/{appointment_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_appointment(
    appointment_id: int,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Hard-delete an appointment (admin only)."""
    appointment = db.query(Appointment).filter(Appointment.id == appointment_id).first()
    if not appointment:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Appointment not found",
        )

    db.delete(appointment)
    db.commit()


@router.post("/admin-create", response_model=AppointmentResponse, status_code=status.HTTP_201_CREATED)
def admin_create_appointment(
    appointment_in: AppointmentCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    _admin=Depends(get_current_admin),
):
    """Create an appointment as admin (requires authentication)."""
    return _create_appointment(appointment_in, db, background_tasks)
