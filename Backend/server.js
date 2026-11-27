import "./config/env.js"; // must stay first: loads .env.local / .env before other modules read them
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { LOCAL_STORAGE_DIR } from "./controllers/uploadController.js";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import ownerRoutes from "./routes/ownerRoutes.js";

const app = express();

// CORS: allow the frontend on any local port (Vite moves to 3001, 3002... if 3000 is busy),
// plus FRONTEND_URL from .env for a deployed frontend.
const isAllowedOrigin = (origin) =>
  !origin ||
  /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
  origin === process.env.FRONTEND_URL;

app.use(cors({ origin: (origin, cb) => cb(null, isAllowedOrigin(origin)), credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Quick check that the API is up (doesn't touch the database)
app.get("/api/health", (req, res) => res.json({ ok: true }));

// Make sure the database is connected before any route runs (needed on Vercel,
// where the function can start cold for a request)
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch {
    res.status(503).json({ message: "Database unavailable, please try again in a moment." });
  }
});

app.use("/api/users", userRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/owner", ownerRoutes);

// Uploaded files, when stored on this computer (local development without Vercel Blob)
app.use("/files", express.static(LOCAL_STORAGE_DIR));

// On Vercel this file is the "api" service's entrypoint (see vercel.json at the repo root):
// Vercel runs the exported app as a function and keeps the /api/... paths unchanged.
// Everywhere else it runs as a normal server.
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  connectDB().catch(() => process.exit(1));
}

export default app;
