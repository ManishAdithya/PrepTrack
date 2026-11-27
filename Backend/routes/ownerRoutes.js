import express from "express";
import { getOverview } from "../controllers/ownerController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { ownerOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Owner dashboard (platform-wide totals) — owner accounts only
router.get("/overview", authMiddleware, ownerOnly, getOverview);

export default router;
