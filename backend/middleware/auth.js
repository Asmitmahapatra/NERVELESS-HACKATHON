const jwt = require("jsonwebtoken");
const User = require("../models/User");
const demoStore = require("../demoStore");

module.exports = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({ error: "No token, authorization denied" });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "alumlink_secret",
    );

    const isDemoMode = Boolean(req.app?.locals?.demoMode);
    const user = isDemoMode
      ? await demoStore.findUserById(decoded.userId)
      : await User.findById(decoded.userId).select("-password");

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    req.user = { userId: user._id, role: user.role };
    next();
  } catch (error) {
    res.status(401).json({ error: "Token is not valid" });
  }
};
