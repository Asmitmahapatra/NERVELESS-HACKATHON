const express = require("express");
const User = require("../models/User");
const auth = require("../middleware/auth");
const router = express.Router();

// Get AI matches
router.get("/matches", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const matches = await User.find({ _id: { $ne: req.user.userId } })
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
router.post("/connect/:userId", auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    const targetUser = await User.findById(req.params.userId);

    if (!user.connections.includes(targetUser._id)) {
      user.connections.push(targetUser._id);
      await user.save();
    }

    res.json({ success: true, message: "Connected successfully!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
