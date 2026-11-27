import User from "../models/User.js";
import { addSecurityLog } from "./securityLogController.js";

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.status(200).json(users);
  } catch (err) {
    console.error("Get All Users Error:", err);
    res.status(500).json({ message: "Error fetching users" });
  }
};

// PUT /api/users/:id/role — an admin promotes a student to admin, or steps someone down
export const setUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["student", "admin"].includes(role)) {
      return res.status(400).json({ message: "Role must be student or admin" });
    }
    if (String(req.params.id) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't change your own role." });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (user.role === "admin" && role === "student") {
      const admins = await User.countDocuments({ role: "admin" });
      if (admins <= 1) return res.status(400).json({ message: "There must be at least one admin." });
    }

    user.role = role;
    await user.save();

    await addSecurityLog(
      req.user.id,
      "Admin Action",
      req.ip,
      `${role === "admin" ? "Promoted" : "Removed admin role from"} ${user.email}`
    );

    const { password, ...safe } = user.toObject(); // eslint-disable-line no-unused-vars
    res.json(safe);
  } catch (err) {
    console.error("Set Role Error:", err);
    res.status(500).json({ message: "Error updating role" });
  }
};
