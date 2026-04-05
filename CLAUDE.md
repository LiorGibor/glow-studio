# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glow Studio — a beauty salon booking platform. Fullstack monorepo with a FastAPI backend and React+Vite frontend.

## Commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000    # Dev server
python seed_data.py                           # Seed 10 sample treatments
pip install -r requirements.txt               # Install deps
```

### Frontend
```bash
cd frontend
npm run dev       # Dev server on :5173
npm run build     # tsc -b && vite build → dist/
npm run lint      # ESLint
npm run preview   # Preview production build
```

Both servers must run simultaneously. The Vite dev server proxies `/api` and `/static` to `localhost:8000`.

### Testing
No test infrastructure is configured yet (Phase 3). Backend `tests/` directory exists but is empty.

## Architecture

**Backend** (`backend/app/`): Layered FastAPI application.
- `main.py` — App setup, CORS, lifespan (auto-creates tables, seeds default admin/settings on startup)
- `routers/` — Endpoint handlers: treatments, appointments, admin
- `services/` — Business logic: auth (JWT HS256, 24h expiry), availability engine, notifications (Telegram + email via background tasks)
- `models/` — SQLAlchemy 2.0 ORM: Treatment, Appointment, Admin, BusinessSettings
- `schemas/` — Pydantic request/response validation
- `config.py` — Pydantic BaseSettings loaded from `.env`
- `database.py` — SQLAlchemy engine (SQLite dev, PostgreSQL-ready)

**Frontend** (`frontend/src/`): React 19 SPA with React Router v7.
- `lib/api.ts` — Axios instance with JWT interceptor (token in localStorage as `glow_token`, 401 → redirect to login)
- `lib/services.ts` — API service layer (treatmentService, appointmentService, adminService)
- `types/index.ts` — All TypeScript interfaces
- `pages/customer/` — Public booking flow (home, treatments, booking, confirmation)
- `pages/admin/` — Admin panel (login, dashboard, calendar, treatments, appointments, settings)
- `components/layout/` — Shared layout components
- Styling: Tailwind CSS v4 with custom theme in `index.css`

## Key Design Decisions

- **Single-admin model** — no registration, default seeded: `admin@glowstudio.com` / `admin123`
- **No customer auth** — bookings use name/phone/email per appointment
- **Slug-based treatment URLs** for SEO
- **BusinessSettings as key-value store** — avoids schema migrations for config changes
- **Admin login uses OAuth2PasswordRequestForm** (URL-encoded), not JSON body
- **Image uploads** stored locally in `backend/app/static/uploads/`
- **No Alembic migrations configured** — tables auto-created via `Base.metadata.create_all()`
- **Direct bcrypt** for password hashing (replaced passlib for Python 3.14 compatibility)

## Reference Docs

- `ARCHITECTURE.md` — Detailed system design, API endpoints, data models, deployment strategy
- `PROJECT_STATE.md` — Development status tracker, completed phases, known issues
