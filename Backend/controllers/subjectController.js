import mongoose from "mongoose";
import Subject, { SEMESTERS } from "../models/Subject.js";
import Material from "../models/Material.js";
import { scopeOf } from "../config/community.js";

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// GET /api/subjects — the class's subjects for S1–S6, with how many approved/pending uploads each has
export const getSubjects = async (req, res) => {
  try {
    const scope = scopeOf(req.user);
    const [subjects, counts] = await Promise.all([
      Subject.find(scope).sort({ semester: 1, name: 1 }).lean(),
      Material.aggregate([
        { $match: { ...scope, status: { $in: ["approved", "pending", "revision"] } } },
        { $group: { _id: "$subjectId", n: { $sum: 1 } } },
      ]),
    ]);
    const byId = new Map(counts.map((c) => [String(c._id), c.n]));
    res.json(subjects.map((s) => ({ ...s, uploads: byId.get(String(s._id)) || 0 })));
  } catch (err) {
    console.error("Get Subjects Error:", err);
    res.status(500).json({ message: "Error fetching subjects" });
  }
};

function readSubject(body) {
  const name = String(body.name || "").trim();
  const semester = Number(body.semester);
  if (!name) return { error: "Subject name is required." };
  if (name.length > 80) return { error: "Subject name is too long." };
  if (!SEMESTERS.includes(semester)) return { error: "Pick a semester from S1 to S6." };
  return { data: { name, semester, code: String(body.code || "").trim().slice(0, 20) } };
}

// POST /api/subjects — CR adds a subject to a semester
export const createSubject = async (req, res) => {
  try {
    const { data, error } = readSubject(req.body);
    if (error) return res.status(400).json({ message: error });
    const scope = scopeOf(req.user);
    const dup = await Subject.findOne({ ...scope, semester: data.semester, name: { $regex: `^${escapeRegex(data.name)}$`, $options: "i" } });
    if (dup) return res.status(409).json({ message: `S${data.semester} already has "${dup.name}".` });
    const subject = await Subject.create({ ...data, ...scope, createdBy: req.user.name });
    res.status(201).json({ ...subject.toObject(), uploads: 0 });
  } catch (err) {
    console.error("Create Subject Error:", err);
    res.status(500).json({ message: "Error adding subject" });
  }
};

// PUT /api/subjects/:id — CR renames a subject (uploads follow the new name)
export const updateSubject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Subject not found" });
    const subject = await Subject.findOne({ _id: req.params.id, ...scopeOf(req.user) });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const { data, error } = readSubject({ name: req.body.name ?? subject.name, semester: req.body.semester ?? subject.semester, code: req.body.code ?? subject.code });
    if (error) return res.status(400).json({ message: error });
    Object.assign(subject, data);
    await subject.save();
    await Material.updateMany({ subjectId: subject._id }, { $set: { subject: subject.name, semester: subject.semester } });
    res.json(subject);
  } catch (err) {
    console.error("Update Subject Error:", err);
    res.status(500).json({ message: "Error updating subject" });
  }
};

// DELETE /api/subjects/:id — CR removes a subject. If it has uploads, the CR must confirm (?force=1);
// the uploads then stay in the semester under "Unsorted" (they are not deleted).
export const deleteSubject = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: "Subject not found" });
    const subject = await Subject.findOne({ _id: req.params.id, ...scopeOf(req.user) });
    if (!subject) return res.status(404).json({ message: "Subject not found" });
    const uploads = await Material.countDocuments({ subjectId: subject._id });
    if (uploads && !req.query.force) {
      return res.status(409).json({ message: `${subject.name} has ${uploads} upload${uploads > 1 ? "s" : ""}.`, uploads });
    }
    await Material.updateMany({ subjectId: subject._id }, { $set: { subjectId: null } });
    await subject.deleteOne();
    res.json({ message: "Subject removed", movedUploads: uploads });
  } catch (err) {
    console.error("Delete Subject Error:", err);
    res.status(500).json({ message: "Error removing subject" });
  }
};
