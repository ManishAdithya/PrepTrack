import mongoose from "mongoose";

// An exam posted by a CR for their class. Students see it as a countdown and in the upcoming list.
export const EXAM_TYPES = ["Quiz", "Mid-term", "End-semester", "Lab exam", "Assignment", "Other"];

const examSchema = new mongoose.Schema(
  {
    // which class it belongs to (the CR's own branch + batch)
    branch: { type: String, required: true },
    batch: { type: Number, required: true },

    subject: { type: String, required: true, trim: true },
    type: { type: String, enum: EXAM_TYPES, default: "Quiz" },
    date: { type: Date, required: true }, // date and start time
    durationMinutes: { type: Number, default: null },
    maxMarks: { type: Number, default: null },
    venue: { type: String, default: "", trim: true },
    details: { type: String, default: "", trim: true }, // syllabus / portions / instructions

    createdBy: { type: String }, // CR's name
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

examSchema.index({ branch: 1, batch: 1, date: 1 });

export default mongoose.model("Exam", examSchema);
