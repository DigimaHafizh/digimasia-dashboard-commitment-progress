# X-Traordinary Dashboard — Commitment Progress

Internal dashboard for tracking and measuring Digimers' personal HEART commitments over a 6-month period.

---

## Tech Stack

| Layer     | Technology            |
|-----------|-----------------------|
| Frontend  | React + Vite + Tailwind CSS |
| Backend   | Node.js + Express.js  |
| Database  | PostgreSQL             |
| Deploy    | Railway               |

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
cp .env.example .env       # Fill in DATABASE_URL, JWT_SECRET
npm run dev                # Starts on http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env       # Set VITE_API_URL
npm run dev                # Starts on http://localhost:5173
```

---

## Features
- 🔐 Secure 4-digit PIN login with session persistence
- 📊 Public dashboard: search, status filter, summary pie chart
- ✍️ Conditional update form (Challenges / Measurable Impact)
- ⚠️ Needs Review flagging with dynamic hover tooltips
- 🛡️ Admin panel: inline commitment editing, audit trail, Excel export
- 📜 Full append-only progress history per user

## Status Workflow
`Not Started` → Challenges field shown  
`In Progress` → Challenges field shown  
`Achieved` → Measurable Impact field shown (Challenges hidden from dashboard)

---

*Built for X-Traordinary · Grow With Heart*
