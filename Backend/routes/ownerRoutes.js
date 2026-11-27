import express from "express";
import { getOverview } from "../controllers/ownerController.js";
import { listFeedback, updateFeedback } from "../controllers/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { ownerOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Owner dashboard (platform-wide totals) — owner accounts only
router.get("/overview", authMiddleware, ownerOnly, getOverview);

// Feedback inbox: issues / improvements / comments sent from the app
router.get("/feedback", authMiddleware, ownerOnly, listFeedback);
router.put("/feedback/:id", authMiddleware, ownerOnly, updateFeedback);

export default router;
