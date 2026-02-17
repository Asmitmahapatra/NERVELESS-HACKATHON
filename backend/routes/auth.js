const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");
const router = express.Router();

// Register
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, skills, industry, location } =
      req.body;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);

    if (isDemoMode) {
      const existing = await demoStore.findUserByEmail(email);
      if (existing) return res.status(400).json({ error: "User already exists" });

      const user = await demoStore.createUser({
        name,
        email,
        password,
        role,
        skills,
        industry,
        location,
      });

      const token = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET || "alumlink_secret",
        { expiresIn: "7d" },
      );

      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: user._id,
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
        },
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      skills,
      industry,
      location,
    });
    await user.save();

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "alumlink_secret",
      { expiresIn: "7d" },
    );

    res.status(201).json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    const user = isDemoMode
      ? await demoStore.findUserByEmail(email)
      : await User.findOne({ email });

    const passwordOk = user
      ? isDemoMode
        ? await demoStore.comparePassword(user, password)
        : await user.comparePassword(password)
      : false;

    if (!user || !passwordOk) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || "alumlink_secret",
      { expiresIn: "7d" },
    );

    res.json({
      success: true,
      token,
      user: {
        _id: user._id,
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get current user profile
router.get("/profile", auth, async (req, res) => {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    const user = isDemoMode
      ? await demoStore.findUserById(req.user.userId)
      : await User.findById(req.user.userId).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        skills: user.skills || [],
        industry: user.industry || "",
        location: user.location || "",
        connections: user.connections || [],
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
