import Result from "../models/Result.js";
import Progress from "../models/Progress.js";
import { userInScope } from "../utils/scope.js";
import { computeReadiness, storedSummary } from "../utils/readiness.js";

// Recalculate a student's readiness from all their results and save the summary
export async function refreshReadiness(user) {
  const [results, progress] = await Promise.all([
    Result.find({ studentId: user.id }).lean(),
    Progress.findOne({ userId: user.id }).lean(),
  ]);
  const readiness = computeReadiness(results, progress?.prepSubjects || []);
  await Progress.findOneAndUpdate(
    { userId: user.id },
    { $set: { ...storedSummary(readiness), branch: user.branch } },
    { upsert: true }
  );
  return readiness;
}

// POST /api/result/upload → Students upload exam results
export const uploadResult = async (req, res) => {
  try {
    const { examDate } = req.body;
    const subject = String(req.body.subject || "").trim();
    const marks = Number(req.body.marks);
    const totalMarks = Number(req.body.totalMarks);

    // 0 marks is a valid result, so check for numbers rather than truthiness
    if (!subject || !Number.isFinite(marks) || !Number.isFinite(totalMarks) || totalMarks <= 0) {
      return res.status(400).json({ message: "Subject, marks and total marks are required" });
    }
    if (marks < 0 || marks > totalMarks) {
      return res.status(400).json({ message: "Marks must be between 0 and the total marks" });
    }

    const percentage = Math.round((marks / totalMarks) * 100);

    // Always the logged-in student's own result
    const result = await Result.create({
      studentId: req.user.id,
      subject,
      marks,
      totalMarks,
      percentage,
      uploadedAt: examDate || new Date(),
    });

    // Recalculate readiness from ALL the student's results (see utils/readiness.js)
    const readiness = await refreshReadiness(req.user);

    res.status(201).json({
      message: "Result saved — readiness updated",
      result,
      readiness,
    });
  } catch (err) {
    console.error("Upload Result Error:", err);
    res.status(500).json({ message: "Error uploading result" });
  }
};

// GET /api/result/:studentId → Admin fetches results for a specific student
export const getResults = async (req, res) => {
  try {
    // A CR can only open results of a student in their own batch
    if (!(await userInScope(req.params.studentId, req.user))) {
      return res.status(404).json({ message: "Student not found" });
    }
    const results = await Result.find({ studentId: req.params.studentId }).sort({
      uploadedAt: 1,
    });
    res.json(results);
  } catch (err) {
    console.error("Get Results Error:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/result → Students fetch their own results
export const getUserResults = async (req, res) => {
  try {
    const results = await Result.find({ studentId: req.user.id }).sort({
      uploadedAt: 1,
    });
    res.status(200).json(results);
  } catch (err) {
    console.error("Get User Results Error:", err);
    res.status(500).json({ message: "Error fetching results" });
  }
};
