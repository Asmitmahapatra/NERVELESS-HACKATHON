const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/alumlink";
const { seedDemoData } = require("./seedDemoData");

const app = express();

// MIDDLEWARE
app.use(cors({ origin: "*" }));
app.use(express.json());

// Prevent stale HTML being served after deployments (useful on hosting/CDNs)
app.use((req, res, next) => {
  if (req.method === "GET" && (req.path === "/" || req.path.endsWith(".html"))) {
    res.setHeader("Cache-Control", "no-store, max-age=0");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }
  next();
});

// Serve frontend static files (parent folder)
app.use(express.static(path.join(__dirname, "..")));

// DATABASE
app.locals.demoMode = false;

const mongoUri = process.env.MONGODB_URI || "";
if (!mongoUri) {
  app.locals.demoMode = true;
  console.warn(
    "⚠️  MONGODB_URI not set. Starting in DEMO MODE (in-memory datastore).",
  );
} else {
  mongoose
    .connect(mongoUri, {
      serverSelectionTimeoutMS: 2000,
    })
    .then(async () => {
      console.log("✅ MongoDB Connected");
      try {
        await seedDemoData();
      } catch (e) {
        console.warn("⚠️  Seed failed:", e.message);
      }
    })
    .catch((err) => {
      app.locals.demoMode = true;
      console.warn(
        "⚠️  MongoDB connection failed. Starting in DEMO MODE (in-memory datastore).",
      );
      console.warn("MongoDB error:", err.message);
      console.warn("Tip: set MONGODB_URI or run local Mongo at", DEFAULT_MONGODB_URI);
    });
}

// TEST / API ROUTES (prefixed with /api)
app.get("/api", (req, res) => res.json({ message: "🚀 AlumLink Backend LIVE!" }));
app.get("/api/test", (req, res) => res.json({ status: "✅ Working!" }));

// Mount route modules
const authRoutes = require("./routes/auth");
const usersRoutes = require("./routes/users");
const eventsRoutes = require("./routes/events");
const jobsRoutes = require("./routes/jobs");
const mentorRoutes = require("./routes/mentor");
const postsRoutes = require("./routes/posts");
const adminRoutes = require("./routes/admin");

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/admin", adminRoutes);

// Catch-all: serve index.html for non-API routes (SPA support)
app.get("*", (req, res) => {
  if (req.path.startsWith("/api")) return res.status(404).json({ error: "Not found" });
  res.sendFile(path.join(__dirname, "..", "index.html"));
});

// START SERVER with retry if port already in use
const DEFAULT_PORT = parseInt(process.env.PORT, 10) || 5000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 Backend: http://localhost:${port}`);
    console.log(`📱 Frontend served at http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err && err.code === "EADDRINUSE") {
      console.warn(`Port ${port} in use, trying ${port + 1}...`);
      setTimeout(() => startServer(port + 1), 500);
    } else {
      console.error("Server error:", err);
      process.exit(1);
    }
  });
}

startServer(DEFAULT_PORT);
