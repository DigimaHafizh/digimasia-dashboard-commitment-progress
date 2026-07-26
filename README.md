# X-Traordinary Dashboard — Commitment Progress

Internal dashboard for tracking and measuring Digimers' personal HEART commitments over a 6-month period.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | React + Vite + Tailwind CSS, Recharts, ExcelJS   |
| Backend   | Node.js + Express.js, JWT auth, Multer uploads   |
| Database  | PostgreSQL (hosted on [Neon](https://neon.tech)) |
| Deploy    | Vercel (frontend) + Railway (backend)            |

---

## Quick Start

### 1. Database
```bash
# Create a PostgreSQL database and run the schema
psql -d commitment_dashboard -f backend/src/db/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env       # Fill in DATABASE_URL, JWT_SECRET, ADMIN_PIN
npm install
npm run dev                # Starts on http://localhost:4000
```

Optional: `backend/src/db/seed-employees.js` bulk-imports employees and PINs from
spreadsheets placed in `backend/seed-data/` (gitignored — never commit real employee
data here; see [Data & Security](#data--security) below).

### 3. Frontend
```bash
cd frontend
cp .env.example .env       # Set VITE_API_URL
npm install
npm run dev                # Starts on http://localhost:5173
```

---

## Core Flow (v2.1 — Review Workflow)

1. **Login** — 4-digit PIN, mirrored from the employee roster.
2. **Add My Commitment** — user submits their 6-month commitment; status becomes `On Review`.
3. **Admin reviews** — Admin **Accept**s or **Reject**s from the Admin Panel.
   - **Rejected**: a mandatory comment is shown to the user, who can revise and resubmit.
   - **Accepted**: the commitment text locks permanently; progress tracking unlocks.
4. **Progress tracking** — once Accepted, the user selects `In Progress` or `Achieved` and
   uploads evidence (image/PDF/DOC, max 5MB) with every update.
5. **Audit trail** — every submission, review decision, and progress update is appended
   (never overwritten) to `progress_log`, viewable as a personal timeline and in the
   Admin's per-user history modal.
6. **Public dashboard** — all Digimers can search/filter everyone's current status and
   measurable impact (challenges/obstacles stay admin-only).

See [`commitment-progress-dashboard_v2.1.md`](./commitment-progress-dashboard_v2.1.md) for
the full PRD.

---

## Project Structure

```
backend/
  src/
    routes/         # auth, commitments (user-facing), admin
    middleware/      # JWT auth + admin guard
    db/              # pool, schema.sql, seed-employees.js
    scripts/         # one-off maintenance/migration scripts (not run in prod)
    seed-data/       # gitignored — raw employee/commitment spreadsheets for seeding
  uploads/           # gitignored — user-uploaded evidence files (served at /api/uploads)
frontend/
  src/
    pages/           # LoginPage, DashboardPage, UpdatePage, AdminPage
    components/      # StatusBadge, modals, guidelines, shared icons.jsx
    utils/           # api client, status helpers, Excel export
```

---

## Features
- Secure 4-digit PIN login with session persistence
- Public dashboard: search, status filter, 6-category summary chart
- Add/revise commitment flow with Admin Accept/Reject review
- Conditional progress form (Obstacles for In Progress, Measurable Impact for Achieved)
- Evidence upload with size/type validation (client + server side)
- Admin panel: On Review queue, per-user activity history, styled Excel export
- Full append-only progress history per user

## Status Workflow
`No Submission` → user adds commitment → `On Review` → Admin decides:
- `Rejected` → user revises & resubmits → back to `On Review`
- `Accepted` → user tracks progress → `In Progress` → `Achieved`

---

## Data & Security

- `backend/uploads/` and `backend/seed-data/` are **gitignored** — they hold real
  employee evidence files and PIN/commitment spreadsheets and must never be committed.
- `.env` files (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PIN`) are gitignored; only
  `.env.example` is tracked.
- Login has no rate limiting by design, since this app is intended for internal
  office-network use. If this ever gets exposed beyond the office LAN (VPN, public
  internet), re-enable rate limiting on `/api/auth/login` first — PINs are only 4 digits.

---

*Built for X-Traordinary · Grow With Heart*
