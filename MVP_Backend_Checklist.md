# Builtattic Marketplace MVP — Backend Checklist

Detected 3 Node projects in the uploaded Dashboard.zip.

## Immediate Next Steps
1. Choose the server folder to run (where `express` & `mongoose` are present).
2. Create `server/.env` with **fresh** Mongo, JWT, SMTP, Razorpay, Cloudinary.
3. `cd server && npm install --legacy-peer-deps && npm run dev`

## Must-Haves for MVP (Backend/API)
- Auth & Roles (user/vendor/admin), sessions, password reset.
- Product & Catalog CRUD (vendor/admin), publish workflow.
- Cart & Checkout endpoints.
- Orders & Payments (Razorpay) with webhook verify.
- Vendor payouts accounting (report first; automate later).
- Dashboards data endpoints (user/vendor/admin).
- Email notifications (order placed, vendor approval).
- Swagger docs and seed scripts.
- Security: helmet, cors, rate-limit; input validation.

## Recommended API routes (v1)
- POST /auth/signup | /auth/login | /auth/refresh | /auth/forgot | /auth/reset
- GET /me | PATCH /me
- GET /catalog | GET /products/:id | POST /products | PATCH /products/:id
- GET /cart | POST /cart/items | PATCH /cart/items/:id | DELETE /cart/items/:id
- POST /orders | GET /orders/:id
- POST /payments/order | POST /payments/webhook
- GET /vendor/stats | GET /vendor/orders | GET /vendor/payouts
- GET /admin/vendors | PATCH /admin/vendors/:id/approve | GET /admin/overview
