import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "../models/User.js";
import { addSecurityLog } from "./securityLogController.js";
import { scopeOf, MAX_CRS_PER_BATCH } from "../config/community.js";
import { userInScope } from "../utils/scope.js";

// GET /api/users/all — a CR sees the students of their own branch + batch only
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find(scopeOf(req.user)).select("-password -failedLogins");
    res.status(200).json(users);
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// PUT /api/users/:id/role — a CR makes a classmate a CR, or steps one down.
// Only inside the CR's own batch, and at most MAX_CRS_PER_BATCH CRs per batch.
export const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be student or admin" });
    }
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't change your own role." });
    }

    // Students of other batches answer "not found"
    const user = await userInScope(req.params.id, req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === role) {
      const { password, ...same } = user.toObject(); // eslint-disable-line no-unused-vars
      return res.json(same);
    }

    const crs = await User.countDocuments({ ...scopeOf(user), role: "admin" });
    if (role === "admin" && crs >= MAX_CRS_PER_BATCH) {
      return res.status(400).json({
        message: `This batch already has ${MAX_CRS_PER_BATCH} CRs. Remove one before adding another.`,
      });
    }
    if (role === "student" && crs <= 1) {
      return res.status(400).json({ message: "Each batch needs at least one CR." });
    }

    user.role = role;
    await user.save();

    await addSecurityLog(
      req.user.id,
      "Admin Action",
      req.ip,
      `${role === "admin" ? "Made CR:" : "Removed CR role from"} ${user.email}`
    );

    const { password, ...safe } = user.toObject(); // eslint-disable-line no-unused-vars
    res.json(safe);
  } catch (err) {
    console.error("Set Role Error:", err);
    res.status(500).json({ message: "Error updating role" });
  }
};

// PUT /api/users/:id/reset-password — a CR resets a classmate's forgotten password.
// Returns a one-time temporary password (shown to the CR once); the student must change it at next login.
export const resetUserPassword = async (req, res) => {
  try {
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "Change your own password from your profile." });
    }
    const user = await userInScope(req.params.id, req.user);
    if (!user) return res.status(404).json({ message: "User not found" });

    // easy to read out loud: no 0/O or 1/l/I
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    const temp = Array.from(crypto.randomBytes(8), (b) => chars[b % chars.length]).join("");

    user.password = await bcrypt.hash(temp, 10);
    user.mustChangePassword = true;
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();

    await addSecurityLog(req.user.id, "Password Reset", req.ip, `CR reset the password of ${user.rollNumber}`);
    res.json({ message: "Password reset", tempPassword: temp, rollNumber: user.rollNumber, name: user.name });
  } catch (err) {
    console.error("Reset Password Error:", err);
    res.status(500).json({ message: "Error resetting password" });
  }
};
