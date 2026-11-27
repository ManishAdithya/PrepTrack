import express from "express";
import {
  uploadResult,
  getUserResults,
} from "../controllers/resultController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student: fetch own results
router.get("/", authMiddleware, getUserResults);


// - If admin: can upload for any student (uses studentId from body)
// - If student: automatically uses req.user.id
router.post("/upload", authMiddleware, uploadResult);

export default router;
