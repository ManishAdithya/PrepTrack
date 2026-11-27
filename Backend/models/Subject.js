import mongoose from "mongoose";

// A subject in one semester (S1–S6) of a class. Only CRs add, rename or remove subjects;
// students pick one when they upload notes, slides, PYQs or other resources.
export const SEMESTERS = [1, 2, 3, 4, 5, 6];

const subjectSchema = new mongoose.Schema(
  {
    branch: { type: String, required: true },
    batch: { type: Number, required: true },
    semester: { type: Number, enum: SEMESTERS, required: true },
    name: { type: String, required: true, trim: true },
    code: { type: String, default: "", trim: true }, // optional course code, e.g. 23EEE301
    createdBy: { type: String },
  },
  { timestamps: true }
);

subjectSchema.index({ branch: 1, batch: 1, semester: 1, name: 1 });

export default mongoose.model("Subject", subjectSchema);
