# Builtattic Backend

## Setup
1. Configuration values live in `src/config/hardcodedEnv.js`; adjust them there if needed.
2. `cd server`
3. `npm install`
4. `npm run dev`

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
Adjust CORS_ORIGIN in env for production.

CORS_ORIGIN supports comma separated list e.g. http://localhost:3000,http://localhost:5173

Main entry: src/index.js
Run: npm run dev

Default port: 5000 (adjust in src/config/hardcodedEnv.js if required)
