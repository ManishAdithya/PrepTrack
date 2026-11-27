import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: String,
  // who wrote it (display names can change, so "your own comment" is decided by this)
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  text: String,
  // deleted by its author or a CR: the text is cleared and it shows as "Comment removed"
  removed: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  author: { type: String, required: true },
  authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  branch: { type: String },
  batch: { type: Number },
  tags: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },   // ⭐ ADDED
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Discussion", discussionSchema);
