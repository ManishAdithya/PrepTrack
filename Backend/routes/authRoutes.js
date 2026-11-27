import express from "express";
import { register, login, getProfile, updateProfile, getPublicRules, changePassword } from "../controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public routes
router.post("/register", register);
router.post("/login", login);
router.get("/rules", getPublicRules);
// Protected route (requires token)
router.get("/me", authMiddleware, getProfile);
router.put("/profile", authMiddleware, updateProfile);
router.put("/password", authMiddleware, changePassword);

export default router;
