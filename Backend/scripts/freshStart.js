// Wipe PrepTrack back to an empty site, keeping only the accounts you name.
// Everything else goes: other accounts, uploads, subjects, forum posts, exams,
// announcements, feedback, leaderboards and logs.
// Usage (from the PrepTrack folder):
//   npm --prefix Backend run fresh-start -- you@college.edu            (dry run: only shows what would go)
//   npm --prefix Backend run fresh-start -- you@college.edu --yes      (really delete)
// Files already uploaded to Vercel Blob are not touched; clear them from the Vercel dashboard (Storage → Blob).
import "../config/env.js";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const really = args.includes("--yes");
const keep = args.filter((a) => !a.startsWith("--")).map((a) => a.trim().toLowerCase());
if (!keep.length) {
  console.error("Name at least one account to keep: npm --prefix Backend run fresh-start -- you@college.edu [--yes]");
  process.exit(1);
}

try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  const users = db.collection("users");
  const kept = await users
    .find({ $or: [{ email: { $in: keep } }, { rollNumber: { $in: keep.map((k) => k.toUpperCase()) } }] })
    .project({ email: 1, name: 1 })
    .toArray();
  if (kept.length !== keep.length) {
    console.error(`Found ${kept.length} of ${keep.length} accounts to keep. Nothing deleted — check the spelling.`);
    process.exit(1);
  }
  const keptIds = kept.map((u) => u._id);

  const plan = [];
  for (const { name } of await db.listCollections().toArray()) {
    if (name.startsWith("system.")) continue;
    const coll = db.collection(name);
    const filter = name === "users" ? { _id: { $nin: keptIds } } : {};
    plan.push({ name, coll, filter, count: await coll.countDocuments(filter) });
  }

  console.log(`Keeping: ${kept.map((u) => `${u.name} <${u.email}>`).join(", ")}\n`);
  for (const p of plan) console.log(`  ${p.name.padEnd(16)} ${p.count} to delete`);

  if (!really) {
    console.log("\nDry run — nothing deleted. Add --yes to delete.");
  } else {
    for (const p of plan) if (p.count) await p.coll.deleteMany(p.filter);
    // the kept accounts start clean too
    await users.updateMany({ _id: { $in: keptIds } }, { $set: { failedLogins: 0, lockedUntil: null } });
    console.log("\n✅ Done. The site is empty except for the accounts above.");
  }
} catch (err) {
  console.error("Fresh start failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
