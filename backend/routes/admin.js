const express = require("express");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");

const User = require("../models/User");
const Job = require("../models/Job");
const Event = require("../models/Event");
const Post = require("../models/Post");
const Booking = require("../models/Booking");

const router = express.Router();

router.use(auth);
router.use((req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
});

router.get("/stats", async (req, res) => {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    if (isDemoMode) {
      const usersToday = demoStore._state.users.filter((u) => {
        const joined = u.joined ? new Date(u.joined) : null;
        return joined && joined >= startOfDay;
      }).length;

      const jobsToday = demoStore._state.jobs.filter((j) => {
        const postedAt = j.postedAt ? new Date(j.postedAt) : null;
        return postedAt && postedAt >= startOfDay;
      }).length;

      const bookingsToday = demoStore._state.bookings.filter((b) => {
        const createdAt = b.createdAt ? new Date(b.createdAt) : null;
        return createdAt && createdAt >= startOfDay;
      }).length;

      const upcomingEvents = demoStore._state.events.filter((e) => {
        const date = e.date ? new Date(e.date) : null;
        return date && date >= new Date();
      }).length;

      return res.json({
        success: true,
        users: demoStore._state.users.length,
        mentors: demoStore._state.users.filter((u) => u.role === "alumni").length,
        jobs: demoStore._state.jobs.length,
        events: demoStore._state.events.length,
        posts: demoStore._state.posts.length,
        bookings: demoStore._state.bookings.length,
        usersToday,
        jobsToday,
        bookingsToday,
        upcomingEvents,
      });
    }

    const [
      users,
      mentors,
      jobs,
      events,
      posts,
      bookings,
      usersToday,
      jobsToday,
      bookingsToday,
      upcomingEvents,
    ] = await Promise.all([
      User.countDocuments({}),
      User.countDocuments({ role: "alumni", isActive: true }),
      Job.countDocuments({}),
      Event.countDocuments({}),
      Post.countDocuments({}),
      Booking.countDocuments({}),
      User.countDocuments({ joined: { $gte: startOfDay } }),
      Job.countDocuments({ postedAt: { $gte: startOfDay } }),
      Booking.countDocuments({ createdAt: { $gte: startOfDay } }),
      Event.countDocuments({ date: { $gte: new Date() } }),
    ]);

    res.json({
      success: true,
      users,
      mentors,
      jobs,
      events,
      posts,
      bookings,
      usersToday,
      jobsToday,
      bookingsToday,
      upcomingEvents,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/export", async (req, res) => {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);

    if (isDemoMode) {
      return res.json({
        success: true,
        demoMode: true,
        users: demoStore._state.users.map(({ passwordHash, ...u }) => u),
        jobs: demoStore._state.jobs,
        events: demoStore._state.events,
        posts: demoStore._state.posts,
        bookings: demoStore._state.bookings,
      });
    }

    const [users, jobs, events, posts, bookings] = await Promise.all([
      User.find({}).select("-password").lean(),
      Job.find({}).lean(),
      Event.find({}).lean(),
      Post.find({}).lean(),
      Booking.find({}).lean(),
    ]);

    res.json({ success: true, demoMode: false, users, jobs, events, posts, bookings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
