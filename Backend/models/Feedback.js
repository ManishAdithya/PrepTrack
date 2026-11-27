import mongoose from "mongoose";

// Issues, improvement ideas and comments about PrepTrack, sent by students and CRs
// straight to the owner (only the owner dashboard can read them).
export const FEEDBACK_KINDS = ["Issue", "Improvement", "Comment"];
export const FEEDBACK_STATUS = ["new", "seen", "resolved"];

const feedbackSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: FEEDBACK_KINDS, default: "Comment" },
    message: { type: String, required: true, trim: true },

    // who sent it (copied at the time, so it survives renames or removed accounts)
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    displayName: String,
    rollNumber: String,
    email: String,
    role: String,
    branch: String,
    batch: Number,

    // where they were and on what device
    page: { type: String, default: "" },
    userAgent: { type: String, default: "" },

    status: { type: String, enum: FEEDBACK_STATUS, default: "new" },
    ownerNote: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model("Feedback", feedbackSchema);
