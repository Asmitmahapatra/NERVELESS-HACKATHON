const express = require("express");
const Job = require("../models/Job");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");
const router = express.Router();

// Get all jobs (with filters)
router.get("/", async (req, res) => {
  try {
    const { location, type, skills, page = 1, limit = 10 } = req.query;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const { items, pagination } = await demoStore.listJobs({
        location,
        type,
        skills,
        page,
        limit,
      });
      return res.json({ jobs: items, pagination });
    }

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

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const job = {
        _id: require("crypto").randomUUID(),
        title: req.body.title,
        company: req.body.company,
        location: req.body.location || "",
        type: req.body.type || "internship",
        salary: req.body.salary || "",
        description: req.body.description || "",
        skills: Array.isArray(req.body.skills) ? req.body.skills : [],
        postedBy: req.user.userId,
        applications: [],
        status: "open",
        postedAt: new Date(),
      };
      demoStore._state.jobs.push(job);
      return res.status(201).json(job);
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
async function applyHandler(req, res) {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const result = await demoStore.applyToJob(req.params.jobId, req.user.userId);
      if (!result.ok) return res.status(404).json({ error: result.error });
      return res.json({ success: true, message: "Application submitted!" });
    }

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
}

// Frontend currently calls this without method (defaults to GET), so support both.
router.post("/:jobId/apply", auth, applyHandler);
router.get("/:jobId/apply", auth, applyHandler);

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
