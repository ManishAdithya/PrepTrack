import mongoose from "mongoose";

const materialSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    branch: { type: String, required: true },

    type: {
      type: String,
      enum: ["note", "ppt", "pyq"],
      required: true
    },

    uploadedBy: { type: String, required: true },
    uploaderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    releaseDate: { type: Date, required: true },
    fileUrl: { type: String, required: true },

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
