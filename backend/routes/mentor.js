const express = require("express");
const Booking = require("../models/Booking");
const User = require("../models/User");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");
const router = express.Router();

// Get available mentors
router.get("/mentors", async (req, res) => {
  try {
    const { skills, location } = req.query;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const mentors = await demoStore.listMentors({ skills, location });
      return res.json(mentors);
    }

    const filter = {
      role: "alumni",
      isActive: true,
    };

    if (skills) {
      filter.skills = { $in: skills.split(",") };
    }
    if (location) {
      filter.location = { $regex: location, $options: "i" };
    }

    const mentors = await User.find(filter)
      .select("name skills industry location profilePic")
      .lean();

    res.json(mentors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Book mentorship session
router.post("/book", auth, async (req, res) => {
  try {
    const { mentorId, date, time, topic } = req.body;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const mentor = await demoStore.findUserById(mentorId);
      if (!mentor || mentor.role !== "alumni") {
        return res.status(400).json({ error: "Invalid mentor" });
      }

      const booking = await demoStore.createBooking({
        studentId: req.user.userId,
        mentorId,
        date,
        time,
        topic,
      });

      return res.status(201).json({
        success: true,
        booking: {
          id: booking._id,
          ...booking,
        },
      });
    }

    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.role !== "alumni") {
      return res.status(400).json({ error: "Invalid mentor" });
    }

    const booking = new Booking({
      student: req.user.userId,
      mentor: mentorId,
      date: new Date(date),
      time,
      topic,
      status: "pending",
    });

    await booking.save();
    res.status(201).json({
      success: true,
      booking: {
        id: booking._id,
        ...booking.toObject(),
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my bookings
router.get("/bookings", auth, async (req, res) => {
  try {
    const { role } = req.user; // From middleware

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const bookings = await demoStore.listBookingsForUser({ userId: req.user.userId, role });
      return res.json(bookings);
    }

    if (role === "student") {
      // Student bookings
      const bookings = await Booking.find({ student: req.user.userId })
        .populate("mentor", "name skills")
        .sort({ date: 1 });
      res.json(bookings);
    } else {
      // Mentor bookings
      const bookings = await Booking.find({ mentor: req.user.userId })
        .populate("student", "name")
        .sort({ date: 1 });
      res.json(bookings);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update booking status (mentor/admin only)
router.put("/:bookingId/status", auth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.bookingId)
      .populate("mentor", "_id")
      .populate("student", "_id");

    if (
      req.user.userId.toString() !== booking.mentor._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    booking.status = status;
    await booking.save();

    res.json({ success: true, booking });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
