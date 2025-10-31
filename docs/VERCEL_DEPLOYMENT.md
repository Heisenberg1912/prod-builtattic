# Vercel Deployment Guide

This repository is configured so both the Vite client and the Express API deploy to Vercel. The client builds to static assets, while the API runs as a serverless function.

## Project layout recap

- `client/` – Vite React app compiled to `client/dist`.
- `server/src/` – Express application.
- `api/index.mjs` – Serverless handler that initialises the Express app.
- `vercel.json` – Shared build and routing configuration for Vercel.

## Deployment prerequisites

- **Node runtime**: Vercel Node.js 20 (set in `vercel.json`).
- **MongoDB**: Provide a reachable MongoDB connection string.
- **Environment variables**: Configure at least the following in the Vercel dashboard:
  - `MONGO_URI`
  - `MONGO_DBNAME`
  - `JWT_ACCESS_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CORS_ORIGIN` (comma-separated list of allowed origins, e.g. your Vercel domains)
  - Optional integrations such as Cloudinary, Razorpay, SMTP, Gemini, etc.
  - When using Google Secret Manager: `SECRET_MANAGER_PROJECT` and `SECRET_MANAGER_KEYS`.
- **Optional**: `SERVE_CLIENT_FROM_API=false` keeps static hosting on Vercel (already set via `vercel.json`).

## Build & routing

- `installCommand`: `npm install` (root script installs client and server sub-projects).
- `buildCommand`: `npm run build` (delegates to the Vite build inside `client/`).
- `/api/*` rewrites to `api/index.mjs`, which initialises the Express app and Mongo connection.
- All other routes serve files from `client/dist`.

## Local verification

1. `npm install`
2. `npm run build`
3. Start the API locally with `npm --prefix server run dev` and confirm `/api/health`.
4. Optionally run `vercel dev` to emulate the combined deployment.

## Deploying

1. Connect the repository to Vercel (framework preset: Vite).
2. Ensure the project root is set to the repository root.
3. Configure the environment variables for Production, Preview, and Development as required.
4. Trigger a deploy. `/` serves the Vite app; `/api/*` resolves to the serverless Express API.

## Notes

- Secrets defined in `server/src/config/hardcodedEnv.js` are for local development. Override every secret with real values in Vercel before going live.
- The bootstrap layer caches secret loading and the Mongo connection, so cold starts only pay the initialisation cost once per serverless instance.
