# Glow Studio - Architecture Document

## Overview

Glow Studio is a beauty salon/clinic management and online booking web application. It enables customers to browse treatments, check availability, and book appointments, while providing the salon owner with a full admin dashboard for managing the business.

**Target locale:** Israel (currency: ILS/Shekel, Hebrew-compatible schedule)

---

## System Architecture

```
                    ┌──────────────────────────────┐
                    │        Client Browser         │
                    │   (React + Vite + Tailwind)   │
                    │       localhost:5173           │
                    └──────────────┬────────────────┘
                                   │  HTTP / REST
                                   │
                    ┌──────────────▼────────────────┐
                    │     FastAPI Backend (ASGI)     │
                    │         localhost:8000         │
                    │                                │
                    │  ┌──────────────────────────┐  │
                    │  │     CORS Middleware       │  │
                    │  ├──────────────────────────┤  │
                    │  │   Static File Serving    │  │
                    │  │   (/static/uploads/*)    │  │
                    │  ├──────────────────────────┤  │
                    │  │        Routers           │  │
                    │  │  /api/treatments         │  │
                    │  │  /api/appointments       │  │
                    │  │  /api/admin              │  │
                    │  ├──────────────────────────┤  │
                    │  │       Services           │  │
                    │  │  - auth (JWT/OAuth2)     │  │
                    │  │  - availability engine   │  │
                    │  │  - notifications         │  │
                    │  ├──────────────────────────┤  │
                    │  │   SQLAlchemy ORM Layer   │  │
                    │  └───────────┬──────────────┘  │
                    └──────────────┼─────────────────┘
                                   │
                    ┌──────────────▼────────────────┐
                    │         SQLite Database        │
                    │       glow_studio.db           │
                    │  (PostgreSQL-ready for prod)   │
                    └──────────────────────────────┘

              External (optional):
              ┌────────────────────────┐  ┌────────────────────┐
              │  Telegram Bot API      │  │  SMTP Email Server │
              │  (booking alerts)      │  │  (confirmations)   │
              └────────────────────────┘  └────────────────────┘
```

---

## Tech Stack

| Layer              | Technology             | Version   | Notes                                       |
| ------------------ | ---------------------- | --------- | ------------------------------------------- |
| **Frontend**       | React (Vite)           | —         | Tailwind CSS + Framer Motion                |
| **Backend**        | Python / FastAPI       | 0.104.1   | ASGI via Uvicorn                            |
| **ORM**            | SQLAlchemy             | 2.0.23    | DeclarativeBase, async-ready                |
| **Database (dev)** | SQLite                 | —         | File-based, zero config                     |
| **Database (prod)**| PostgreSQL             | —         | Neon / Supabase free tier                   |
| **Auth**           | JWT (HS256)            | —         | python-jose, 24h token expiry               |
| **Password Hash**  | bcrypt (direct)        | 5.0+      | Replaced passlib for Py3.14 compat  |
| **Validation**     | Pydantic               | 2.5.2     | Request/response schemas                    |
| **Config**         | pydantic-settings      | 2.1.0     | `.env` file driven                          |
| **File Upload**    | python-multipart       | 0.0.6     | + aiofiles for async writes                 |
| **HTTP Client**    | httpx                  | 0.25.2    | Telegram Bot API calls                      |
| **Email**          | aiosmtplib             | 3.0.1     | Async SMTP                                  |
| **Images (dev)**   | Local filesystem       | —         | `app/static/uploads/`                       |
| **Images (prod)**  | Cloudinary (free tier) | —         | Config keys prepared, not yet wired         |

---

## Frontend Architecture

```
frontend/src/
├── main.tsx                      # Entry point: BrowserRouter + Toaster
├── App.tsx                       # Route definitions (customer + admin)
├── index.css                     # Tailwind v4 + custom theme tokens
│
├── types/
│   └── index.ts                  # All TypeScript interfaces
│
├── lib/
│   ├── api.ts                    # Axios instance with JWT interceptor
│   ├── services.ts               # API service layer (treatments, appointments, admin)
│   └── utils.ts                  # Helpers: formatPrice, formatDuration, getCategoryIcon
│
├── components/layout/
│   ├── CustomerLayout.tsx         # Navbar + Outlet + Footer
│   ├── AdminLayout.tsx            # Sidebar + auth guard + Outlet
│   ├── Navbar.tsx                 # Sticky glass navbar, mobile menu
│   └── Footer.tsx                 # Three-column footer
│
└── pages/
    ├── customer/
    │   ├── HomePage.tsx            # Hero + treatment grid with categories
    │   ├── TreatmentPage.tsx       # Treatment detail with gallery
    │   ├── BookingPage.tsx         # 4-step booking wizard
    │   └── BookingConfirmation.tsx  # Post-booking success screen
    │
    └── admin/
        ├── AdminLogin.tsx          # OAuth2 form login
        ├── Dashboard.tsx           # Stats cards + recent appointments
        ├── AdminCalendar.tsx       # Monthly calendar with day detail
        ├── AdminTreatments.tsx     # CRUD grid + modal form + image upload
        ├── AdminAppointments.tsx   # Table + filters + edit modal
        └── AdminSettings.tsx       # Working hours, breaks, booking config
```

