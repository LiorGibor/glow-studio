from datetime import date, time, datetime

from sqlalchemy import Column, Integer, String, Date, Time, DateTime

from app.database import Base


class BlockedSlot(Base):
    __tablename__ = "blocked_slots"

    id = Column(Integer, primary_key=True, autoincrement=True)
    date = Column(Date, nullable=False, index=True)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    reason = Column(String(300), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
