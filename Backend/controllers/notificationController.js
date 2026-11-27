import mongoose from "mongoose";
import Notification from "../models/Notification.js";
import { scopeOf } from "../config/community.js";

// A CR publishes an announcement. It reaches only the CR's own branch + batch,
// whatever audience label is chosen.
export const createNotification = async (req, res) => {
  try {
    const { message, audience, priority } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ message: "Announcement can't be empty" });
    }
    const note = await Notification.create({
      message,
      audience: audience || "All Users",
      priority: !!priority,
      createdBy: req.user.name,
      ...scopeOf(req.user),
    });
    res.status(201).json(note);
  } catch (err) {
    console.error("Create Notification Error:", err);
    res.status(500).json({ message: "Error creating announcement" });
  }
};

// Students and CRs get their own batch's announcements
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user.id;

    const notifications = await Notification.find(scopeOf(req.user)).sort({ createdAt: -1 });

    //"read" property for frontend use
    const formatted = notifications.map((n) => ({
      id: n._id,
      message: n.message,
      audience: n.audience,
      priority: n.priority,
      createdBy: n.createdBy,
      createdAt: n.createdAt,
      read: n.readBy.some((id) => String(id) === String(userId)),
    }));

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Get Notifications Error:", err);
    res.status(500).json({ message: "Error fetching notifications" });
  }
};

export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    if (!mongoose.isValidObjectId(id)) {
      return res.status(404).json({ message: "Notification not found" });
    }

    const note = await Notification.findOneAndUpdate(
      { _id: id, ...scopeOf(req.user) },
      { $addToSet: { readBy: userId } },
      { new: true }
    );

    if (!note) return res.status(404).json({ message: "Notification not found" });

    res.status(200).json({ message: "Notification marked as read" });
  } catch (err) {
    console.error("Mark Read Error:", err);
    res.status(500).json({ message: "Error marking as read" });
  }
};
