from pydantic import BaseModel, EmailStr
from typing import Optional


class AdminLogin(BaseModel):
    email: str
    password: str


class AdminResponse(BaseModel):
    id: int
    email: str
    full_name: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class BusinessSettingsUpdate(BaseModel):
    working_hours: Optional[dict] = None
    break_times: Optional[list] = None
    slot_duration: Optional[int] = None
    booking_advance_days: Optional[int] = None
    business_name: Optional[str] = None
    business_phone: Optional[str] = None
    business_address: Optional[str] = None


class BusinessSettingsResponse(BaseModel):
    working_hours: dict
    break_times: list
    slot_duration: int
    booking_advance_days: int
    business_name: str
    business_phone: str
    business_address: str
