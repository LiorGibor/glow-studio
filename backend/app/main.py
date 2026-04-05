import json
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import get_settings
from app.database import init_db, SessionLocal
from app.models.admin import Admin
from app.models.settings import BusinessSettings
from app.models.blocked_slot import BlockedSlot  # noqa: F401 — register model
from app.models.notification import Notification  # noqa: F401 — register model
from app.routers import treatments, appointments, admin


settings = get_settings()


def seed_default_admin(db):
    """Create default admin if none exists."""
    existing = db.query(Admin).first()
    if not existing:
        admin_user = Admin(
            email=settings.admin_email,
            hashed_password=Admin.hash_password(settings.admin_password),
            full_name="Studio Admin",
        )
        db.add(admin_user)
        db.commit()
        print(f"Default admin created: {settings.admin_email}")


def seed_default_settings(db):
    """Create default business settings if none exist."""
    existing = db.query(BusinessSettings).first()
    if not existing:
        defaults = {
            "working_hours": json.dumps({
                "monday": {"open": "09:00", "close": "18:00", "is_open": True},
                "tuesday": {"open": "09:00", "close": "18:00", "is_open": True},
                "wednesday": {"open": "09:00", "close": "18:00", "is_open": True},
                "thursday": {"open": "09:00", "close": "18:00", "is_open": True},
                "friday": {"open": "09:00", "close": "18:00", "is_open": True},
                "saturday": {"open": "09:00", "close": "14:00", "is_open": True},
                "sunday": {"open": "09:00", "close": "18:00", "is_open": False},
            }),
            "break_times": json.dumps([{"start": "13:00", "end": "14:00"}]),
            "slot_duration": "30",
            "booking_advance_days": "30",
            "business_name": "Glow Studio",
            "business_phone": "",
            "business_address": "",
        }
        for key, value in defaults.items():
            setting = BusinessSettings(key=key, value=value)
            db.add(setting)
        db.commit()
        print("Default business settings created.")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    db = SessionLocal()
    try:
        seed_default_admin(db)
        seed_default_settings(db)
    finally:
        db.close()
    yield
    # Shutdown


app = FastAPI(
    title=settings.app_name,
    description="Beauty Salon Clinic Management & Booking API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Static files for uploaded images
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Routers
app.include_router(treatments.router)
app.include_router(appointments.router)
app.include_router(admin.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy", "app": settings.app_name}
