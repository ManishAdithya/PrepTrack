import jwt from "jsonwebtoken";
import User from "../models/User.js";
import { batchFromRoll } from "../config/community.js";

// Verifies the token, then loads role/branch/batch from the database (not the token),
// so a removed CR loses access at once and every route can trust req.user's scope.
export const authMiddleware = async (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ message: "Access Denied" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid Token" });
  }

  try {
    const user = await User.findById(decoded.id).select("name role branch batch rollNumber");
    if (!user) return res.status(401).json({ message: "Account not found" });

    // Accounts created before batches existed get theirs from the roll number
    if (!user.batch) {
      user.batch = batchFromRoll(user.rollNumber);
      if (user.batch) await user.save();
    }
    if (!user.branch || !user.batch) {
      return res.status(403).json({ message: "Your roll number doesn't show a branch and batch. Contact your CR." });
    }

    req.user = {
      id: String(user._id),
      name: user.name,
      role: user.role,
      branch: user.branch,
      batch: user.batch,
    };
    next();
  } catch (err) {
    console.error("Auth Middleware Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};
