from sqlalchemy import Column, Integer, String, Text, Float, Boolean, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Treatment(Base):
    __tablename__ = "treatments"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    slug = Column(String(200), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=False)  # e.g., "Eyebrows", "Nails", "Makeup"
    description = Column(Text, nullable=True)
    short_description = Column(String(300), nullable=True)
    duration_minutes = Column(Integer, nullable=False)  # duration in minutes
    price = Column(Float, nullable=False)
    image_url = Column(String(500), nullable=True)
    gallery_urls = Column(Text, nullable=True)  # JSON array of image URLs
    is_active = Column(Boolean, default=True)
    sort_order = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    appointments = relationship("Appointment", back_populates="treatment")
