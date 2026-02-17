const express = require("express");
const Event = require("../models/Event");
const auth = require("../middleware/auth");
const demoStore = require("../demoStore");
const router = express.Router();

// Get all events
router.get("/", async (req, res) => {
  try {
    const { type, location, page = 1, limit = 10 } = req.query;

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const { items, pagination } = await demoStore.listEvents({
        type,
        location,
        page,
        limit,
      });
      return res.json({ events: items, pagination });
    }

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

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const event = {
        _id: require("crypto").randomUUID(),
        title: req.body.title,
        description: req.body.description || "",
        date: req.body.date ? new Date(req.body.date) : new Date(),
        time: req.body.time || "",
        location: req.body.location || "",
        type: req.body.type || "webinar",
        organizer: req.user.userId,
        attendees: [],
        maxSpots: req.body.maxSpots || null,
        rsvps: [],
        isOnline: Boolean(req.body.isOnline),
        link: req.body.link || "",
        status: "upcoming",
      };
      demoStore._state.events.push(event);
      return res.status(201).json(event);
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
async function rsvpHandler(req, res) {
  try {
    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    if (isDemoMode) {
      const result = await demoStore.rsvpEvent(req.params.eventId, req.user.userId);
      if (!result.ok) return res.status(404).json({ error: result.error });
      return res.json({
        success: true,
        message: "RSVP confirmed!",
        spotsLeft: result.spotsLeft,
        event: result.event,
      });
    }

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
}

// Frontend currently calls this without method (defaults to GET), so support both.
router.post("/:eventId/rsvp", auth, rsvpHandler);
router.get("/:eventId/rsvp", auth, rsvpHandler);

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
