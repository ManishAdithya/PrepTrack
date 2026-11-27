import express from "express";
import { sendFeedback } from "../controllers/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Students and CRs: send an issue, improvement idea or comment to the owner
router.post("/", authMiddleware, sendFeedback);

export default router;
