# Deployment Guide

This app is three independent pieces that can live on the same server or be split up:

1. **Frontend** — static build (`frontend/dist/`) served by any web server
2. **Backend** — a long-running Node.js process (Express API)
3. **Database** — MySQL 8.0.14+ (the version floor is set by `LEFT JOIN LATERAL`, used in
   the admin commitments query). Can be hosted anywhere — a managed MySQL service or an
   instance on the company server — nothing in the code assumes a specific provider, it's
   just a connection string.

The instructions below assume a Linux server with Nginx as the reverse proxy, since that's
the most common setup — adjust to your actual server's OS/stack as needed.

---

## 1. Prerequisites on the server

- Node.js 18+ and npm
- MySQL 8.0.14+ (required for `LEFT JOIN LATERAL` support used in the admin commitments query)
- Nginx (or another reverse proxy / static file server)
- A process manager for the backend: [PM2](https://pm2.keymetrics.io/) (`npm i -g pm2`) or a
  systemd service — either works, examples below use PM2
- A domain or internal hostname pointed at the server, with HTTPS (e.g. via
  [certbot](https://certbot.eff.org/))

---

## 2. Database

```bash
mysql -u root -p -e "CREATE DATABASE commitment_dashboard"
mysql -u root -p commitment_dashboard < backend/src/db/schema.sql
```
Then set `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` in the
backend `.env` to point at the instance.

`schema.sql` is the single source of truth for the `users`/`progress_log` tables — it's
sufficient on its own to bootstrap a brand-new database, no follow-up scripts needed.

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
# Fill in: DB_HOST/DB_PORT/DB_DATABASE/DB_USERNAME/DB_PASSWORD, JWT_SECRET (long
# random string), ADMIN_PIN, PORT, and FRONTEND_URL (the real production URL of
# the frontend — required for CORS)
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
1. **Database** — commitments, statuses, full `progress_log` audit trail. If using a managed
   MySQL provider, check its built-in backup/point-in-time-restore; if self-hosted, set up
   `mysqldump` on a schedule.
2. **`backend/uploads/`** — the actual evidence files users attach. These are referenced by
   URL from `progress_log.attachment_url` but live only on disk; losing this folder loses
   all evidence without losing the log entries that point to it.

## 8. Monitoring / logs

`pm2 logs commitment-backend` for backend logs. Health check endpoint: `GET /api/health`.
No frontend error tracking is wired up — consider adding one (e.g. Sentry) if this becomes
a priority.
