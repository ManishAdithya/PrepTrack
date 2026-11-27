import multer from "multer";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import bucket from "../config/firebase.js";
import { v4 as uuidv4 } from "uuid";
import Material from "../models/Material.js";
import mongoose from "mongoose";
import { getRules, scopeOf } from "../config/community.js";
import { awardApprovalPoints, getScore } from "../utils/points.js";
import { head } from "@vercel/blob";
import { handleUpload } from "@vercel/blob/client";

// Vercel Blob is used when its token is set (on Vercel, after connecting a Blob store).
// The browser then uploads files straight to Blob, so large PDFs aren't limited by Vercel's request size.
export const BLOB_ENABLED = () => !!process.env.BLOB_READ_WRITE_TOKEN;
const MAX_UPLOAD_MB = 50;
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/*",
  "text/plain",
];
// Files of each batch go in their own folder: materials/<batch>/<file>
const blobFolder = (user) => `materials/${user.branch}-${user.batch}/`;

// ===============================
// VERCEL BLOB: give the logged-in browser a one-time permission to upload one file
// ===============================
export const getBlobUploadToken = async (req, res) => {
  if (!BLOB_ENABLED()) return res.status(503).json({ message: "File storage isn't set up yet." });
  try {
    const result = await handleUpload({
      body: req.body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        if (!pathname.startsWith(blobFolder(req.user))) throw new Error("Invalid upload path");
        return {
          allowedContentTypes: ALLOWED_TYPES,
          maximumSizeInBytes: MAX_UPLOAD_MB * 1024 * 1024,
          addRandomSuffix: true,
        };
      },
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// A blob URL is accepted only if it's in this batch's folder of OUR Blob store
async function verifyBlobUrl(fileUrl, user) {
  let url;
  try {
    url = new URL(fileUrl);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" || !url.hostname.endsWith(".public.blob.vercel-storage.com")) return false;
  if (!decodeURIComponent(url.pathname).startsWith("/" + blobFolder(user))) return false;
  try {
    await head(fileUrl); // fails unless the file exists in the store our token belongs to
    return true;
  } catch {
    return false;
  }
}

// A material inside the user's own branch + batch, or null (other batches' uploads answer "not found")
const findInScope = (id, user) =>
  mongoose.isValidObjectId(id) ? Material.findOne({ _id: id, ...scopeOf(user) }) : null;

// Where uploads go when Firebase isn't configured (Backend/storage)
export const LOCAL_STORAGE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "storage");

// Multer storage in memory
const storage = multer.memoryStorage();
export const upload = multer({ storage }).single("file");

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// Shape a material for students: counts instead of raw voter lists
const forStudent = (m, userId) => {
  const { upvotes = [], reports = [], ...rest } = m;
  return {
    ...rest,
    upvoteCount: upvotes.length,
    upvoted: upvotes.some((id) => String(id) === String(userId)),
    reported: reports.some((r) => String(r.userId) === String(userId)),
  };
};

// ===============================
// UPLOAD MATERIAL
// ===============================
export const uploadMaterial = async (req, res) => {
  try {
    const { title, type, examDate } = req.body;
    // Always the uploader's own branch + batch (never taken from the request)
    const { branch, batch } = scopeOf(req.user);

    // The file arrives either as multipart (local development) or as a Vercel Blob URL
    // that the browser already uploaded to
    const blobUrl = !req.file && BLOB_ENABLED() ? req.body.fileUrl : null;
    if (!req.file && !blobUrl) {
      return res.status(400).json({ message: "No file uploaded" });
    }
    if (blobUrl && !(await verifyBlobUrl(blobUrl, req.user))) {
      return res.status(400).json({ message: "That file upload couldn't be verified. Please upload it again." });
    }
    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Please give the material a title." });
    }

    // block exact duplicates (same title in the same branch + batch)
    const duplicate = await Material.findOne({
      branch,
      batch,
      title: { $regex: `^${escapeRegex(title.trim())}$`, $options: "i" },
      status: { $ne: "rejected" },
    });
    if (duplicate) {
      return res.status(409).json({ message: "A material with this title already exists." });
    }

    const filename = req.file ? `${Date.now()}-${req.file.originalname.replace(/[^\w.-]+/g, "_")}` : null;
    let fileUrl;

    if (blobUrl) {
      fileUrl = blobUrl;
    } else if (process.env.VERCEL) {
      // Vercel has no permanent disk, so local storage isn't an option there
      return res.status(503).json({ message: "File storage isn't set up yet." });
    } else if (bucket) {
      const file = bucket.file(filename);
      await file.save(req.file.buffer, {
        metadata: {
          contentType: req.file.mimetype,
          metadata: { firebaseStorageDownloadTokens: uuidv4() },
        },
        public: true,
      });
      fileUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;
    } else {
      // No Firebase configured: keep the file on this computer, served by server.js at /files
      await fs.mkdir(LOCAL_STORAGE_DIR, { recursive: true });
      await fs.writeFile(path.join(LOCAL_STORAGE_DIR, filename), req.file.buffer);
      fileUrl = `${process.env.BACKEND_URL || "http://localhost:5000"}/files/${filename}`;
    }

    // auto release logic
    let releaseDate = new Date();
    if (examDate) {
      const exam = new Date(examDate);
      if (type === "note" || type === "ppt") {
        releaseDate = new Date(exam.getTime() - 7 * 24 * 60 * 60 * 1000);
      } else if (type === "pyq") {
        releaseDate = new Date(exam.getTime() - 2 * 24 * 60 * 60 * 1000);
      }
    }

    // trusted uploaders (enough XP) skip the review queue
    const trusted = (await getScore(req.user.id)) >= getRules().trustedXp;

    const material = new Material({
      title: title.trim(),
      branch,
      batch,
      type,
      uploadedBy: req.user.name,
      uploaderId: req.user.id,
      releaseDate,
      fileUrl,
      status: trusted ? "approved" : "pending",
      approvedBy: trusted ? "trusted" : "",
    });

    // points only count once the material is approved
    if (trusted) await awardApprovalPoints(material);
    await material.save();

    res.status(201).json({
      message: trusted ? "Uploaded and published!" : "Uploaded! It goes live once approved.",
      autoApproved: trusted,
      material: forStudent(material.toObject(), req.user.id),
    });

  } catch (err) {
    console.error("Upload Error:", err);
    res.status(500).json({ message: "Error uploading material", error: err.message });
  }
};

// ===============================
// STUDENT: GET AVAILABLE MATERIALS
// ===============================
export const getAvailableMaterials = async (req, res) => {
  try {
    const materials = await Material.find({
      ...scopeOf(req.user),

      // Students can see ONLY: pending, approved, revision (not rejected or reported)
      status: { $in: ["approved", "pending", "revision"] },

      releaseDate: { $lte: Date.now() },
    })
      .sort({ releaseDate: -1 })
      .lean();

    res.status(200).json(materials.map((m) => forStudent(m, req.user.id)));
  } catch (err) {
    console.error("Fetch Materials Error:", err);
    res.status(500).json({ message: "Error fetching materials" });
  }
};

// ===============================
// STUDENT: TOGGLE UPVOTE
// ===============================
export const toggleUpvote = async (req, res) => {
  try {
    const material = await findInScope(req.params.id, req.user);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (String(material.uploaderId) === String(req.user.id)) {
      return res.status(400).json({ message: "You can't upvote your own upload." });
    }

    const already = material.upvotes.some((id) => String(id) === String(req.user.id));
    if (already) material.upvotes.pull(req.user.id);
    else material.upvotes.push(req.user.id);

    // enough classmates vouched for it -> it goes live
    let communityApproved = false;
    if (material.status === "pending" && material.upvotes.length >= getRules().approveUpvotes) {
      material.status = "approved";
      material.approvedBy = "community";
      await awardApprovalPoints(material);
      communityApproved = true;
    }

    await material.save();
    res.json({
      upvoted: !already,
      upvoteCount: material.upvotes.length,
      status: material.status,
      communityApproved,
    });
  } catch (err) {
    console.error("Upvote Error:", err);
    res.status(500).json({ message: "Error updating upvote" });
  }
};

// ===============================
// STUDENT: REPORT MATERIAL
// ===============================
export const reportMaterial = async (req, res) => {
  try {
    const reason = String(req.body.reason || "").trim();
    if (!reason) return res.status(400).json({ message: "Please give a reason." });

    const material = await findInScope(req.params.id, req.user);
    if (!material) return res.status(404).json({ message: "Material not found" });

    if (material.reports.some((r) => String(r.userId) === String(req.user.id))) {
      return res.status(400).json({ message: "You already reported this." });
    }

    material.reports.push({ userId: req.user.id, reason });

    // too many reports -> hide it until a moderator looks at it
    if (material.reports.length >= getRules().hideReports && material.status !== "rejected") {
      material.status = "reported";
    }

    await material.save();
    res.json({ reported: true, status: material.status });
  } catch (err) {
    console.error("Report Error:", err);
    res.status(500).json({ message: "Error reporting material" });
  }
};

// ===============================
// ADMIN: GET ALL MATERIALS
// ===============================
export const getAllMaterials = async (req, res) => {
  try {
    // A CR reviews only their own batch's uploads
    const materials = await Material.find(scopeOf(req.user)).sort({ createdAt: -1 }).lean();
    res.status(200).json(
      materials.map(({ upvotes = [], ...m }) => ({ ...m, upvoteCount: upvotes.length }))
    );
  } catch (err) {
    console.error("Get All Materials Error:", err);
    res.status(500).json({ message: "Error fetching all materials" });
  }
};

// ===============================
// ADMIN: UPDATE MATERIAL STATUS
// ===============================
export const updateMaterialStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes } = req.body;

    const allowed = ["pending", "approved", "rejected", "revision", "reported"];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const material = await findInScope(id, req.user);
    if (!material)
      return res.status(404).json({ message: "Material not found" });

    material.status = status;
    material.reviewNotes = reviewNotes;

    if (status === "approved") {
      material.approvedBy = "moderator";
      material.reports = []; // a moderator cleared it
      await awardApprovalPoints(material);
    }

    await material.save();
    res.status(200).json(material);
  } catch (err) {
    console.error("Update Material Status Error:", err);
    res.status(500).json({ message: "Error updating material status" });
  }
};
