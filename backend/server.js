const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();

// MIDDLEWARE
app.use(cors({ origin: "*" }));
app.use(express.json());

// Serve frontend static files (parent folder)
app.use(express.static(path.join(__dirname, "..")));

// DATABASE
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.log("❌ MongoDB Error:", err.message));

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

app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/events", eventsRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/mentor", mentorRoutes);
app.use("/api/posts", postsRoutes);

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
