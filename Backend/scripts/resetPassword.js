// Give an account a one-time temporary password, for when nobody (no CR) can reset it from the website.
// The temporary password is printed only in your terminal; the account must choose a new one at its next sign-in.
// Usage (from the PrepTrack folder):
//   npm --prefix Backend run reset-password -- you@college.edu        (or a roll number)
import "../config/env.js";
import crypto from "crypto";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User from "../models/User.js";

const id = String(process.argv[2] || "").trim();
if (!id) {
  console.error("Usage: npm --prefix Backend run reset-password -- you@college.edu");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = id.includes("@") ? await User.findOne({ email: id.toLowerCase() }) : await User.findOne({ rollNumber: id.toUpperCase() });
  if (!user) {
    console.error(`No account found for ${id}.`);
    process.exitCode = 1;
  } else {
    // easy to read: no 0/O or 1/l/I
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    const temp = Array.from(crypto.randomBytes(10), (b) => chars[b % chars.length]).join("");
    user.password = await bcrypt.hash(temp, 10);
    user.mustChangePassword = true;
    user.failedLogins = 0;
    user.lockedUntil = null;
    await user.save();
    console.log(`\n✅ Temporary password for ${user.email}:\n\n    ${temp}\n\nSign in with it, then choose your own password straight away.`);
  }
} catch (err) {
  console.error("Reset failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
