import express from "express";
import {
  getDiscussions,
  getDiscussionById,
  createDiscussion,
  addComment,
  deleteDiscussion,
  deleteComment,
} from "../controllers/discussionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Logged-in users: list their batch's discussions
router.get("/", authMiddleware, getDiscussions);

// Logged-in users: one discussion from their batch
router.get("/:id", authMiddleware, getDiscussionById);

// Students: Create discussion
router.post("/", authMiddleware, createDiscussion);

// Students: Add comment
router.post("/:id/comment", authMiddleware, addComment);

// Author or CR: delete a thread, or one reply
router.delete("/:id", authMiddleware, deleteDiscussion);
router.delete("/:id/comments/:commentId", authMiddleware, deleteComment);

export default router;
