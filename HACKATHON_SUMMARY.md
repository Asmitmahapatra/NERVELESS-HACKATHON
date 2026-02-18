# AlumLink (Nerveless Hackathon) — Project Summary

## What this is
**AlumLink** is a full‑stack alumni networking platform that helps students/alumni:
- discover and connect with relevant alumni (skill-based matching)
- explore verified jobs and apply
- RSVP to events
- ask questions / share updates in a forum
- book mentorship sessions

It runs in **MongoDB mode** with persistent data via MongoDB + Mongoose.

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
- **Database:** MongoDB + Mongoose models (`User`, `Post`, `Job`, `Event`, `Booking`)
- **Deployment:** Render Blueprint (`render.yaml`) with `autoDeploy: true`

---

## Architecture (high level)
- The **Express server** serves:
  - the static frontend pages (HTML/CSS/JS)
  - a REST API under `/api/*`
- Backend requires:
  - **MongoDB connection** via `MONGODB_URI`
  - startup fails if MongoDB is missing/unavailable

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
- **Backend reliability:**
  - added `GET /api/health` to verify DB connectivity and runtime status

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

### MongoDB setup
- Set `MONGODB_URI` to your MongoDB connection string.
- Set a strong `JWT_SECRET`.
- Verify runtime with `GET /api/health`.

---

## Deployment (Render)
- Render is configured via `render.yaml` (Blueprint)
- On push to GitHub, Render auto-deploys
- Configure environment variables in Render dashboard:
  - `MONGODB_URI` (required)
  - `JWT_SECRET` (required; Render can generate)

---

## Suggested next steps (if there’s time)
- UI polish: unify styling across cards/buttons and improve responsive layout
- Add basic form validation and better error messaging on all forms
- Add pagination/search for jobs/posts
- Improve matching logic and explain “why this match”
- Add tests for key API routes and demo store behaviors
