import User from "../models/User.js";

// Checks the database, not just the token, so removing someone's admin role takes effect immediately
export const adminOnly = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select("role");
    if (user?.role !== "admin") {
      return res.status(403).json({ message: "Access forbidden: Admins only" });
    }
    next();
  } catch (err) {
    console.error("Admin check error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
