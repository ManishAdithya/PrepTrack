import express from "express";
import {
  upload,
  getBlobUploadToken,
  uploadMaterial,
  getAvailableMaterials,
  getAllMaterials,
  updateMaterialStatus,
  toggleUpvote,
  reportMaterial,
  deleteMaterial,
} from "../controllers/uploadController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { adminOnly } from "../middleware/roleMiddleware.js";

const router = express.Router();

router.post("/", authMiddleware, upload, uploadMaterial);
// Vercel Blob: one-time permission for the browser to upload a file directly
router.post("/blob-token", authMiddleware, getBlobUploadToken);
router.get("/", authMiddleware, getAvailableMaterials);

// Community moderation
router.post("/:id/upvote", authMiddleware, toggleUpvote);
router.post("/:id/report", authMiddleware, reportMaterial);

// Admin-only routes
router.get("/all", authMiddleware, adminOnly, getAllMaterials);
router.put("/:id/status", authMiddleware, adminOnly, updateMaterialStatus);
router.delete("/:id", authMiddleware, adminOnly, deleteMaterial);

export default router;
