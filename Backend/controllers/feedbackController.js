import mongoose from "mongoose";
import Feedback, { FEEDBACK_KINDS, FEEDBACK_STATUS } from "../models/Feedback.js";
import User from "../models/User.js";

const DAILY_LIMIT = 10;

// POST /api/feedback — any signed-in student or CR sends an issue / improvement / comment to the owner
export const sendFeedback = async (req, res) => {
  try {
    const message = String(req.body.message || "").trim();
    const kind = FEEDBACK_KINDS.includes(req.body.kind) ? req.body.kind : "Comment";
    if (message.length < 5) return res.status(400).json({ message: "Write a little more so it's clear what you mean." });
    if (message.length > 2000) return res.status(400).json({ message: "Please keep it under 2000 characters." });

    const today = await Feedback.countDocuments({ userId: req.user.id, createdAt: { $gte: new Date(Date.now() - 86400000) } });
    if (today >= DAILY_LIMIT) return res.status(429).json({ message: "You've sent a lot today — thanks! Try again tomorrow." });

    const user = await User.findById(req.user.id).select("name displayName rollNumber email role branch batch").lean();
    const fb = await Feedback.create({
      kind,
      message,
      userId: req.user.id,
      name: user?.name,
      displayName: user?.displayName,
      rollNumber: user?.rollNumber,
      email: user?.email,
      role: user?.role,
      branch: user?.branch,
      batch: user?.batch,
      page: String(req.body.page || "").slice(0, 200),
      userAgent: String(req.headers["user-agent"] || "").slice(0, 300),
    });
    res.status(201).json({ message: "Sent — thank you!", id: fb._id });
  } catch (err) {
    console.error("Send Feedback Error:", err);
    res.status(500).json({ message: "Couldn't send your feedback" });
  }
};

// GET /api/owner/feedback — owner only: everything sent, newest first (?status=new to filter)
export const listFeedback = async (req, res) => {
  try {
    const filter = FEEDBACK_STATUS.includes(req.query.status) ? { status: req.query.status } : {};
    const items = await Feedback.find(filter).sort({ createdAt: -1 }).limit(300).lean();
    res.json(items);
  } catch (err) {
    console.error("List Feedback Error:", err);
    res.status(500).json({ message: "Error loading feedback" });
  }
};

// PUT /api/owner/feedback/:id { status, ownerNote } — owner marks it seen / resolved, adds a private note
export const updateFeedback = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Not found" });
    const changes = {};
    if (req.body.status !== undefined) {
      if (!FEEDBACK_STATUS.includes(req.body.status)) return res.status(400).json({ message: "Unknown status" });
      changes.status = req.body.status;
    }
    if (req.body.ownerNote !== undefined) changes.ownerNote = String(req.body.ownerNote).slice(0, 1000);
    const fb = await Feedback.findByIdAndUpdate(req.params.id, changes, { new: true });
    if (!fb) return res.status(404).json({ message: "Not found" });
    res.json(fb);
  } catch (err) {
    console.error("Update Feedback Error:", err);
    res.status(500).json({ message: "Error updating feedback" });
  }
};
