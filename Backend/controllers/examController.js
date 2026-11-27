import mongoose from "mongoose";
import Exam, { EXAM_TYPES } from "../models/Exam.js";
import Notification from "../models/Notification.js";
import { scopeOf } from "../config/community.js";

const fmt = (d) =>
  new Date(d).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" });

// Read and check the fields a CR sends; returns { data } or { error }
function readExam(body, partial = false) {
  const data = {};
  if (!partial || body.subject !== undefined) {
    const subject = String(body.subject || "").trim();
    if (!subject) return { error: "Subject is required." };
    if (subject.length > 80) return { error: "Subject is too long." };
    data.subject = subject;
  }
  if (!partial || body.type !== undefined) {
    data.type = EXAM_TYPES.includes(body.type) ? body.type : "Other";
  }
  if (!partial || body.date !== undefined) {
    const date = new Date(body.date);
    if (!body.date || Number.isNaN(date.getTime())) return { error: "Pick the exam date and time." };
    data.date = date;
  }
  for (const k of ["maxMarks", "durationMinutes"]) {
    if (body[k] === undefined) continue;
    if (body[k] === "" || body[k] === null) data[k] = null;
    else {
      const n = Number(body[k]);
      if (!Number.isFinite(n) || n <= 0 || n > 10000) return { error: `${k === "maxMarks" ? "Marks" : "Duration"} must be a positive number.` };
      data[k] = n;
    }
  }
  for (const k of ["venue", "details"]) {
    if (body[k] !== undefined) data[k] = String(body[k]).trim().slice(0, k === "details" ? 1000 : 100);
  }
  return { data };
}

// GET /api/exams — the class's exams. Students get upcoming ones (and today's);
// ?all=1 also includes past exams (used by the CR page).
export const getExams = async (req, res) => {
  try {
    const filter = { ...scopeOf(req.user) };
    if (!req.query.all) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);
      filter.date = { $gte: startOfToday };
    }
    const exams = await Exam.find(filter).sort({ date: 1 }).lean();
    res.json(exams);
  } catch (err) {
    console.error("Get Exams Error:", err);
    res.status(500).json({ message: "Error fetching exams" });
  }
};

// POST /api/exams — CR adds an exam; the class also gets an announcement
export const createExam = async (req, res) => {
  try {
    const { data, error } = readExam(req.body);
    if (error) return res.status(400).json({ message: error });

    const exam = await Exam.create({ ...data, ...scopeOf(req.user), createdBy: req.user.name, createdById: req.user.id });

    await Notification.create({
      message: `New exam: ${exam.subject} ${exam.type} on ${fmt(exam.date)}${exam.maxMarks ? ` (${exam.maxMarks} marks)` : ""}.`,
      audience: "Whole class",
      priority: false,
      createdBy: req.user.name,
      ...scopeOf(req.user),
    });

    res.status(201).json(exam);
  } catch (err) {
    console.error("Create Exam Error:", err);
    res.status(500).json({ message: "Error adding exam" });
  }
};

// PUT /api/exams/:id — CR edits an exam of their class
export const updateExam = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Exam not found" });
    const { data, error } = readExam(req.body, true);
    if (error) return res.status(400).json({ message: error });

    const before = await Exam.findOne({ _id: req.params.id, ...scopeOf(req.user) });
    if (!before) return res.status(404).json({ message: "Exam not found" });
    const oldDate = before.date.getTime();
    Object.assign(before, data);
    await before.save();

    // a changed date matters to everyone: tell the class
    if (data.date && data.date.getTime() !== oldDate) {
      await Notification.create({
        message: `Rescheduled: ${before.subject} ${before.type} is now on ${fmt(before.date)}.`,
        audience: "Whole class",
        priority: true,
        createdBy: req.user.name,
        ...scopeOf(req.user),
      });
    }
    res.json(before);
  } catch (err) {
    console.error("Update Exam Error:", err);
    res.status(500).json({ message: "Error updating exam" });
  }
};

// DELETE /api/exams/:id — CR removes an exam of their class
export const deleteExam = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Exam not found" });
    const exam = await Exam.findOneAndDelete({ _id: req.params.id, ...scopeOf(req.user) });
    if (!exam) return res.status(404).json({ message: "Exam not found" });
    res.json({ message: "Exam removed" });
  } catch (err) {
    console.error("Delete Exam Error:", err);
    res.status(500).json({ message: "Error removing exam" });
  }
};
