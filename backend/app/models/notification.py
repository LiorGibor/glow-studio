from datetime import datetime

from sqlalchemy import Column, Integer, String, Text, Boolean, DateTime

from app.database import Base


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, autoincrement=True)
    type = Column(String(50), nullable=False)  # new_booking, cancellation, completed
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=True)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
