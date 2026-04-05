# Glow Studio - Project State

> Last updated: 2026-04-03

---

## Project Summary

**Glow Studio** is a beauty salon management and online booking web application for an Israeli cosmetician/beauty clinic. Customers can browse treatments, check availability, and book appointments. The admin can manage treatments, appointments, business settings, and view a dashboard.

---

## Current Status: Frontend + Backend Complete, Ready for Testing

### Phase 1: Backend API - COMPLETE

| Component               | Status | Notes                                                    |
| ----------------------- | ------ | -------------------------------------------------------- |
| FastAPI app setup        | Done   | CORS, lifespan, static files, health check               |
| Config management        | Done   | pydantic-settings, `.env` driven                         |
| Database layer           | Done   | SQLAlchemy 2.0, SQLite, `create_all()` on startup        |
| Treatment model + CRUD   | Done   | Full CRUD, slug-based lookup, image upload, soft-delete   |
| Appointment model + CRUD | Done   | Booking, admin CRUD, status management                   |
| Admin model + auth       | Done   | JWT login (OAuth2 form), bcrypt passwords, auto-seed      |
| Business settings        | Done   | Key-value store, working hours/breaks/slot config         |
| Availability engine      | Done   | Slot calculation with breaks, bookings, duration, past-time |
| Notification service     | Done   | Telegram Bot API + SMTP email (async, optional)          |
| Image upload             | Done   | Local filesystem, main image + gallery                   |
| Seed data                | Done   | 10 sample treatments across 5 categories                 |
| Dashboard stats          | Done   | Revenue calculation, recent appointments included         |
| API documentation        | Done   | Auto-generated via FastAPI /docs                         |

### Phase 2: Frontend - COMPLETE

| Component                       | Status    | Notes                                       |
| ------------------------------- | --------- | ------------------------------------------- |
| Vite + React + TypeScript setup | Done      | Vite 8, React 19, TS 5.9                   |
| Tailwind CSS + Framer Motion    | Done      | Tailwind v4, custom theme, glass effects    |
| Landing page / treatment grid   | Done      | Mobile-first, category filtering, stagger   |
| Treatment detail modal/page     | Done      | Gallery, description, price, duration       |
| Booking flow                    | Done      | 4-step wizard with date/time/details/confirm|
| Booking confirmation screen     | Done      | Animated checkmark, summary card            |
| Admin login page                | Done      | OAuth2 form, JWT storage, error handling    |
| Admin dashboard                 | Done      | Stats cards, revenue, recent appointments   |
| Admin calendar view             | Done      | Monthly grid, day detail panel              |
| Admin treatment management      | Done      | CRUD, image uploads, search, modal form     |
| Admin appointment management    | Done      | List, filter, edit, quick status, delete    |
| Admin settings page             | Done      | Working hours, breaks, slot config, biz info|

### Phase 3: Testing & QA - NOT STARTED

| Component                | Status      | Notes                                        |
| ------------------------ | ----------- | -------------------------------------------- |
| Backend unit tests       | Not started |                                              |
| Frontend component tests | Not started |                                              |
| Playwright E2E tests     | Not started | Autonomous UI testing per project rules      |
| Visual regression tests  | Not started |                                              |

### Phase 4: Production Readiness - PARTIAL

| Component                | Status      | Notes                                        |
| ------------------------ | ----------- | -------------------------------------------- |
| Alembic migrations       | Not started | Dependency listed, not configured            |
| Cloudinary integration   | Not started | Config keys exist, code not wired            |
| PostgreSQL support       | Not started | SQLAlchemy is DB-agnostic, needs testing     |
| Dockerfile / compose     | Not started |                                              |
| Root .gitignore          | Done        | Covers Python, Node, IDE, env, uploads       |
| Environment separation   | Partial     | .env.example exists, proxy configured        |

---

## Bugs Fixed This Session

1. **passlib/bcrypt incompatibility** - Replaced `passlib.CryptContext` with direct `bcrypt` library usage for Python 3.14 compatibility.
2. **Login endpoint format** - Changed from JSON body (`AdminLogin`) to `OAuth2PasswordRequestForm` to match frontend's URL-encoded form submission.
3. **Dashboard stats incomplete** - Added `revenue_today`, `revenue_month`, and `recent_appointments` to the `/api/admin/dashboard-stats` response.
4. **AppointmentStatus enum access** - Fixed `AppointmentStatus.cancelled` (lowercase) to `AppointmentStatus.CANCELLED.value` (correct uppercase enum member).
5. **Removed Pillow** - Unused dependency that failed to build on Python 3.14.
6. **Pinned -> flexible deps** - Changed `==` to `>=` in requirements.txt for broader compatibility.

---

## Seed Data (Pre-loaded Treatments)

| Category   | Treatment                    | Duration | Price (ILS) |
| ---------- | ---------------------------- | -------- | ----------- |
| Eyebrows   | Classic Eyebrow Shaping      | 30 min   | 35          |
| Eyebrows   | Microblading                 | 120 min  | 250         |
| Nails      | Gel Manicure                 | 60 min   | 45          |
| Nails      | Nail Art Design              | 90 min   | 65          |
| Makeup     | Bridal Makeup                | 120 min  | 180         |
| Makeup     | Evening Glam Makeup          | 75 min   | 95          |
| Lashes     | Eyelash Extensions - Classic | 90 min   | 120         |
| Lashes     | Lash Lift & Tint             | 60 min   | 75          |
| Skincare   | Deep Cleansing Facial        | 60 min   | 85          |
| Skincare   | Anti-Aging Facial            | 75 min   | 120         |

---

## Default Admin Credentials (Development)

| Field    | Value                  |
| -------- | ---------------------- |
| Email    | admin@glowstudio.com   |
| Password | admin123               |

---

## How to Run

### Backend (Terminal 1)
```bash
cd backend
python -m venv venv              # only first time
source venv/bin/activate          # macOS/Linux
pip install -r requirements.txt   # only first time
python seed_data.py               # only first time (seeds 10 treatments)
uvicorn app.main:app --reload --port 8000
```

### Frontend (Terminal 2)
```bash
cd frontend
npm install    # only first time
npm run dev
```

Then open http://localhost:5173 in your browser.
Admin panel: http://localhost:5173/admin/login

---

## Next Steps (Priority Order)

1. Write Playwright E2E tests
2. Set up Alembic migrations
3. Wire Cloudinary for production image hosting
4. Test with PostgreSQL
5. Containerize with Docker
