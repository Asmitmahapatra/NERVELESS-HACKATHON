const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

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

// TEST / API ROUTES (prefixed with /api)
app.get("/api", (req, res) => res.json({ message: "🚀 AlumLink Backend LIVE!" }));
app.get("/api/test", (req, res) => res.json({ status: "✅ Working!" }));

app.get("/api/health", (req, res) => {
  const mongoConfigured = Boolean(process.env.MONGODB_URI);
  const mongoConnected = mongoose.connection?.readyState === 1;
  res.json({
    status: "ok",
    demoMode: Boolean(app.locals.demoMode),
    mongo: {
      configured: mongoConfigured,
      connected: mongoConnected,
    },
    timestamp: new Date().toISOString(),
  });
});

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

async function bootstrap() {
  const mongoUri = process.env.MONGODB_URI || "";
  if (!mongoUri) {
    console.error("❌ MONGODB_URI is required. Backend will not start without MongoDB.");
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log("✅ MongoDB Connected");
    try {
      await seedDemoData();
    } catch (e) {
      console.warn("⚠️  Seed failed:", e.message);
    }
    startServer(DEFAULT_PORT);
  } catch (err) {
    console.error("❌ MongoDB connection failed. Backend will not start.");
    console.error("MongoDB error:", err.message);
    process.exit(1);
  }
}

bootstrap();
