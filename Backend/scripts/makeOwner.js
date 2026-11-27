// One-time setup: mark the account of the person running PrepTrack as owner.
// The owner sees the owner dashboard (platform-wide totals and trends); nobody else can open it.
// Usage (from the PrepTrack folder):
//   npm --prefix Backend run make-owner -- you@college.edu        (or a roll number)
//   npm --prefix Backend run make-owner -- you@college.edu --remove
import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const id = String(process.argv[2] || "").trim();
const remove = process.argv.includes("--remove");
if (!id) {
  console.error("Usage: npm --prefix Backend run make-owner -- you@college.edu  [--remove]");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = id.includes("@") ? await User.findOne({ email: id.toLowerCase() }) : await User.findOne({ rollNumber: id.toUpperCase() });
  if (!user) {
    console.error(`No account found for ${id}. Sign up on the website first, then run this again.`);
    process.exitCode = 1;
  } else {
    user.isOwner = !remove;
    await user.save();
    console.log(
      remove
        ? `✅ ${user.name} is no longer an owner.`
        : `✅ ${user.name} (${user.email}) is now the owner. Log out and back in, then open "Owner dashboard" from the account menu.`
    );
  }
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
