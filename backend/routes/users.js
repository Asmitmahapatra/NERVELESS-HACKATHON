const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");
const router = express.Router();

function scoreMatches(baseSkills, candidates) {
  const normalizedBase = (baseSkills || [])
    .map((s) => String(s || "").trim())
    .filter(Boolean);

  return (candidates || [])
    .map((candidate) => {
      const candidateSkills = (candidate.skills || []).map((s) => String(s || ""));
      const common = normalizedBase.filter((skill) =>
        candidateSkills.some((s) => s.toLowerCase().includes(skill.toLowerCase())),
      );

      const denom = Math.max(normalizedBase.length, candidateSkills.length || 1);
      const matchScore = Math.round((common.length / denom) * 100);
      return { ...candidate, matchScore };
    })
    .sort((a, b) => b.matchScore - a.matchScore);
}

// Quick AI match demo (works with or without auth)
router.post("/ai-match", async (req, res) => {
  try {
    const { skills } = req.body || {};
    const requestedSkills = Array.isArray(skills) ? skills : [];

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    let excludeId = null;
    const authHeader = req.header("Authorization")?.replace("Bearer ", "");
    if (authHeader) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(
          authHeader,
          process.env.JWT_SECRET || "alumlink_secret",
        );
        excludeId = decoded.userId;
      } catch {
        // ignore invalid token for demo match
      }
    }

    const candidates = isDemoMode
      ? (await demoStore.listUsers()).filter((u) => u._id !== excludeId)
      : await User.find(excludeId ? { _id: { $ne: excludeId } } : {})
          .select("name role skills industry location profilePic")
          .lean();

    const matches = scoreMatches(requestedSkills, candidates)
      .filter((m) => m.matchScore >= 20)
      .slice(0, 20)
      .map((m) => ({
        _id: m._id,
        name: m.name,
        role: m.role,
        skills: m.skills || [],
        industry: m.industry || "",
        location: m.location || "",
        matchScore: m.matchScore,
      }));

    res.json({ success: true, matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get AI matches
router.get("/matches", auth, async (req, res) => {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);

    const user = isDemoMode
      ? await demoStore.findUserById(req.user.userId)
      : await User.findById(req.user.userId);

    const matches = isDemoMode
      ? (await demoStore.listUsers())
          .filter((u) => u._id !== req.user.userId)
          .map((u) => ({
            _id: u._id,
            name: u.name,
            email: u.email,
            role: u.role,
            skills: u.skills || [],
            industry: u.industry || "",
            location: u.location || "",
          }))
      : await User.find({ _id: { $ne: req.user.userId } })
          .select("name email role skills industry location")
          .lean();

    const scoredMatches = matches
      .map((match) => {
        const commonSkills = user.skills.filter((skill) =>
          match.skills.some((s) =>
            s.toLowerCase().includes(skill.toLowerCase()),
          ),
        );
        return {
          ...match,
          matchScore: Math.round(
            (commonSkills.length /
              Math.max(user.skills.length, match.skills.length || 1)) *
              100,
          ),
        };
      })
      .filter((m) => m.matchScore > 30)
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 20);

    res.json(scoredMatches);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Connect with user
async function connectHandler(req, res) {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      await demoStore.addConnection(req.user.userId, req.params.userId);
      return res.json({ success: true, message: "Connected successfully!" });
    }

    const user = await User.findById(req.user.userId);
    const targetUser = await User.findById(req.params.userId);

    if (user && targetUser && !user.connections.includes(targetUser._id)) {
      user.connections.push(targetUser._id);
      await user.save();
    }

    res.json({ success: true, message: "Connected successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

// Frontend currently calls this without method (defaults to GET), so support both.
router.post("/connect/:userId", auth, connectHandler);
router.get("/connect/:userId", auth, connectHandler);

module.exports = router;
