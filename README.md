# X-Traordinary Dashboard — Commitment Progress

Internal dashboard for tracking and measuring Digimers' personal HEART commitments.

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|--------------------------------------------------|
| Frontend  | React + Vite + Tailwind CSS, Recharts, ExcelJS   |
| Backend   | Node.js + Express.js, JWT auth, Multer uploads   |
| Database  | PostgreSQL (currently hosted on [Neon](https://neon.tech)) |
| Deploy    | Self-hosted on a company server (target TBD — see [DEPLOYMENT.md](./DEPLOYMENT.md)) |

---

## Quick Start (local development)

**Prerequisites:** Node.js 18+, GitHub access to this repo (it's private — ask the repo
owner to add you as a collaborator), and a PostgreSQL database you can connect to — either
install Postgres locally, or ask a teammate for a connection string to a shared dev
database (e.g. a free [Neon](https://neon.tech) project).

### 1. Clone & database
```bash
git clone https://github.com/DigimaHafizh/digimasia-dashboard-commitment-progress.git
cd digimasia-dashboard-commitment-progress

# Point this at your own Postgres instance, then create the schema:
psql "<your-database-url>" -f backend/src/db/schema.sql
```

### 2. Backend
```bash
cd backend
cp .env.example .env       # Fill in DATABASE_URL (from step 1), JWT_SECRET (any string
                            # locally), and ADMIN_PIN (a 4-digit PIN for your own admin login)
npm install
npm run dev                # Starts on http://localhost:4000
```

The schema starts empty — there are no users yet, so nothing can log in until you create
at least one. Easiest way locally is a raw SQL insert (run once, in a new terminal, DB
still pointed at your own instance):
```sql
-- Your own admin account, to log into /admin
INSERT INTO users (name, pin, is_admin) VALUES ('Your Name', '1234', true);

-- Optional: a regular employee account to test the user-facing flow
INSERT INTO users (name, pin, heart_value) VALUES ('Test User', '5678', 'Engineering');
```
(In production this is done from **Admin Panel → Add User** instead — see
[DEPLOYMENT.md](./DEPLOYMENT.md#3-adding-employees).)

### 3. Frontend
Open a **second terminal** (the backend keeps running in the first one):
```bash
cd frontend
cp .env.example .env       # Set VITE_API_URL=http://localhost:4000/api
npm install
npm run dev                # Starts on http://localhost:5173
```

Open http://localhost:5173, log in with the PIN you inserted above, and you're running
the full app locally — both servers need to keep running (two terminals, or two tabs) while
you work.

For a production install (company server), see **[DEPLOYMENT.md](./DEPLOYMENT.md)**.

---

## Core Flow (v2.1 — Review Workflow)

1. **Login** — 4-digit PIN, mirrored from the employee roster. Lands on **My Commitment
   Progress** (there is no separate public dashboard).
2. **Add My Commitment** — user submits their commitment; status becomes `On Review`.
3. **Admin reviews** — Admin **Approve**s or **Decline**s from the Admin Panel (mandatory
   comment required to decline).
   - **Declined**: the comment is shown to the user, who can revise and resubmit.
   - **Approved**: the commitment text locks permanently; progress tracking unlocks.
4. **Progress tracking** — once Approved, the user selects `In Progress` or `Achieved`,
   attaches evidence (image/PDF/DOC, max 5MB), and submits. **This also goes through Admin
   review** before it's official — every status change is approved or declined, not just
   the initial commitment.
5. **Audit trail** — every submission, review decision, and progress update is appended
   (never overwritten) to `progress_log`, viewable as a personal timeline and in the
   Admin's per-user history modal (including any attached evidence).
6. **Admin Panel** — one page for everything: summary chart, search/filter across all
   employees, the On Review queue, and Add/Delete User management.

See [`commitment-progress-dashboard_v2.1.md`](./commitment-progress-dashboard_v2.1.md) for
the original PRD (note: some later decisions in this README/DEPLOYMENT.md — e.g. progress
updates requiring review, removing the public dashboard — supersede it).

---

## Project Structure

```
backend/
  src/
    routes/          # auth, commitments (user-facing), admin
    middleware/       # JWT auth + admin guard
    db/               # pool, schema.sql
    scripts/          # applied DB migrations + diagnostics — see scripts/README.md
    seed-data/        # gitignored — raw employee/commitment spreadsheets, if any
  uploads/            # gitignored — user-uploaded evidence files (served at /api/uploads)
frontend/
  src/
    pages/            # LoginPage, UpdatePage, AdminPage
    components/       # StatusBadge, modals, guidelines, shared icons.jsx
    utils/            # api client, status helpers, Excel export
```

---

## Features
- Secure 4-digit PIN login with session persistence
- Add/revise commitment flow with Admin Approve/Decline review
- Every progress update (not just the initial commitment) goes through Admin review
- Conditional progress form (Obstacles for In Progress, Measurable Impact for Achieved)
- Evidence upload with size/type validation (client + server side)
- Admin panel: summary chart, search/filter, On Review queue, Add/Delete User, per-user
  activity history (with attachments), styled Excel export
- Full append-only progress history per user

## Status Workflow
`No Submission` → user adds commitment → `On Review` → Admin decides:
- `Declined` → user revises & resubmits → back to `On Review`
- `Approved` → user submits a progress update (`In Progress` / `Achieved`) → `On Review`
  again → Admin Approves (confirms it) or Declines (clears it, user resubmits)

---

## Data & Security

- `backend/uploads/` and `backend/seed-data/` are **gitignored** — they hold real
  employee evidence files and PIN/commitment spreadsheets and must never be committed.
- `.env` files (`DATABASE_URL`, `JWT_SECRET`, `ADMIN_PIN`) are gitignored; only
  `.env.example` is tracked.
- Login has **no rate limiting** by design, since this app was built for internal
  office-network use. Before deploying anywhere reachable outside the office LAN (VPN,
  public internet), re-enable rate limiting on `/api/auth/login` first — PINs are only 4
  digits and the login query has no throttling.
- See [DEPLOYMENT.md](./DEPLOYMENT.md) for the pre-launch checklist.

---

*Built for X-Traordinary · Grow With Heart*
