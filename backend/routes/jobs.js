const express = require("express");
const Job = require("../models/Job");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all jobs (with filters)
router.get("/", async (req, res) => {
  try {
    const { location, type, skills, page = 1, limit = 10 } = req.query;

    const filter = { status: "open" };
    if (location) filter.location = { $regex: location, $options: "i" };
    if (type) filter.type = type;
    if (skills) filter.skills = { $in: [skills] };

    const jobs = await Job.find(filter)
      .populate("postedBy", "name role")
      .sort({ postedAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(filter);

    res.json({
      jobs,
      pagination: {
        current: parseInt(page),
        totalPages: Math.ceil(total / limit),
        total,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create job (alumni only)
router.post("/", auth, async (req, res) => {
  try {
    if (req.user.role !== "alumni") {
      return res.status(403).json({ error: "Only alumni can post jobs" });
    }

    const job = new Job({
      ...req.body,
      postedBy: req.user.userId,
    });
    await job.save();

    const populatedJob = await Job.findById(job._id).populate(
      "postedBy",
      "name",
    );

    res.status(201).json(populatedJob);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Apply to job
router.post("/:jobId/apply", auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);
    if (!job || job.status === "closed") {
      return res.status(404).json({ error: "Job not found or closed" });
    }

    if (!job.applications.includes(req.user.userId)) {
      job.applications.push(req.user.userId);
      await job.save();
    }

    res.json({ success: true, message: "Application submitted!" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my jobs (posted/applied)
router.get("/my-jobs", auth, async (req, res) => {
  try {
    const { type } = req.query; // 'posted' or 'applied'

    if (type === "posted") {
      const jobs = await Job.find({ postedBy: req.user.userId }).sort({
        postedAt: -1,
      });
      res.json(jobs);
    } else if (type === "applied") {
      const jobs = await Job.find({
        applications: req.user.userId,
        status: "open",
      }).populate("postedBy", "name");
      res.json(jobs);
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
