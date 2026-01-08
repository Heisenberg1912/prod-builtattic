# Builtattic — Marketplace Platform

Builtattic is a multi-sided marketplace for architects, design associates, and clients.
The platform combines design hosting, professional services, and hiring workflows into a unified dashboard and public marketplace.

This repository contains the **main web application** powering dashboards, studios, and public discovery.

---

## What’s Included

### Core Areas

* **Unified Dashboard** – Central hub for all user activity
* **Design Studio** – Publish architectural designs and plans
* **Skill Studio** – Professional profiles, services, and portfolios
* **Material Studio** - Raw building materials hashed and anchored to the Polygon blockchain
* **Public Marketplaces** – Browse designs and hire professionals

### User Types
* Associates (architects, designers)
* Firms
* Clients
* Vendors
* Admins
Access and features are role-based.

---

## Project Structure

```
/
├── client/                 # Frontend (React + Vite)
│   ├── pages/
│   │   └── dashboard/
│   │       ├── Dashboard.jsx
│   │       ├── DesignStudio.jsx
│   │       └── SkillStudio.jsx
│   ├── services/           # API clients
│   └── App.jsx             # Route configuration
│
├── server/                 # Backend (Node + Express)
│   ├── src/
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── app.js
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Requirements
* Node.js 18+
* npm

### Install & Run
```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd client
npm install
npm run dev
```

Frontend runs on:

```
http://localhost:5173
```

---

## Main Routes

| Route                          | Purpose                     |
| ------------------------------ | --------------------------- |
| `/dashboard`                   | Unified dashboard           |
| `/dashboard/new-design-studio` | Design Studio               |
| `/dashboard/new-skill-studio`  | Skill Studio                |
| `/studio`                      | Public design marketplace   |
| `/associates`                  | Public services marketplace |

---

## Dashboard Overview

### Dashboard
* Activity overview
* Quick stats (projects, services, views)
* Navigation to studios

### Design Studio
* Create and manage design projects
* Upload images, videos, PDFs
* Draft / publish workflow
* Categories, tags, engagement tracking

### Skill Studio
* Professional profile
* Skills and availability
* Paid service listings
* Portfolio showcase
* Public / private visibility toggle

---

## Authentication

The platform supports:
* **Production authentication** (Clerk)
* **Demo login** for local development

For development and testing, a demo login is available that bypasses real auth and sets a local session.
> ⚠️ Demo login is for development only and should not be enabled in production.

---

## API Overview

### Dashboard

```
GET /new-dashboard
GET /new-dashboard/stats
```

### Design Studio

```
GET    /new-design-studio/projects
POST   /new-design-studio/projects
PATCH  /new-design-studio/projects/:id
POST   /new-design-studio/projects/:id/publish
DELETE /new-design-studio/projects/:id
POST   /new-design-studio/projects/:id/media
```

### Skill Studio

```
GET    /new-skill-studio/profile
PATCH  /new-skill-studio/profile
POST   /new-skill-studio/services
PATCH  /new-skill-studio/services/:serviceId
DELETE /new-skill-studio/services/:serviceId
POST   /new-skill-studio/portfolio
DELETE /new-skill-studio/portfolio/:itemId
POST   /new-skill-studio/toggle-public
POST   /new-skill-studio/upload/:type
```

All routes are authenticated and scoped to the logged-in user.

---

## Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Lucide Icons

### Backend

* Node.js
* Express
* MongoDB
* JWT Authentication

### Infra

* Cloud storage for uploads
* Role-based access control
* Secure API middleware (CORS, rate limiting, validation)

---

## Design Notes

* Mobile-first responsive layout
* Studio-specific visual themes
* Dashboard-first navigation model
* Public discovery separated from private management

---

## Status

* Core dashboard and studios implemented
* Authentication and role flows working
* Public marketplaces live
* Backend API stable for MVP

---

## Notes for Contributors

This repo represents the **main platform surface**, not experiments or internal tooling.
Feature work should align with:

* Marketplace stability
* Role clarity
* Clear separation of public vs private views

Supporting documents:

* `NEW_DASHBOARD_IMPLEMENTATION.md`
* `USER_FLOWS_GUIDE.md`
* `IMPLEMENTATION_SUMMARY.md`

---

## License

MIT
