import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { addSecurityLog } from "./securityLogController.js";
import { getRules, branchFromRoll, batchFromRoll } from "../config/community.js";
import { BLOB_FLOW } from "./uploadController.js";

// =============================
// PUBLIC COMMUNITY RULES (shown on the signup and upload screens)
// =============================
export const getPublicRules = (req, res) => {
  // `uploads` tells the frontend how to send files: straight to Vercel Blob, or to this server.
  // `blobFlow` says which Blob upload method the connected store uses.
  const blobFlow = BLOB_FLOW();
  res.json({ ...getRules(), uploads: blobFlow ? "blob" : "local", blobFlow });
};

// =============================
// REGISTER USER
// =============================
export const register = async (req, res) => {
  try {
    const { name, rollNumber, password } = req.body;
    const email = String(req.body.email || "").trim().toLowerCase();
    const rules = getRules();

    if (!name || !email || !rollNumber || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Only college email addresses
    if (rules.emailDomain && !email.endsWith(`@${rules.emailDomain}`)) {
      return res.status(403).json({ message: `Please use your college email (@${rules.emailDomain}).` });
    }

    // Branch comes from the roll number, so nobody can join another branch
    const branch = branchFromRoll(rollNumber);
    if (!branch) {
      return res.status(400).json({ message: "That roll number doesn't look right (e.g. AM.SC.U4CSE23140)." });
    }
    if (!rules.branches.includes(branch)) {
      return res.status(403).json({ message: `PrepTrack is currently open to ${rules.branches.join(", ")} students only.` });
    }

    // Joining batch from the roll number; students only ever see their own batch
    const batch = batchFromRoll(rollNumber);
    if (!batch) {
      return res.status(400).json({ message: "That roll number doesn't look right (e.g. AM.SC.U4CSE23140)." });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Everyone joins as a student; admins are promoted by an existing admin
    const user = await User.create({
      name,
      email,
      rollNumber: String(rollNumber).trim().toUpperCase(),
      branch,
      batch,
      role: "student",
      password: hashed,
    });

    //SECURITY LOG — Registration
    await addSecurityLog(
      user._id,
      "Admin Action",
      req.ip,
      `New account registered (${user.email})`
    );

    res.status(201).json({
      message: "User registered successfully",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        branch: user.branch,
        batch: user.batch,
        rollNumber: user.rollNumber,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Register Error:", err);
    res.status(400).json({ message: err.message });
  }
};

// =============================
// LOGIN USER
// =============================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      // SECURITY LOG — Login failure: email not found
      await addSecurityLog(null, "Login Failure", req.ip, `Email not found: ${email}`);
      return res.status(400).json({ message: "User not found" });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      // SECURITY LOG — Wrong password
      await addSecurityLog(user._id, "Login Failure", req.ip, "Wrong password");
      return res.status(400).json({ message: "Invalid password" });
    }

    // SECURITY LOG — Successful login
    await addSecurityLog(user._id, "Login Success", req.ip, "User logged in");

    const token = jwt.sign(
      {
        id: user._id,
        role: user.role,
        branch: user.branch,
        batch: user.batch || batchFromRoll(user.rollNumber),
        name: user.name,
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      token,
      role: user.role,
      branch: user.branch,
      batch: user.batch || batchFromRoll(user.rollNumber),
      name: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// GET CURRENT USER PROFILE
// =============================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// =============================
// UPDATE USER PROFILE
// =============================
export const updateProfile = async (req, res) => {
  try {
    // Only personal fields; role, branch and roll number can't be self-edited
    const changes = {};
    ["name", "phone", "year"].forEach((k) => {
      if (req.body[k] !== undefined) changes[k] = req.body[k];
    });
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      const { emailDomain } = getRules();
      if (emailDomain && !email.endsWith(`@${emailDomain}`)) {
        return res.status(400).json({ message: `Email must end with @${emailDomain}` });
      }
      changes.email = email;
    }

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      changes,
      { new: true, runValidators: true }
    ).select("-password");

    // SECURITY LOG — Profile update
    await addSecurityLog(req.user.id, "Admin Action", req.ip, "Profile updated");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};
