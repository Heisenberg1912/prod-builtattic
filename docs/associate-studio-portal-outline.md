# Associate & Studio Portal Outline

## Goals
- Provide immediate entry points for associates and studios to log in/register without restructuring backend auth.
- Communicate upcoming self-service profile management while keeping current read-only marketplace intact.
- Lay groundwork for deeper integration once contributor APIs are available.

## Near-Term Frontend Changes
1. **Dedicated Portal Landing Pages**
   - Create `/associates/portal` and `/studios/portal` pages that explain benefits, required assets, and link to login/register.
   - Reuse existing layout components (navbar/footer) for continuity.
2. **Portal-Aware Login Copy**
   - Allow `Login.jsx` to read `?portal=associate|studio` and adjust page headline/helper text accordingly.
   - Pre-populate hidden metadata (e.g. `localStorage` hints) to assist post-login routing once backend supports it.
3. **Calls to Action on Listing Pages**
   - Surface "Are you an associate? Manage your profile" and "Submit your studio" banners on respective listing screens.
   - Direct those CTAs to the new portal pages.

## Backend & Future Work (Not covered now)
- Issue role-specific credentials or magic links for associates/studios.
- CRUD APIs for profile submission, asset uploads, and publishing workflows.
- Dashboard modules for reviewing submissions, analytics, and moderation.
- Access control so associates see only their own entries; studios likewise.

## Open Questions
- How are current associate/studio records stored and keyed? (Needed to map logins to listings.)
- Do submissions require manual review before going live?
- Will uploads target existing CDN storage or new buckets?

This structure lets us ship a discoverable portal today while keeping the heavy lifting for a coordinated backend update.

## Backend Endpoints (implemented)

- GET /api/portal/associate/profile – returns the authenticated associate's profile, 
ull if not created.
- PUT|PATCH /api/portal/associate/profile – upserts the profile with validated data (rates, availability, portfolio links, etc.).
- GET /api/portal/studio/studios[?status=draft|published&firmId=...] – lists studio entries for the caller's firm membership with basic counts.
- POST /api/portal/studio/studios – creates a draft studio record (auto slug generation, firm inferred from membership unless supplied by admin).
- GET /api/portal/studio/studios/:id – fetches a single studio draft for editing (membership enforced).
- PUT|PATCH /api/portal/studio/studios/:id – updates an existing studio (slug regenerated on title change).
- POST /api/portal/studio/studios/:id/publish – marks the studio as published.
- DELETE /api/portal/studio/studios/:id – removes a studio draft/published entry.

All routes require Bearer auth. Associates, firm members, and admins are authorized based on role + firm membership.

