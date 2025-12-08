# Builtattic Marketplace Frontend

This repo now only ships the Vite React client. The former Express + MongoDB backend has been removed; point the client at your own API using `VITE_API_BASE_URL` / `VITE_API_URL`.

## Local Development

```bash
npm install
npm run dev
```

This installs client dependencies and runs Vite from `client/`.

## Production Deployment

- **Vercel** – `vercel.json` is configured for a static Vite build (`npm run build`, output `client/dist`) with an SPA rewrite to `index.html`.
- **Cloud Run / Docker** – the `Dockerfile` builds the client and serves the static bundle with `serve` on `$PORT` (default 8080).
- **Environment** – only the client-side Vite variables are needed; see `.env.example` for the current list.

## Notes on the removed backend

All Express/Mongo server code and seed/maintenance scripts have been deleted. Any `/api` route references in legacy docs are now historical; wire the frontend to whichever backend you plan to replace it with.
