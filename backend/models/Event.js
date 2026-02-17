const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  date: { type: Date, required: true },
  time: String,
  location: String,
  type: {
    type: String,
    enum: ["webinar", "workshop", "reunion", "ama"],
    required: true,
  },
  organizer: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  maxSpots: Number,
  rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isOnline: { type: Boolean, default: false },
  link: String,
  status: {
    type: String,
    enum: ["upcoming", "live", "completed"],
    default: "upcoming",
  },
});

module.exports = mongoose.model("Event", eventSchema);
