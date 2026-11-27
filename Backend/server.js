import "./config/env.js"; // must stay first: loads .env.local / .env before other modules read them
import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import { LOCAL_STORAGE_DIR } from "./controllers/uploadController.js";

import authRoutes from "./routes/authRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import progressRoutes from "./routes/progressRoutes.js";
import branchRoutes from "./routes/branchRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import leaderboardRoutes from "./routes/leaderboardRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import discussionRoutes from "./routes/discussionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import securityLogRoutes from "./routes/securityLogRoutes.js";

connectDB();

const app = express();

// ✅ Fix: Apply CORS ONLY ONCE
app.use(cors({ origin: "http://localhost:3000", credentials: true }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/users", userRoutes);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/branch", branchRoutes);
app.use("/api/result", resultRoutes);
app.use("/api/leaderboard", leaderboardRoutes);
app.use("/api/notification", notificationRoutes);
app.use("/api/discussions", discussionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/security-logs", securityLogRoutes);

// Uploaded files, when stored locally instead of Firebase
app.use("/files", express.static(LOCAL_STORAGE_DIR));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
