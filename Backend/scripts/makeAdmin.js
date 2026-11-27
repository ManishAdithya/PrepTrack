// One-time setup: make an existing account an admin.
// Usage (from the PrepTrack folder, after signing up normally):
//   npm --prefix Backend run make-admin -- you@college.edu
import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/User.js";

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm --prefix Backend run make-admin -- you@college.edu");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOneAndUpdate({ email }, { role: "admin" }, { new: true });
  if (!user) {
    console.error(`No account found for ${email}. Sign up on the website first, then run this again.`);
    process.exitCode = 1;
  } else {
    console.log(`✅ ${user.name} (${user.email}) is now an admin. Log out and back in to open the admin portal.`);
  }
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
