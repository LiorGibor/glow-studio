# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Glow Studio — a beauty salon booking platform for an Israeli salon. Fullstack monorepo with a FastAPI backend and React+Vite frontend. Primary language is **Hebrew (RTL)** with English as secondary language.

**GitHub:** https://github.com/LiorGibor/glow-studio

## Commands

### Backend
```bash
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --port 8000    # Dev server
python seed_data.py                           # Seed 10 sample treatments (Hebrew)
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

### E2E Tests (Playwright)
```bash
cd frontend
npx playwright test                          # Run all tests
npx playwright test e2e/full-qa.spec.ts      # Full QA suite (33 tests)
npx playwright test --grep "test name"       # Run specific test
```

Both servers must run simultaneously. The Vite dev server proxies `/api` and `/static` to `localhost:8000`.

## Architecture

**Backend** (`backend/app/`): Layered FastAPI application.
- `main.py` — App setup, CORS, lifespan (auto-creates tables, seeds default admin/settings on startup)
- `routers/` — Endpoint handlers: treatments, appointments, admin
- `services/` — Business logic: auth (JWT HS256, 24h expiry), availability engine, notifications (Telegram + email via background tasks)
- `models/` — SQLAlchemy 2.0 ORM: Treatment, Appointment, Admin, BusinessSettings
- `schemas/` — Pydantic request/response validation
- `config.py` — Pydantic BaseSettings loaded from `.env`
- `database.py` — SQLAlchemy engine (SQLite: `backend/glow_studio.db`, auto-created on startup)

**Frontend** (`frontend/src/`): React 19 SPA with React Router v7.
- `lib/api.ts` — Axios instance with JWT interceptor (token in localStorage as `glow_token`, 401 → redirect to login)
- `lib/services.ts` — API service layer (treatmentService, appointmentService, adminService)
- `types/index.ts` — All TypeScript interfaces
- `pages/customer/` — Public booking flow (home, treatments, booking, confirmation)
- `pages/admin/` — Admin panel (login, dashboard, calendar, treatments, appointments, settings)
- `components/layout/` — Shared layout components (AdminLayout, Navbar, Footer)
- `components/LanguageToggle.tsx` — HE/EN toggle button
- Styling: Tailwind CSS v4 with custom theme in `index.css`, Heebo font for Hebrew

## i18n / RTL

- **react-i18next** with `i18next-browser-languagedetector`
- Translation files: `frontend/src/locales/en.json` and `he.json` (~250 keys each)
- Config: `frontend/src/i18n.ts` — `fallbackLng: "he"`, detection via localStorage only (`glow_lang` key)
- `<html>` gets `dir` and `lang` attributes dynamically on language change
- RTL layout uses Tailwind logical properties: `start/end`, `ms/me`, `ps/pe` (not `left/right`, `ml/mr`)
- AdminLayout sidebar: uses `max-lg:ltr:` / `max-lg:rtl:` for mobile hide animation to avoid specificity conflicts
- Treatment names/descriptions come from the database (Hebrew), not translation files — only UI strings are i18n'd
- Categories in DB are also in Hebrew (גבות, ציפורניים, איפור, ריסים, טיפוח עור)

## Key Design Decisions

- **Single-admin model** — no registration, default seeded: `admin@glowstudio.com` / `admin123`
- **No customer auth** — bookings use name/phone/email per appointment
- **Slug-based treatment URLs** for SEO (slugs remain in English: `gel-manicure`, `microblading`)
- **BusinessSettings as key-value store** — avoids schema migrations for config changes
- **Admin login uses OAuth2PasswordRequestForm** (URL-encoded), not JSON body
- **Image uploads** stored locally in `backend/app/static/uploads/`
- **No Alembic migrations configured** — tables auto-created via `Base.metadata.create_all()`
- **Direct bcrypt** for password hashing (replaced passlib for Python 3.14 compatibility)
- **SQLite for dev and production** — sufficient for single-salon scale
- **No deployment configured yet** — runs locally only

## Reference Docs

- `ARCHITECTURE.md` — Detailed system design, API endpoints, data models, deployment strategy
- `PROJECT_STATE.md` — Development status tracker, completed phases, known issues
- `docs/superpowers/plans/2026-04-05-hebrew-i18n-rtl.md` — i18n implementation plan
