# Builtattic Marketplace

This monorepo contains the Vite React client and Express + MongoDB backend that power the Builtattic marketplace and support desk integrations.

## Local Development

```bash
npm install
npm run dev
```

This runs the client and server concurrently. Environment variables for each workspace live in `client/.env` and `server/.env` while development values are provided in the new `*.env.example` files.

## Production Deployment

The project now includes:

- **Dockerfile** – builds the React client and packages the Express API for Cloud Run.
- **cloudbuild.yaml** – opinionated Cloud Build pipeline to build, push, and deploy the container.
- **Structured logging + secret loading** – Winston JSON logs for Cloud Logging and optional Secret Manager integration.
- **Hardened webhook** – shared-secret gate for the support email ingress endpoint.

For a complete walkthrough, including Google Cloud prerequisites, secret provisioning, and custom domain setup, see `docs/DEPLOYMENT.md`.
## Vercel Deployment

1. Connect the repository to Vercel and keep the project root (`.`).
2. Leave the install command as `npm install` and the build command as `npm run build`; the client output directory is `client/dist`.
3. In the Vercel dashboard define the environment variables listed in `server/.env.example` (at minimum `MONGO_URI`, `MONGO_DBNAME`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, and any third-party API keys you rely on). You can optionally set `VITE_API_BASE_URL=/api` for client previews, otherwise the default is already relative.
4. Seed your Mongo database once by running `npm run seed:json` locally (or from a one-off Vercel job) before pointing production traffic at the project.
5. Deploy; the `/api/*` requests are automatically proxied to the Express app running inside a Vercel serverless function while static assets are served from `client/dist`.

For environment management, `vercel env pull` keeps local `.env` files aligned with the dashboard values; see `docs/VERCEL_ENV.md` for the exact list of keys to provision.

## Studio Content Editing

- **Firm dashboard hosting editor** (`/dashboard/firm`) controls the firm-wide Design Studio narrative. Use the Service Tiles section to update the service summary plus service/product tiles, then click **Save tiles** to push the change via `PUT /portal/firm/design-studio/hosting`. The live preview card mirrors the copy that renders on `/studio/:slug` once the page is refreshed.
- **Studio workspace** (`/portal/studio`) owns everything that is unique per studio: hero asset, summary, description, price, currency, style, categories/tags, area + plot metrics, bedrooms/bathrooms/floors, highlights, delivery notes, and gallery. The editor now surfaces these fields with a right-hand live preview that echoes the studio detail layout. Use **Save** to persist drafts and **Publish** (cloud icon on the table) to expose the listing on the marketplace.
- **Studio detail page** (`/studio/:slug`) stitches the two surfaces together. Hosting tiles feed the “Services & Products” blocks, while per-studio fields map directly to title, hero, specs, and pricing. Units (sq ft or m²) and currencies render exactly as selected in the workspace.

### Demo workspace login

If you don’t have local credentials, enable demo auth by setting `ENABLE_DEMO_AUTH=true` (default) and pointing `DEMO_FIRM_ID` or `DEMO_FIRM_SLUG` to any firm in your Mongo cluster. Then use the **Connect demo workspace** button in `/portal/studio`—it requests a short-lived JWT, updates `localStorage.auth_token`, and lets you create/publish studios against that firm so they immediately surface on `/studio/:slug`.
