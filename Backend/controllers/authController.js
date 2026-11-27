import User from "../models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { addSecurityLog } from "./securityLogController.js";
import { getRules, branchFromRoll, batchFromRoll, rollAllowed } from "../config/community.js";
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

    // Only roll numbers of the classes PrepTrack is open to (see ALLOWED_ROLL_FORMATS)
    if (!rollAllowed(rollNumber)) {
      const example = rules.rollFormats[0]?.replace(/#/g, "0").replace(/0{3}$/, "001") || "";
      return res.status(403).json({
        message: `PrepTrack is currently open only to roll numbers like ${example}.`,
      });
    }

    // Branch and joining batch come from the roll number; students only ever see their own class
    const branch = branchFromRoll(rollNumber);
    const batch = batchFromRoll(rollNumber);

    // One account per email AND per roll number (students log in with their roll number)
    const roll = String(rollNumber).trim().toUpperCase();
    if (await User.findOne({ email })) {
      return res.status(400).json({ message: "An account with this email already exists." });
    }
    if (await User.findOne({ rollNumber: roll })) {
      return res.status(400).json({ message: "This roll number already has an account. Forgot your password? Ask your CR to reset it." });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Everyone joins as a student; admins are promoted by an existing admin
    const user = await User.create({
      name,
      email,
      rollNumber: roll,
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
const MAX_FAILED_LOGINS = 5;
const LOCK_MINUTES = 15;

export const login = async (req, res) => {
  try {
    // Students sign in with their roll number; an email still works (it contains "@")
    const id = String(req.body.rollNumber || req.body.identifier || req.body.email || "").trim();
    const password = String(req.body.password || "");
    if (!id || !password) {
      return res.status(400).json({ message: "Enter your roll number and password." });
    }
    const user = id.includes("@")
      ? await User.findOne({ email: id.toLowerCase() })
      : await User.findOne({ rollNumber: id.toUpperCase() });

    // Same message for "no such account" and "wrong password", so nobody can probe which roll numbers exist
    const WRONG = "Wrong roll number or password.";
    if (!user) {
      await addSecurityLog(null, "Login Failure", req.ip, `Unknown login: ${id}`);
      return res.status(400).json({ message: WRONG });
    }

    // Locked after too many wrong passwords (roll numbers are easy to guess, so passwords must not be)
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const mins = Math.ceil((user.lockedUntil - Date.now()) / 60000);
      return res.status(429).json({ message: `Too many wrong attempts. Try again in ${mins} min, or ask your CR to reset your password.` });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      user.failedLogins = (user.failedLogins || 0) + 1;
      if (user.failedLogins >= MAX_FAILED_LOGINS) {
        user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60000);
        user.failedLogins = 0;
        await addSecurityLog(user._id, "Account Lock", req.ip, `Locked for ${LOCK_MINUTES} min after ${MAX_FAILED_LOGINS} wrong passwords`);
      } else {
        await addSecurityLog(user._id, "Login Failure", req.ip, "Wrong password");
      }
      await user.save();
      return res.status(400).json({ message: WRONG });
    }
    if (user.failedLogins || user.lockedUntil) {
      user.failedLogins = 0;
      user.lockedUntil = null;
      await user.save();
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
      id: user._id,
      role: user.role,
      branch: user.branch,
      batch: user.batch || batchFromRoll(user.rollNumber),
      name: user.displayName || user.name, // what classmates see
      fullName: user.name,
      email: user.email,
      rollNumber: user.rollNumber,
      // set after a CR resets the password: the app asks for a new one right away
      mustChangePassword: !!user.mustChangePassword,
      isOwner: !!user.isOwner,
      displayName: user.displayName || "",
      needsDisplayName: !user.displayName,
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
    const user = await User.findById(req.user.id).select(PRIVATE_FIELDS);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Profile Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// Never sent to the browser
const PRIVATE_FIELDS = "-password -failedLogins -lockedUntil";

// =============================
// UPDATE USER PROFILE
// =============================
export const updateProfile = async (req, res) => {
  try {
    // Only personal fields; role, branch and roll number can't be self-edited
    const changes = {};
    if (req.body.displayName !== undefined) {
      const check = await checkDisplayName(req.body.displayName, req.user);
      if (check.error) return res.status(400).json({ message: check.error });
      changes.displayName = check.value;
    }
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
    // Leaderboard privacy
    if (req.body.hideFromLeaderboard !== undefined) changes.hideFromLeaderboard = !!req.body.hideFromLeaderboard;

    const updated = await User.findByIdAndUpdate(
      req.user.id,
      changes,
      { new: true, runValidators: true }
    ).select(PRIVATE_FIELDS);

    // SECURITY LOG — Profile update
    await addSecurityLog(req.user.id, "Admin Action", req.ip, "Profile updated");

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: "Error updating profile" });
  }
};

// =============================
// CHANGE PASSWORD
// Needs the current password — except right after a CR reset (mustChangePassword),
// when the student just signed in with the temporary one.
// =============================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters." });
    }
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.mustChangePassword && !(await bcrypt.compare(String(currentPassword || ""), user.password))) {
      return res.status(400).json({ message: "Current password is wrong." });
    }
    if (await bcrypt.compare(String(newPassword), user.password)) {
      return res.status(400).json({ message: "Choose a password different from the old one." });
    }

    user.password = await bcrypt.hash(String(newPassword), 10);
    user.mustChangePassword = false;
    await user.save();
    await addSecurityLog(user._id, "Password Reset", req.ip, "Password changed by the student");
    res.json({ message: "Password changed" });
  } catch (err) {
    console.error("Change Password Error:", err);
    res.status(500).json({ message: "Error changing password" });
  }
};

// =============================
// DISPLAY NAME (asked right after signup, changeable in Profile)
// 2–24 characters, unique within the class, so nobody can pose as a classmate.
// =============================
async function checkDisplayName(raw, user) {
  const value = String(raw || "").trim().replace(/\s+/g, " ");
  if (value.length < 2 || value.length > 24) return { error: "Display name must be 2–24 characters." };
  if (!/^[\p{L}\p{N} ._\-]+$/u.test(value)) return { error: "Use letters, numbers, spaces, dots, dashes or underscores." };
  if (/^(hidden classmate|removed student|admin|cr|owner)$/i.test(value)) return { error: "That name is reserved — pick another." };
  const esc = value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const taken = await User.findOne({
    _id: { $ne: user.id },
    branch: user.branch,
    batch: user.batch,
    displayName: { $regex: `^${esc}$`, $options: "i" },
  });
  if (taken) return { error: "Someone in your class already uses that name." };
  return { value };
}

// PUT /api/auth/display-name { displayName }
export const setDisplayName = async (req, res) => {
  try {
    const check = await checkDisplayName(req.body.displayName, req.user);
    if (check.error) return res.status(400).json({ message: check.error });
    const user = await User.findByIdAndUpdate(req.user.id, { displayName: check.value }, { new: true }).select(PRIVATE_FIELDS);
    res.json({ displayName: user.displayName });
  } catch (err) {
    console.error("Display Name Error:", err);
    res.status(500).json({ message: "Error saving display name" });
  }
};
