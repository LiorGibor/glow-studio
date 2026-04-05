from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class AppointmentCreate(BaseModel):
    treatment_id: int
    customer_name: str = Field(..., min_length=1, max_length=200)
    customer_phone: str = Field(..., min_length=5, max_length=50)
    customer_email: Optional[str] = Field(None, max_length=200)
    appointment_date: datetime
    notes: Optional[str] = None


class AppointmentUpdate(BaseModel):
    customer_name: Optional[str] = Field(None, min_length=1, max_length=200)
    customer_phone: Optional[str] = Field(None, min_length=5, max_length=50)
    customer_email: Optional[str] = Field(None, max_length=200)
    appointment_date: Optional[datetime] = None
    status: Optional[str] = None
    notes: Optional[str] = None
    admin_notes: Optional[str] = None


class AppointmentResponse(BaseModel):
    id: int
    treatment_id: int
    customer_name: str
    customer_phone: str
    customer_email: Optional[str] = None
    appointment_date: datetime
    end_time: datetime
    status: str
    notes: Optional[str] = None
    admin_notes: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    treatment: Optional["TreatmentInfo"] = None

    class Config:
        from_attributes = True


class TreatmentInfo(BaseModel):
    id: int
    name: str
    category: str
    duration_minutes: int
    price: float
    image_url: Optional[str] = None

    class Config:
        from_attributes = True


# Rebuild to resolve forward ref
AppointmentResponse.model_rebuild()


class AvailableSlotsRequest(BaseModel):
    treatment_id: int
    date: str  # YYYY-MM-DD format


class TimeSlot(BaseModel):
    time: str  # HH:MM format
    available: bool
