# Google Cloud Deployment Guide

This project is now configured to run as a single container on Google Cloud Run, with build automation through Cloud Build and secrets sourced from Secret Manager. Follow the steps below to promote your local `.env` configuration into production-ready infrastructure.

## 1. Prerequisites

- **Google Cloud CLI** authenticated against your project.
- **Artifact Registry** repository ready for container images (default names used below: `$_REPOSITORY`).
- **MongoDB** instance accessible from Cloud Run (Atlas on GCP or self-managed).
- **Redis** (optional, but recommended for queues / rate limits) accessible from Cloud Run.
- **Email provider** (Gmail SMTP, SendGrid, etc.) tested with your sender.
- **Gemini API** access enabled on your chosen Google Cloud project.

## 2. Secrets & Environment Management

1. Convert server configuration into Secret Manager entries. Example:

   ```bash
   gcloud secrets create mongo-uri-secret --data-file=- <<'EOF'
   mongodb+srv://username:password@cluster.example.mongodb.net
   EOF
   ```

2. Add each secret ID to the `SECRET_MANAGER_KEYS` variable (comma-separated) in your Cloud Run deployment:

   ```
   SECRET_MANAGER_KEYS=MONGO_URI=mongo-uri-secret,JWT_SECRET=jwt-secret
   SECRET_MANAGER_PROJECT=my-gcp-project
   ```

   The new bootstrapping code pulls only secrets that are not already present as environment variables, so local overrides still work.

3. Configure non-secret values (e.g., `CORS_ORIGIN`, `LOG_LEVEL`) as standard environment variables on Cloud Run.
4. Set `API_BASE_URL` to the HTTPS origin of your Cloud Run deployment (for example `https://builtattic-xyz-uc.a.run.app`). The server will append `/api` if missing and uses this value when issuing secure download links in fulfilment emails.

## 3. Building & Running Locally

```bash
# From the repo root
docker build -t builtattic-app .
docker run --rm -p 8080:8080 \
  -e MONGO_URI="..." \
  -e JWT_SECRET="..." \
  builtattic-app
```

Static React assets are bundled during the Docker build and served by Express from `/client/dist`.

## 4. Cloud Build Pipeline

The new `cloudbuild.yaml` performs:

1. `docker build` using the multi-stage Dockerfile.
2. Pushes the image to Artifact Registry (`$_ARTIFACT_REGION-docker.pkg.dev/$PROJECT_ID/$_REPOSITORY/$_SERVICE`).
3. Deploys to Cloud Run with configurable substitutions (`_REGION`, `_SERVICE`, `_CPU`, `_MEMORY`, `_SECRET_ENV`, etc.).

Deploy manually:

```bash
gcloud builds submit --config cloudbuild.yaml \
  --substitutions=_REGION=us-central1,_ARTIFACT_REGION=us,_SERVICE=builtattic-api
```

Or create a trigger tied to your main branch.

### Optional substitutions

- `_ENV_VARS`: comma-separated standard vars (`NODE_OPTIONS=--max-old-space-size=512,LOG_LEVEL=info`)
- `_SECRET_ENV`: secret bindings (`JWT_SECRET=projects/<project>/secrets/jwt-secret:latest`)
- `_VPC_CONNECTOR` / `_VPC_EGRESS`: connect Cloud Run to a VPC for private Mongo/Redis access.

## 5. Runtime Observability

- **Structured logs** (JSON) are emitted via Winston, automatically ingested by Cloud Logging.
- **Prometheus metrics** remain on `/metrics`; wire this into Cloud Monitoring with a scrape job if needed.
- Include `SERVICE_NAME` env var to tag logs when running multiple services.

## 6. Support Chat & SSE Notes

- SSE heartbeat interval and server keep-alive are tuned for Cloud Run (max 1 hour). Cloud Run will terminate open streams at the one-hour mark—monitor usage to ensure this is acceptable.
- `SUPPORT_WEBHOOK_SECRET` now gates the inbound webhook (`/support/chat/inbound`). Configure your email/webhook provider to send the shared header `x-support-webhook-token`.

## 7. Email & Outbound Integrations

- When deploying from Cloud Run, double-check your email provider allows the service account IP range or switch to an API-based mailer.
- Gemini access uses `GEMINI_API_KEY` from Secret Manager. Assign the Cloud Run runtime service account the `roles/secretmanager.secretAccessor` role.
- For Razorpay or other payment providers, store keys in Secret Manager and reference them via `_SECRET_ENV` in Cloud Build.

## 8. Frontend Hosting Options

By default the Express server serves the built React bundle. The client build now falls back to the same-origin `/api` endpoint when no Vite env vars are provided, so a single Cloud Run service works out of the box. Alternatives:

1. Host the bundle on Cloud Storage + Cloud CDN, set `SERVE_CLIENT_FROM_API=false`, and point your frontend to the API domain.
2. Split deployments: one Cloud Run service for API, one for SSR/client if needed.

Whichever option you choose, update `VITE_API_BASE_URL` and related variables in `client/.env` (or pass them from Cloud Build) before building.

## 9. Custom Domain & SSL

1. Map your domain to Cloud Run through **Serverless Network Endpoint Groups** or the built-in custom domain mapping.
2. Use **Cloud DNS** to host DNS records.
3. Cloud Run provisions SSL certificates automatically once the domain is verified.

## 10. Tools Utilised on Google Cloud

- **Cloud Run** – hosts the containerised API + built frontend.
- **Artifact Registry** – stores versioned container images.
- **Cloud Build** – CI/CD pipeline for building and deploying.
- **Secret Manager** – manages production secrets, consumed at runtime.
- **Cloud Logging** – receives structured JSON logs from the application.
- **Cloud Monitoring** – optional, via `/metrics` endpoint scraping.
- **Cloud DNS / Managed Certificates** – for custom domains and TLS.

## 11. Post-Deployment Checklist

- [ ] Secrets populated and accessible to the Cloud Run service account.
- [ ] MongoDB/Redis networking verified (VPC connector if private).
- [ ] Email delivery tested from Cloud Run.
- [ ] Gemini API quota configured for production usage.
- [ ] SSE/chat flows verified under Cloud Run session limits.
- [ ] Cloud Build trigger wired to your repository.
- [ ] Custom domain mapped and SSL certificate issued.
