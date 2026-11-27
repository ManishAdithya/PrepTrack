import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  author: String,
  text: String,
  createdAt: { type: Date, default: Date.now }
});

const discussionSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String },
  author: { type: String, required: true },
  branch: { type: String },
  batch: { type: Number },
  tags: { type: [String], default: [] },
  comments: { type: [commentSchema], default: [] },   // ⭐ ADDED
  commentsCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Discussion", discussionSchema);
