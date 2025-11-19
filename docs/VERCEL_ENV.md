# Vercel Environment Checklist

Use this sheet when creating the Production/Preview/Development environment groups in the Vercel dashboard. All variables marked **required** must be defined before deploying; the rest are optional integrations that you can skip if they are not part of your stack.

| Scope | Key | Notes |
| --- | --- | --- |
| Server | `NODE_ENV` | `production` in Production, `development` elsewhere. |
| Server | `API_PREFIX` | Usually `/api`. Must match the rewrite in `vercel.json`. |
| Server | `CLIENT_ORIGIN` | Comma-separated allowed origins (e.g. `https://your-app.vercel.app,https://app.builtattic.com`). |
| Server | `CORS_ORIGIN` | Same format as `CLIENT_ORIGIN`. |
| Server | `SERVE_CLIENT_FROM_API` | Keep `false` on Vercel (static assets are served separately). |
| Server | `MONGO_URI` / `MONGO_DBNAME` | **Required**. Use the same cluster that powers production. |
| Server | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_SECRET` | **Required**. Generate long random strings. |
| Server | `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` | SMTP credentials for invite/reset flows. |
| Server | `ADMIN_ALERT_EMAIL` | Notifications for invite/reset actions. |
| Server | `FILE_ENCRYPTION_KEY` / `ASSET_TOKEN_SECRET` | 64‑character hex values. |
| Server | `GEMINI_*`, `OPENWEATHER_API_KEY` | Only needed if AI/weather features are active. |
| Server | `BLOCKCHAIN_*` | Optional proof anchoring configuration. |
| Server | `SUPER_ADMIN_EMAIL`, `SUPER_ADMIN_PASSWORD` | Used by `ensureSuperAdmin`. Set to a locked-down admin mailbox. |
| Client | `VITE_GOOGLE_CLIENT_ID` | Google OAuth client ID used by the sign-in screen. |
| Client | `VITE_API_BASE_URL` | Keep `/api` so the browser points to the co-located API. |
| Client | `VITE_ENABLE_PORTAL_API`, `VITE_ENABLE_MARKETPLACE_API`, `VITE_ENABLE_OFFLINE_ACCOUNTS` | Feature toggles mirrored from `.env.example`. |

### CLI helpers

```bash
# Add/update an environment variable
vercel env add MONGO_URI production

# Pull dashboard values down to the shared repo root .env
vercel env pull .env --environment=development
# Optional: grab another environment snapshot
vercel env pull .env.production --environment=production
```

Always redeploy (`vercel deploy`) after changing environment variables so the new values propagate to every serverless instance.
