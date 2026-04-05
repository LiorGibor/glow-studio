from sqlalchemy import Column, Integer, String, Text, DateTime
from sqlalchemy.sql import func
from app.database import Base


class BusinessSettings(Base):
    __tablename__ = "business_settings"

    id = Column(Integer, primary_key=True, index=True)
    key = Column(String(100), unique=True, nullable=False, index=True)
    value = Column(Text, nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())


# Default settings structure (stored as JSON in value column):
# working_hours: {"monday": {"open": "09:00", "close": "18:00", "is_open": true}, ...}
# break_times: [{"start": "13:00", "end": "14:00"}]
# slot_duration: 30  (minutes)
# booking_advance_days: 30
# business_name: "Glow Studio"
# business_phone: ""
# business_address: ""
