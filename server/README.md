# Builtattic Backend

## Setup
1. Copy `.env.example` to `.env` and provide real credentials/secrets for every key.
2. `cd server`
3. `npm install`
4. `npm run dev`

### Deployment readiness
- **SMTP + alerts** – `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` must point to a real mailbox. Set `ADMIN_ALERT_EMAIL` (and optionally `SALES_ALERT_EMAIL`) so invite/reset notifications reach the ops alias.
- **Super admin seed** – fill in `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` so the bootstrap routine can enforce a known owner account. `SEED_SUPERADMIN_EMAIL`/`SEED_SUPERADMIN_PASSWORD` power the `npm run seed:superadmin` helper.
- **Client URLs** – double-check `CLIENT_BASE_URL`, `CLIENT_LOGIN_URL`, and reset URL settings before promoting builds; the dashboard uses them in the invite emails you send from the admin UI.

## Features
- JWT auth (access + refresh)
- Role & permission based access
- Multi-tenant scoping
- CRUD endpoints for users, firms, clients, leads, bookings, invoices, tickets
- Activity logging
- Pagination & filtering

## API Base
`/api/*`

## Auth Flow (Frontend)
- Login => store accessToken (localStorage) + refreshToken (http only recommended if adapted)
- On expiry, call `/api/auth/refresh` with refreshToken
- Get user info `/api/auth/me`

## Pagination
`GET /resource?page=1&limit=20&sort=-createdAt&field=value`

## Notes
- `CORS_ORIGIN` must be defined via environment variables (comma separated list) and cannot be `*` in production.
- Secrets are validated at boot; missing or empty values will prevent the server from starting.
- Local development without MongoDB can be done by configuring `USE_IN_MEMORY_DB`:
  - `true`: always use the in-memory database (dev only)
  - `auto` (default): try the configured `MONGO_URI`, but fall back to in-memory if the connection fails in non-production environments
  - `false`: always require the real Mongo instance
- Gemini-powered endpoints (Vitruvi, Matters assistant/vision) can be disabled by setting `GEMINI_ENABLED=false`; the routes will fall back to heuristic responses instead of calling the Google Generative AI APIs.
- Google OAuth is enabled by setting `GOOGLE_CLIENT_ID` (backend) and `VITE_GOOGLE_CLIENT_ID` (frontend). Use the same Web Client ID you create inside Google Cloud Console so `/auth/google` and the login page can exchange tokens.
- In Google Cloud Console, add every environment you use to **Authorized JavaScript origins** (for example `http://localhost:5173`, `http://localhost:4173`, `http://localhost:4000`, `https://builtattic.com`, `https://app.builtattic.com`, `https://dashboard.builtattic.com`, and any staging domains). For completeness you can also register callback URLs such as `https://app.builtattic.com/auth/google/callback` even though the current popup flow does not hit them.
- `npm run reset:data` removes every non-super-admin account plus related carts/orders/threads. Add `ALLOW_DATA_RESET=true` if you ever need to run it against a production database; otherwise it will refuse to execute. Follow up with the seed scripts (`npm run seed:superadmin`, `npm run seed:users`, etc.) to repopulate fixtures.

Main entry: `src/index.js`

Default port: 5000 (override with the `PORT` environment variable).
