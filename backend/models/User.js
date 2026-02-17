const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["student", "alumni", "admin"], required: true },
  skills: [String],
  industry: String,
  location: String,
  connections: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  profilePic: String,
  bio: String,
  joined: { type: Date, default: Date.now },
  achievements: [String],
  isActive: { type: Boolean, default: true },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (password) {
  return await bcrypt.compare(password, this.password);
};

module.exports = mongoose.model("User", userSchema);
