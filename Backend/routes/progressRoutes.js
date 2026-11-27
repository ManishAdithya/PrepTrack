import express from "express";
import {
  updateProgress,
  getUserProgress,
  addPrepSubject,
  updatePrepSubject,
  deletePrepSubject
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

export default router;
