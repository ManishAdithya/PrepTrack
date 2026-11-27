import mongoose from "mongoose";
import Discussion from "../models/Discussion.js";
import { scopeOf } from "../config/community.js";

// A discussion inside the user's own branch + batch, or null.
// Other batches' discussions answer "not found" so their existence isn't revealed.
const findInScope = (id, user) =>
  mongoose.isValidObjectId(id) ? Discussion.findOne({ _id: id, ...scopeOf(user) }) : null;

// GET all discussions of the user's batch
export const getDiscussions = async (req, res) => {
  try {
    const discussions = await Discussion.find(scopeOf(req.user)).sort({ createdAt: -1 });
    res.status(200).json(discussions);
  } catch (err) {
    console.error("Get Discussions Error:", err);
    res.status(500).json({ message: "Error fetching discussions" });
  }
};

// GET single discussion
export const getDiscussionById = async (req, res) => {
  try {
    const discussion = await findInScope(req.params.id, req.user);
    if (!discussion) {
      return res.status(404).json({ message: "Discussion not found" });
    }
    res.status(200).json(discussion);
  } catch (err) {
    console.error("Get Discussion Error:", err);
    res.status(500).json({ message: "Error fetching discussion" });
  }
};

// CREATE discussion
export const createDiscussion = async (req, res) => {
  try {
    const { title, tags, body } = req.body;

    const discussion = await Discussion.create({
      title,
      body: body || "",
      tags: tags || [],
      author: req.user.name,
      authorId: req.user.id,
      ...scopeOf(req.user),
    });

    res.status(201).json(discussion);
  } catch (err) {
    console.error("Create Discussion Error:", err);
    res.status(500).json({ message: "Error creating discussion" });
  }
};

// ADD COMMENT
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    const updated = await Discussion.findOneAndUpdate(
      { _id: req.params.id, ...scopeOf(req.user) },
      {
        $push: {
          comments: {
            author: req.user.name,
            authorId: req.user.id,
            text,
          },
        },
        $inc: { commentsCount: 1 },
      },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "Discussion not found" });
    }

    res.status(200).json(updated);
  } catch (err) {
    console.error("Add Comment Error:", err);
    res.status(500).json({ message: "Error adding comment" });
  }
};

// May this user delete something written by authorId? Its author, or a CR of the class.
const canDelete = (authorId, user) => user.role === "admin" || (!!authorId && String(authorId) === String(user.id));

// DELETE a whole thread (with its replies): its author or a CR
export const deleteDiscussion = async (req, res) => {
  try {
    const discussion = await findInScope(req.params.id, req.user);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });
    if (!canDelete(discussion.authorId, req.user)) {
      return res.status(403).json({ message: "Only the person who posted this or a CR can delete it." });
    }
    await discussion.deleteOne();
    res.json({ message: "Discussion deleted" });
  } catch (err) {
    console.error("Delete Discussion Error:", err);
    res.status(500).json({ message: "Error deleting discussion" });
  }
};

// DELETE one reply: its author or a CR. It stays in place as "Comment removed" so the thread still reads in order.
export const deleteComment = async (req, res) => {
  try {
    const discussion = await findInScope(req.params.id, req.user);
    if (!discussion) return res.status(404).json({ message: "Discussion not found" });
    const comment = mongoose.isValidObjectId(req.params.commentId) ? discussion.comments.id(req.params.commentId) : null;
    if (!comment || comment.removed) return res.status(404).json({ message: "Comment not found" });
    if (!canDelete(comment.authorId, req.user)) {
      return res.status(403).json({ message: "Only the person who wrote this or a CR can delete it." });
    }
    comment.removed = true;
    comment.text = "";
    discussion.commentsCount = Math.max(0, (discussion.commentsCount || 0) - 1);
    await discussion.save();
    res.json(discussion);
  } catch (err) {
    console.error("Delete Comment Error:", err);
    res.status(500).json({ message: "Error deleting comment" });
  }
};
