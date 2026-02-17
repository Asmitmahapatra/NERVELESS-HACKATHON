const express = require("express");
const Event = require("../models/Event");
const auth = require("../middleware/auth");
const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
  try {
    const { type, location, page = 1, limit = 10 } = req.query;

    const filter = {};
    if (type) filter.type = type;
    if (location) filter.location = { $regex: location, $options: "i" };

    // Get upcoming events only
    const now = new Date();
    filter.date = { $gte: now };

    const events = await Event.find(filter)
      .populate("organizer", "name")
      .populate("rsvps", "name")
      .sort({ date: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Event.countDocuments(filter);

    res.json({
      events,
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

// Create event (alumni/admin only)
router.post("/", auth, async (req, res) => {
  try {
    if (!["alumni", "admin"].includes(req.user.role)) {
      return res
        .status(403)
        .json({ error: "Only alumni/admin can create events" });
    }

    const event = new Event({
      ...req.body,
      organizer: req.user.userId,
    });
    await event.save();

    const populatedEvent = await Event.findById(event._id).populate(
      "organizer",
      "name",
    );

    res.status(201).json(populatedEvent);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// RSVP to event
router.post("/:eventId/rsvp", auth, async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    if (!event || event.status === "completed") {
      return res.status(404).json({ error: "Event not found or completed" });
    }

    if (!event.rsvps.includes(req.user.userId)) {
      if (event.maxSpots && event.rsvps.length >= event.maxSpots) {
        return res.status(400).json({ error: "Event is full" });
      }
      event.rsvps.push(req.user.userId);
      await event.save();
    }

    const populatedEvent = await Event.findById(event._id).populate(
      "rsvps",
      "name",
    );

    res.json({
      success: true,
      message: "RSVP confirmed!",
      spotsLeft: event.maxSpots ? event.maxSpots - event.rsvps.length : null,
      event: populatedEvent,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get my events
router.get("/my-events", auth, async (req, res) => {
  try {
    const events = await Event.find({
      $or: [{ organizer: req.user.userId }, { rsvps: req.user.userId }],
    }).populate("organizer", "name");

    res.json(events);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
