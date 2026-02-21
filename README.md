# NERVELESS-HACKATHON

Full-stack demo:
- Frontend: React + Vite (`frontend/`)
- Backend: Node.js + Express API (serves the frontend and `/api/*`)

## Run locally

1) Install backend deps:

```bash
cd backend
npm install
```

2) Install frontend deps:

```bash
cd ../frontend
npm install
```

3) Create env:

- Copy `backend/.env.example` to `backend/.env` (or edit the existing `backend/.env`)
- Set `MONGODB_URI` to a valid MongoDB connection string.

4) Start backend:

```bash
cd backend
npm start
```

5) Start React frontend (optional for local UI dev):

```bash
cd ../frontend
npm run dev
```

Open:
- http://localhost:5173 (React app in dev mode)
- http://localhost:5000/api (API)

## Deploy (Render)

This repo includes `render.yaml`.

For a hackathon submission-style overview, see `HACKATHON_SUMMARY.md`.

1) Push to GitHub (already done)
2) In Render: **New** → **Blueprint** → select your repo
3) In the created service: set these environment variables:

- `MONGODB_URI` = your MongoDB Atlas connection string
- `JWT_SECRET` = a long random string (Render can auto-generate if you keep the blueprint setting)

Then deploy. Render will run:
- Build (in `backend/`): `npm install && npm --prefix ../frontend install && npm --prefix ../frontend run build`
- Start (in `backend/`): `node server.js`

Notes:
- The app reads `PORT` from the platform.
- MongoDB is required; backend startup fails if MongoDB is not configured/connected.
- Use `GET /api/health` to verify mode/connection status.
