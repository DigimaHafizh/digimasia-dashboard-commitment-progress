# Deployment Guide

This app is three independent pieces that can live on the same server or be split up:

1. **Frontend** — static build (`frontend/dist/`) served by any web server
2. **Backend** — a long-running Node.js process (Express API)
3. **Database** — PostgreSQL, currently on [Neon](https://neon.tech) (a managed/serverless
   Postgres provider). Can stay there or move to a Postgres instance on the company server —
   nothing in the code assumes Neon specifically, it's just a connection string.

The instructions below assume a Linux server with Nginx as the reverse proxy, since that's
the most common setup — adjust to your actual server's OS/stack as needed.

---

## 1. Prerequisites on the server

- Node.js 18+ and npm
- PostgreSQL 14+ (only if moving the DB in-house; skip if staying on Neon)
- Nginx (or another reverse proxy / static file server)
- A process manager for the backend: [PM2](https://pm2.keymetrics.io/) (`npm i -g pm2`) or a
  systemd service — either works, examples below use PM2
- A domain or internal hostname pointed at the server, with HTTPS (e.g. via
  [certbot](https://certbot.eff.org/))

---

## 2. Database

If staying on Neon: nothing to do, just use the existing `DATABASE_URL`.

If moving to an in-house Postgres:
```bash
createdb commitment_dashboard
psql -d commitment_dashboard -f backend/src/db/schema.sql
```
Then update `DATABASE_URL` in the backend `.env` to point at the new instance, and set
`sslmode` appropriately (see `backend/src/db/pool.js` — it disables SSL only for
`localhost` URLs).

> `schema.sql` reflects the current intended shape of the `users`/`progress_log` tables,
> but the live database has been migrated incrementally with one-off scripts (see
> `backend/src/scripts/README.md`). If bootstrapping a **brand new** database, `schema.sql`
> alone is sufficient — it already includes the `progress_status` /
> `progress_review_reason` columns from those migrations.

## 3. Adding employees

There is no bulk-import seed script anymore (it was destructive and has been removed).
Add employees one at a time from the **Admin Panel → Add User** button (name + 4-digit PIN
+ heart value), or insert directly via SQL if bulk-loading a large roster:
```sql
INSERT INTO users (name, pin, heart_value, is_admin, is_hidden)
VALUES ('Employee Name', '1234', 'Division Name', false, false);
```
Create the Admin account the same way, with `is_admin = true`.

---

## 4. Backend

```bash
cd backend
cp .env.example .env
# Fill in: DATABASE_URL, JWT_SECRET (long random string), ADMIN_PIN, PORT,
# and FRONTEND_URL (the real production URL of the frontend — required for CORS)
npm install --omit=dev
pm2 start src/index.js --name commitment-backend
pm2 save
```

`backend/uploads/` stores user-submitted evidence files **on local disk**. Make sure this
directory:
- Persists across deploys/restarts (don't wipe it on redeploy)
- Is included in your backup strategy (see §7)
- If ever containerized (Docker), is mounted as a persistent volume — otherwise evidence
  files vanish on every container restart

## 5. Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL to the backend's public URL, e.g. https://your-domain.com/api
npm install
npm run build
```
This produces `frontend/dist/` — copy it to wherever Nginx serves static files from, e.g.
`/var/www/commitment-dashboard`.

Nginx needs SPA fallback routing (all paths serve `index.html` so React Router works) and
should reverse-proxy `/api` to the backend port:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    root /var/www/commitment-dashboard;
    index index.html;

    location / {
        try_files $uri /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 6. Pre-launch checklist

- [ ] `JWT_SECRET` is a long, random, unique value (not the dev one)
- [ ] `ADMIN_PIN` is changed from any default/placeholder
- [ ] `FRONTEND_URL` is set to the real production origin (backend CORS check depends on it)
- [ ] HTTPS is enforced (no plain HTTP in production)
- [ ] **Login rate limiting**: currently disabled by design for internal office-LAN use
      (PINs are 4 digits with no throttling — see README § Data & Security). If this server
      is reachable beyond the office network (VPN, public internet), re-enable rate
      limiting on `POST /api/auth/login` **before going live**.
- [ ] `backend/uploads/` and `backend/seed-data/` exist, are writable, and are excluded from
      version control (already gitignored) but included in backups
- [ ] Confirm `.env` files are not committed anywhere (`git status` should show none)

## 7. Backups

Two things need backing up, independently of each other:
1. **Database** — commitments, statuses, full `progress_log` audit trail. If on Neon, it
   has its own backup/point-in-time-restore; if self-hosted, set up `pg_dump` on a schedule.
2. **`backend/uploads/`** — the actual evidence files users attach. These are referenced by
   URL from `progress_log.attachment_url` but live only on disk; losing this folder loses
   all evidence without losing the log entries that point to it.

## 8. Monitoring / logs

`pm2 logs commitment-backend` for backend logs. Health check endpoint: `GET /api/health`.
No frontend error tracking is wired up — consider adding one (e.g. Sentry) if this becomes
a priority.
