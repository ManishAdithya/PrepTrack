import express from "express";
import { register, login, getProfile, updateProfile, getPublicRules, changePassword, setDisplayName } from "../controllers/authController.js";
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
router.put("/display-name", authMiddleware, setDisplayName);

export default router;
