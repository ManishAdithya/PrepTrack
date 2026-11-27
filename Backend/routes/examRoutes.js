import express from "express";
import { getExams, createExam, updateExam, deleteExam } from "../controllers/examController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everyone in the class: the exam schedule
router.get("/", authMiddleware, getExams);

// CRs: manage the class's exams
router.post("/", authMiddleware, adminOnly, createExam);
router.put("/:id", authMiddleware, adminOnly, updateExam);
router.delete("/:id", authMiddleware, adminOnly, deleteExam);

export default router;
