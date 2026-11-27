import express from "express";
import {
  updateProgress,
  getUserProgress,
  addPrepSubject,
  updatePrepSubject,
  deletePrepSubject,
  setSubjectConfidence,
} from "../controllers/progressController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";


const router = express.Router();

// Regular user: get own progress
router.get("/", authMiddleware, getUserProgress);

// Regular user: update own progress
router.post("/update", authMiddleware, updateProgress);


// Preperation routes
router.post("/prep/add", authMiddleware, addPrepSubject);
router.patch("/prep/update/:id", authMiddleware, updatePrepSubject);
router.delete("/prep/delete/:id", authMiddleware, deletePrepSubject);

// How confident the student feels about a subject (subjects come from the CR's exam schedule)
router.put("/confidence", authMiddleware, setSubjectConfidence);

export default router;