---

## Directory Structure

```
pycharm_project/
├── ARCHITECTURE.md              # This file
├── PROJECT_STATE.md             # Current project progress tracker
├── main.py                      # PyCharm scaffold (unused)
│
├── backend/
│   ├── .env                     # Environment variables (gitignored)
│   ├── .env.example             # Template for env vars
│   ├── requirements.txt         # Python dependencies
│   ├── seed_data.py             # Seeds 10 sample treatments
│   ├── venv/                    # Python virtual environment
│   │
│   └── app/
│       ├── __init__.py
│       ├── main.py              # FastAPI app, lifespan, CORS, routers
│       ├── config.py            # pydantic-settings config
│       ├── database.py          # SQLAlchemy engine + SessionLocal
│       │
│       ├── models/
│       │   ├── treatment.py     # Treatment table (name, slug, category, price, duration, images)
│       │   ├── appointment.py   # Appointment table + status enum
│       │   ├── admin.py         # Admin table (email, hashed_password)
│       │   └── settings.py      # BusinessSettings key/value store
│       │
│       ├── schemas/
│       │   ├── treatment.py     # Pydantic schemas for treatment CRUD
│       │   ├── appointment.py   # Pydantic schemas for appointments + TimeSlot
│       │   └── admin.py         # Pydantic schemas for auth, settings, dashboard
│       │
│       ├── routers/
│       │   ├── treatments.py    # GET/POST/PUT/DELETE treatments + image upload
│       │   ├── appointments.py  # Booking, availability, admin CRUD
│       │   └── admin.py         # Login, settings, dashboard stats
│       │
│       ├── services/
│       │   ├── auth.py          # JWT create/verify + OAuth2 scheme
│       │   ├── availability.py  # Time slot calculation engine
│       │   └── notification.py  # Telegram + email notification dispatch
│       │
│       └── static/
│           └── uploads/         # Runtime image uploads (created at runtime)
│
└── frontend/                    # React + Vite + Tailwind (complete)
    ├── package.json
    ├── vite.config.ts           # API proxy to backend:8000
    ├── tsconfig.json
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── index.css
        ├── types/index.ts
        ├── lib/api.ts, services.ts, utils.ts
        ├── components/layout/
        └── pages/customer/ + admin/
```

---

## Data Models

### Treatment
| Column            | Type         | Notes                              |
| ----------------- | ------------ | ---------------------------------- |
| id                | Integer (PK) | Auto-increment                     |
| name              | String(200)  |                                    |
| slug              | String(200)  | Unique, URL-friendly               |
| category          | String(100)  | e.g. Eyebrows, Nails, Makeup       |
| description       | Text         | Full description                   |
| short_description | String(300)  | Card preview text                  |
| duration_minutes  | Integer      | Treatment length                   |
| price             | Float        | In ILS (Shekels)                   |
| image_url         | String(500)  | Main image path                    |
| gallery_urls      | Text (JSON)  | Array of additional image URLs     |
| is_active         | Boolean      | Soft-delete flag                   |
| sort_order        | Integer      | Display ordering                   |
| created_at        | DateTime     | Auto-set on creation               |
| updated_at        | DateTime     | Auto-set on update                 |

### Appointment
| Column           | Type         | Notes                               |
| ---------------- | ------------ | ----------------------------------- |
| id               | Integer (PK) |                                    |
| treatment_id     | Integer (FK) | References treatments.id           |
| customer_name    | String(200)  |                                    |
| customer_phone   | String(50)   |                                    |
| customer_email   | String(200)  | Optional                           |
| appointment_date | DateTime     | Start time (indexed)               |
| end_time         | DateTime     | Computed: start + duration         |
| status           | String(20)   | pending/confirmed/cancelled/completed/no_show |
| notes            | Text         | Customer notes                     |
| admin_notes      | Text         | Internal notes                     |
| created_at       | DateTime     |                                    |
| updated_at       | DateTime     |                                    |

### Admin
| Column          | Type         | Notes                               |
| --------------- | ------------ | ----------------------------------- |
| id              | Integer (PK) |                                    |
| email           | String(200)  | Unique login                       |
| hashed_password | String(200)  | bcrypt                             |
| full_name       | String(200)  |                                    |
| created_at      | DateTime     |                                    |

