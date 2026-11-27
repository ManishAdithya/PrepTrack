import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    branch: { type: String, required: true },
    batch: { type: Number, required: true }, // only this batch can see it

    // where it is filed: semester S1–S6 and a CR-made subject (name kept for display if the subject is removed)
    semester: { type: Number, min: 1, max: 6, default: null },
    subjectId: { type: mongoose.Schema.Types.ObjectId, ref: "Subject", default: null },
    subject: { type: String, default: "" },

    type: {
      type: String,
      enum: ["note", "ppt", "pyq", "other"],
      required: true
    },

    uploadedBy: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    releaseDate: { type: Date, required: true },
    fileUrl: { type: String, required: true },
    // true when fileUrl is a link the student pasted (Google Drive etc.), not a file we store
    isLink: { type: Boolean, default: false },

    // 🔥 REQUIRED for admin Content Management
    // "reported" = hidden from students after too many reports, waiting for a moderator
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "revision", "reported"],
      default: "pending",
    },

    // who approved it: "moderator", "community" (upvotes) or "trusted" (uploader's XP)
    approvedBy: { type: String, default: "" },

    reviewNotes: {
      type: String,
      default: "",
    },

    // community moderation
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    reports: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        reason: String,
        createdAt: { type: Date, default: Date.now },
      },
    ],

    // leaderboard points are given once, when the material is first approved
    pointsAwarded: { type: Boolean, default: false },

    uploadedAt: { type: Date, default: Date.now },
  },
  { timestamps: true } // 🔥 needed for createdAt / updatedAt
);

export default mongoose.model("Material", materialSchema);
