# AlumLink (Nerveless Hackathon) — Project Summary

## What this is
**AlumLink** is a full‑stack alumni networking platform that helps students/alumni:
- discover and connect with relevant alumni (skill-based matching)
- explore verified jobs and apply
- RSVP to events
- ask questions / share updates in a forum
- book mentorship sessions

It’s built to run in **two modes**:
- **MongoDB mode (production):** persistent data via MongoDB + Mongoose
- **Demo mode (no DB):** in-memory seeded dataset so the app still works end-to-end during demos/hackathons

---

## Key features (end-user)
- **Authentication + Roles:** JWT-based auth with role-aware UX (admin vs regular users)
- **Dashboard:**
  - shows **Top Matches** (based on skills)
  - shows **Connections** (people you’ve connected with)
  - quick stats (matches, connections, average match score)
- **Networking:** connect with matches and build a connections list
- **Jobs:** browse jobs, filter (location/type), apply to jobs
- **Events:** browse upcoming events, RSVP, view “my past events” when logged in
- **Forum:**
  - category filter
  - create posts (logged in)
  - like posts (logged in)
- **Mentorship:** browse mentors and book a session
- **Admin tools:** basic admin-only stats + data export

---

## Tech stack
- **Frontend:** Static HTML/CSS + Vanilla JS (single shared `script.js`)
- **Backend:** Node.js + Express
- **Auth:** JWT Bearer token (`Authorization: Bearer <token>`) with middleware protection
- **Database (optional):** MongoDB + Mongoose models (`User`, `Post`, `Job`, `Event`, `Booking`)
- **Demo datastore:** in-memory store with seeded demo content
- **Deployment:** Render Blueprint (`render.yaml`) with `autoDeploy: true`

---

## Architecture (high level)
- The **Express server** serves:
  - the static frontend pages (HTML/CSS/JS)
  - a REST API under `/api/*`
- Backend supports:
  - **MongoDB mode** when `MONGODB_URI` is configured
  - **Demo mode fallback** when MongoDB is missing/unavailable

---

## What we improved during the hackathon (implementation highlights)
- **Git hygiene + safety:**
  - removed tracked `node_modules` from git history going forward
  - kept environment config safe by committing only **sanitized placeholders** (real secrets belong in Render env vars)
- **Deployment readiness:**
  - added and fixed Render Blueprint config so builds reliably (set `rootDir: backend`)
  - documented local run + deployment steps
- **Dashboard bug fix:**
  - wired “Matches / Connections” cards to actually toggle content
  - added missing backend endpoint for connections (`GET /api/users/connections`)
- **UX polish across pages:**
  - added consistent **loading / empty / error** states
  - made job filtering functional (Filter button triggers real API filtering)
  - improved resilience and safe rendering (basic HTML escaping)
- **Demo-mode parity:**
  - forum posting/liking/comment behavior works in demo mode
  - mentor booking/listing works in demo mode

---

## Running the project
### Local
1. Install backend dependencies:
   - `cd backend && npm install`
2. Start server:
   - `cd backend && npm start`
3. Open:
   - Frontend: `http://localhost:5000/`
   - API: `http://localhost:5000/api`

### Demo mode vs MongoDB mode
- **Demo mode:** leave `MONGODB_URI` unset; the app runs with seeded demo data.
- **MongoDB mode:** set `MONGODB_URI` and a strong `JWT_SECRET`.

---

## Deployment (Render)
- Render is configured via `render.yaml` (Blueprint)
- On push to GitHub, Render auto-deploys
- Configure environment variables in Render dashboard:
  - `MONGODB_URI` (optional, enables persistence)
  - `JWT_SECRET` (required; Render can generate)

---

## Suggested next steps (if there’s time)
- UI polish: unify styling across cards/buttons and improve responsive layout
- Add basic form validation and better error messaging on all forms
- Add pagination/search for jobs/posts
- Improve matching logic and explain “why this match”
- Add tests for key API routes and demo store behaviors
