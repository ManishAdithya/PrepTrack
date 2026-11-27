import express from "express";
import { getAllUsers, setUserRole, resetUserPassword } from "../controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

// Admin-only routes
router.get("/all", authMiddleware, adminOnly, getAllUsers);
router.put("/:id/role", authMiddleware, adminOnly, setUserRole);
router.put("/:id/reset-password", authMiddleware, adminOnly, resetUserPassword);

export default router;
