from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class TreatmentBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=300)
    duration_minutes: int = Field(..., gt=0)
    price: float = Field(..., ge=0)
    is_active: bool = True
    sort_order: int = 0


class TreatmentCreate(TreatmentBase):
    pass


class TreatmentUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=200)
    category: Optional[str] = Field(None, min_length=1, max_length=100)
    description: Optional[str] = None
    short_description: Optional[str] = Field(None, max_length=300)
    duration_minutes: Optional[int] = Field(None, gt=0)
    price: Optional[float] = Field(None, ge=0)
    is_active: Optional[bool] = None
    sort_order: Optional[int] = None


class TreatmentResponse(TreatmentBase):
    id: int
    slug: str
    image_url: Optional[str] = None
    gallery_urls: Optional[str] = None  # JSON string of URLs
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