### BusinessSettings (Key-Value)
| Column | Type         | Notes                               |
| ------ | ------------ | ----------------------------------- |
| id     | Integer (PK) |                                    |
| key    | String(100)  | Unique setting name                 |
| value  | Text         | JSON-encoded or plain string        |

---

## API Endpoints

### Public (No Auth)
| Method | Path                                        | Purpose                        |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/health`                               | Health check                   |
| GET    | `/api/treatments/`                          | List active treatments         |
| GET    | `/api/treatments/categories`                | List treatment categories      |
| GET    | `/api/treatments/{slug}`                    | Get treatment by slug          |
| GET    | `/api/appointments/available-slots`         | Get available time slots       |
| POST   | `/api/appointments/`                        | Book an appointment            |
| POST   | `/api/admin/login`                          | Admin login (returns JWT)      |

### Admin (JWT Required)
| Method | Path                                        | Purpose                        |
| ------ | ------------------------------------------- | ------------------------------ |
| GET    | `/api/admin/me`                             | Current admin info             |
| GET    | `/api/admin/settings`                       | Get business settings          |
| PUT    | `/api/admin/settings`                       | Update business settings       |
| GET    | `/api/admin/dashboard-stats`                | Dashboard statistics           |
| POST   | `/api/treatments/`                          | Create treatment               |
| PUT    | `/api/treatments/{id}`                      | Update treatment               |
| DELETE | `/api/treatments/{id}`                      | Soft-delete treatment          |
| POST   | `/api/treatments/{id}/upload-image`         | Upload main image              |
| POST   | `/api/treatments/{id}/upload-gallery`       | Upload gallery images          |
| GET    | `/api/appointments/`                        | List appointments (filtered)   |
| GET    | `/api/appointments/{id}`                    | Get single appointment         |
| PUT    | `/api/appointments/{id}`                    | Update appointment             |
| DELETE | `/api/appointments/{id}`                    | Delete appointment             |
| POST   | `/api/appointments/admin-create`            | Admin creates appointment      |

---

## Key Design Decisions

1. **Slug-based treatment URLs** - Treatments are fetched publicly by URL-friendly slugs for SEO readiness.
2. **Key-value settings store** - Business settings use a flexible key/value model to avoid schema migrations when adding new settings.
3. **Soft-delete for treatments** - Preserves referential integrity with historical appointments; hard-delete for appointments.
4. **Background notifications** - FastAPI `BackgroundTasks` ensures Telegram/email dispatch doesn't block API responses.
5. **Single-admin model** - One admin seeded on startup; the table supports multiple but no registration endpoint exists.
6. **No customer accounts** - Customers are identified by name/phone/email per booking. No login required.
7. **Confirmed-by-default** - New bookings are auto-confirmed (no approval workflow).
8. **Availability engine** - Considers working hours per weekday, break times, existing bookings, treatment duration, and past-time filtering.
9. **Direct bcrypt usage** - Replaced `passlib.CryptContext` with direct `bcrypt` library for Python 3.14+ compatibility.
10. **OAuth2 form login** - Login endpoint accepts `OAuth2PasswordRequestForm` (URL-encoded `username`/`password`) matching the frontend's auth flow.

---

## Authentication Flow

```
Client                           Server
  │                                │
  │  POST /api/admin/login         │
  │  {email, password}             │
  │ ──────────────────────────────>│
  │                                │  verify bcrypt hash
  │  {access_token, token_type}    │  create JWT (HS256, 24h)
  │ <──────────────────────────────│
  │                                │
  │  GET /api/admin/me             │
  │  Authorization: Bearer <jwt>   │
  │ ──────────────────────────────>│
  │                                │  decode JWT, lookup admin
  │  {id, email, full_name}        │
  │ <──────────────────────────────│
```

---

## Booking Flow

```
1. Customer browses treatments     → GET /api/treatments/
2. Selects treatment, picks date   → GET /api/appointments/available-slots?treatment_id=X&date=YYYY-MM-DD
3. Availability engine calculates  → working hours - breaks - existing bookings = open slots
4. Customer selects slot, submits  → POST /api/appointments/ {treatment_id, customer_name, phone, date}
5. Backend validates no overlap    → Creates appointment, triggers background notification
6. On-screen confirmation          → Telegram/email sent asynchronously
```

---

## Deployment Strategy (Zero Cost)

| Component | Service         | Tier     |
| --------- | --------------- | -------- |
| Frontend  | Vercel          | Free     |
| Backend   | Render/Railway  | Free     |
| Database  | Neon/Supabase   | Free     |
| Images    | Cloudinary      | Free     |
| Alerts    | Telegram Bot    | Free     |
| Email     | Gmail SMTP      | Free     |
