import Progress from "../models/Progress.js";
import Result from "../models/Result.js";
import { computeReadiness } from "../utils/readiness.js";
import { refreshReadiness } from "./resultController.js";

// POST /api/progress/update → recalculates readiness from the student's marks.
// (Readiness can't be typed in by hand any more — it always comes from logged results.)
export const updateProgress = async (req, res) => {
  try {
    const readiness = await refreshReadiness(req.user);
    const progress = await Progress.findOne({ userId: req.user.id });
    res.status(200).json({ message: "Readiness recalculated", progress, readiness });
  } catch (err) {
    console.error("Update Progress Error:", err);
    res.status(500).json({ message: "Error updating progress" });
  }
};

// GET /api/progress → Students fetch their own progress
export const getUserProgress = async (req, res) => {
  try {
    let progress = await Progress.findOne({ userId: req.user.id });

    // Auto-create a base record if not found
    if (!progress) {
      progress = await Progress.create({
        userId: req.user.id,
        branch: req.user.branch || "General",
        progressPercent: 0,
        confidence: "Medium",
      });
    }

    // Full breakdown: overall readiness, band, and each subject (weakest first) — see utils/readiness.js
    const results = await Result.find({ studentId: req.user.id }).lean();
    const readiness = computeReadiness(results, progress.prepSubjects);

    res.status(200).json({ ...progress.toObject(), readiness });
  } catch (err) {
    console.error("Get User Progress Error:", err);
    res.status(500).json({ message: "Error fetching progress" });
  }
};


// ===== Exam plan: subjects with an exam date and the student's own confidence =====
const CONF = ["High", "Medium", "Low"];

// The student's progress record, created if it doesn't exist yet
const myProgress = async (user) =>
  (await Progress.findOne({ userId: user.id })) ||
  Progress.create({ userId: user.id, branch: user.branch, progressPercent: 0, confidence: "Medium" });

// Send back the plan plus the recalculated readiness (confidence changes the over/under-confidence flags)
const sendPlan = async (res, user, progress, message, status = 200) => {
  const results = await Result.find({ studentId: user.id }).lean();
  res.status(status).json({ message, prepSubjects: progress.prepSubjects, readiness: computeReadiness(results, progress.prepSubjects) });
};

// Add a subject
export const addPrepSubject = async (req, res) => {
  try {
    const subject = String(req.body.subject || "").trim();
    const { examDate, confidence } = req.body;
    if (!subject) return res.status(400).json({ message: "Subject is required" });
    if (confidence && !CONF.includes(confidence)) return res.status(400).json({ message: "Confidence must be High, Medium or Low" });

    const progress = await myProgress(req.user);
    progress.prepSubjects.push({ subject, examDate: examDate || undefined, confidence: confidence || "Medium" });
    await progress.save();
    await sendPlan(res, req.user, progress, "Subject added", 201);
  } catch (err) {
    console.error("Add Prep Subject Error:", err);
    res.status(500).json({ message: "Error adding prep subject" });
  }
};

// Edit a subject's confidence or exam date
export const updatePrepSubject = async (req, res) => {
  try {
    const { confidence, examDate } = req.body;
    if (confidence && !CONF.includes(confidence)) return res.status(400).json({ message: "Confidence must be High, Medium or Low" });

    const progress = await myProgress(req.user);
    const sub = progress.prepSubjects.id(req.params.id);
    if (!sub) return res.status(404).json({ message: "Subject not found" });

    if (confidence) sub.confidence = confidence;
    if (examDate) sub.examDate = examDate;
    await progress.save();
    await sendPlan(res, req.user, progress, "Updated");
  } catch (err) {
    console.error("Update Prep Subject Error:", err);
    res.status(500).json({ message: "Error updating subject" });
  }
};

// Delete a subject
export const deletePrepSubject = async (req, res) => {
  try {
    const progress = await myProgress(req.user);
    progress.prepSubjects = progress.prepSubjects.filter((sub) => sub._id.toString() !== req.params.id);
    await progress.save();
    await sendPlan(res, req.user, progress, "Deleted");
  } catch (err) {
    console.error("Delete Prep Subject Error:", err);
    res.status(500).json({ message: "Error deleting subject" });
  }
};
