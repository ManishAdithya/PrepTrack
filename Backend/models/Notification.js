import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
  message: { type: String, required: true },
  audience: { type: String, default: "All Users" },
  // announcements reach only the publishing CR's branch + batch
  branch: { type: String },
  batch: { type: Number },
  priority: { type: Boolean, default: false },
  createdBy: { type: String },
  createdAt: { type: Date, default: Date.now },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }], 
});

export default mongoose.model("Notification", notificationSchema);
