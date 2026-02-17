const mongoose = require("mongoose");

const jobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  type: {
    type: String,
    enum: ["fulltime", "internship", "contract"],
    required: true,
  },
  salary: String,
  description: String,
  skills: [String],
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  applications: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  status: { type: String, enum: ["open", "closed"], default: "open" },
  postedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Job", jobSchema);
