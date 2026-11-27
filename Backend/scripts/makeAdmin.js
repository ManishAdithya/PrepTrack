// One-time setup: make the first CR (admin) of a batch.
// After that, CRs appoint the other CR of their batch from Admin → Students.
// Usage (from the PrepTrack folder, after signing up normally):
//   npm --prefix Backend run make-admin -- you@college.edu
import "../config/env.js";
import mongoose from "mongoose";
import User from "../models/User.js";
import { batchFromRoll, MAX_CRS_PER_BATCH } from "../config/community.js";

const email = String(process.argv[2] || "").trim().toLowerCase();
if (!email) {
  console.error("Usage: npm --prefix Backend run make-admin -- you@college.edu");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const user = await User.findOne({ email });
  if (!user) {
    console.error(`No account found for ${email}. Sign up on the website first, then run this again.`);
    process.exitCode = 1;
  } else {
    if (!user.batch) user.batch = batchFromRoll(user.rollNumber);
    const label = `${user.branch} ${user.batch} batch`;
    const crs = await User.countDocuments({ branch: user.branch, batch: user.batch, role: "admin", _id: { $ne: user._id } });

    if (user.role === "admin") {
      console.log(`${user.name} (${user.email}) is already a CR of the ${label}.`);
    } else if (crs >= MAX_CRS_PER_BATCH) {
      console.error(`The ${label} already has ${MAX_CRS_PER_BATCH} CRs. One of them must step down first.`);
      process.exitCode = 1;
    } else {
      user.role = "admin";
      await user.save();
      console.log(`✅ ${user.name} (${user.email}) is now a CR of the ${label}. Log out and back in to open the admin portal.`);
    }
  }
} catch (err) {
  console.error("❌ Failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
