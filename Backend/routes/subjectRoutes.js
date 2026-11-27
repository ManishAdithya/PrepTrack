import express from "express";
import { getSubjects, createSubject, updateSubject, deleteSubject } from "../controllers/subjectController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Everyone in the class: the S1–S7 subject list
router.get("/", authMiddleware, getSubjects);

// CRs: manage subjects
router.post("/", authMiddleware, adminOnly, createSubject);
router.put("/:id", authMiddleware, adminOnly, updateSubject);
router.delete("/:id", authMiddleware, adminOnly, deleteSubject);

export default router;
