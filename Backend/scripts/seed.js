// Fills the database with realistic demo data for presentations.
//   npm --prefix Backend run seed         -> (re)create the demo data
//   npm --prefix Backend run seed:clear   -> remove everything this script added
// Everything inserted is tagged `seed: true`, so your real accounts and data are never touched,
// except that real students get sample results / exam plans if they have none yet.
import "../config/env.js";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Password for every demo classmate account (log in as any of them with this)
const DEMO_PASSWORD = "Demo@1234";

const { ObjectId } = mongoose.Types;
const STORAGE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "storage");
const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const DAY = 86400000;
const at = (days, hours = 0) => new Date(Date.now() + days * DAY + hours * 3600000);
const pick = (arr, n) => arr.slice(0, n);

const CLASSMATES = [
  ["Ananya Iyer", 420, 30, 91, "High"],
  ["Rohan Mehta", 365, 27, 86, "High"],
  ["Priya Nair", 310, 23, 82, "High"],
  ["Karthik Raj", 255, 19, 74, "Medium"],
  ["Sneha Reddy", 198, 15, 69, "Medium"],
  ["Arjun Menon", 160, 12, 63, "Medium"],
  ["Diya Patel", 120, 9, 58, "Low"],
  ["Vikram Singh", 85, 7, 52, "Low"],
  ["Meera Krishnan", 45, 4, 47, "Low"],
  ["Aditya Kumar", 20, 2, 39, "Low"],
];

const SUBJECTS = ["Data Structures", "Operating Systems", "DBMS", "Computer Networks", "Theory of Computation", "Software Engineering"];

// Minimal one-page PDF so "Open" shows a real file
function makePdf(title, lines) {
  const esc = (s) => s.replace(/[()\\]/g, "\\$&");
  const text = [`BT /F1 22 Tf 72 740 Td (${esc(title)}) Tj ET`, ...lines.map((l, i) => `BT /F1 13 Tf 72 ${700 - i * 22} Td (${esc(l)}) Tj ET`)].join("\n");
  const objs = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
    `<< /Length ${Buffer.byteLength(text)} >>\nstream\n${text}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  ];
  let out = "%PDF-1.4\n";
  const offsets = [];
  objs.forEach((o, i) => {
    offsets.push(Buffer.byteLength(out));
    out += `${i + 1} 0 obj\n${o}\nendobj\n`;
  });
  const xref = Buffer.byteLength(out);
  out += `xref\n0 ${objs.length + 1}\n0000000000 65535 f \n${offsets.map((o) => String(o).padStart(10, "0") + " 00000 n \n").join("")}`;
  out += `trailer\n<< /Size ${objs.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return Buffer.from(out);
}

async function clear(db) {
  const names = ["users", "materials", "progresses", "results", "leaderboards", "notifications", "discussions", "branches", "securitylogs"];
  for (const n of names) {
    const { deletedCount } = await db.collection(n).deleteMany({ seed: true });
    if (deletedCount) console.log(`  removed ${deletedCount} from ${n}`);
  }
  // undo sample exam plans given to real students
  const { modifiedCount } = await db.collection("progresses").updateMany(
    { seedPrep: true },
    { $set: { prepSubjects: [], progressPercent: 0, confidence: "Medium" }, $unset: { seedPrep: "" } }
  );
  if (modifiedCount) console.log(`  reset ${modifiedCount} real student progress record(s)`);
  for (const f of fs.existsSync(STORAGE) ? fs.readdirSync(STORAGE) : []) if (f.startsWith("seed-")) fs.unlinkSync(path.join(STORAGE, f));
}

async function seed(db) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const admin = await db.collection("users").findOne({ role: "admin", seed: { $ne: true } });
  const adminName = admin?.name || "PrepTrack Team";

  // ---------- classmates ----------
  const users = CLASSMATES.map(([name], i) => ({
    _id: new ObjectId(),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}@demo.preptrack.edu`,
    rollNumber: `AM.SC.U4CSE23${String(101 + i).padStart(3, "0")}`,
    branch: "CSE",
    role: "student",
    password: hash,
    year: "3rd Year",
    seed: true,
    __v: 0,
  }));
  await db.collection("users").insertMany(users);
  const id = (name) => users.find((u) => u.name === name)._id;
  console.log(`  added ${users.length} classmates`);

  // ---------- leaderboard ----------
  await db.collection("leaderboards").insertMany(
    CLASSMATES.map(([name, score, contributions], i) => ({ studentId: id(name), score, contributions, rank: i + 1, flagged: name === "Aditya Kumar", seed: true, __v: 0 }))
  );

  // ---------- progress + results ----------
  const progress = [];
  const results = [];
  CLASSMATES.forEach(([name, , , readiness, confidence], i) => {
    const uid = String(id(name));
    progress.push({
      userId: uid, branch: "CSE", progressPercent: readiness, confidence, lastUpdated: at(-i),
      prepSubjects: pick(SUBJECTS, 3).map((s, k) => ({ _id: new ObjectId(), subject: s, examDate: at(4 + k * 5, 4), confidence: ["High", "Medium", "Low"][(i + k) % 3] })),
      seed: true, __v: 0,
    });
    pick(SUBJECTS, 5).forEach((subject, k) => {
      const pct = Math.max(30, Math.min(98, readiness - 12 + k * 4 + ((i * 7 + k * 3) % 9) - 4));
      const total = k % 2 ? 50 : 60;
      results.push({ studentId: uid, subject, marks: Math.round((pct / 100) * total), totalMarks: total, percentage: pct, uploadedAt: at(-75 + k * 15 + i), seed: true, __v: 0 });
    });
  });
  await db.collection("progresses").insertMany(progress);

  // real students with no results get a sample history and exam plan
  const realStudents = await db.collection("users").find({ role: "student", seed: { $ne: true } }).toArray();
  for (const s of realStudents) {
    const uid = String(s._id);
    if (await db.collection("results").countDocuments({ studentId: uid })) continue;
    [62, 68, 71, 66, 77].forEach((pct, k) =>
      results.push({ studentId: uid, subject: SUBJECTS[k], marks: Math.round((pct / 100) * 50), totalMarks: 50, percentage: pct, uploadedAt: at(-70 + k * 15), seed: true, __v: 0 })
    );
    await db.collection("progresses").updateOne(
      { userId: uid },
      {
        $set: {
          branch: "CSE", progressPercent: 77, confidence: "Medium", lastUpdated: new Date(), seedPrep: true,
          prepSubjects: [
            { _id: new ObjectId(), subject: "Operating Systems", examDate: at(4, 4), confidence: "Medium" },
            { _id: new ObjectId(), subject: "DBMS", examDate: at(9, 4), confidence: "High" },
            { _id: new ObjectId(), subject: "Computer Networks", examDate: at(13, 4), confidence: "Low" },
          ],
        },
        $setOnInsert: { __v: 0 },
      },
      { upsert: true }
    );
    console.log(`  gave ${s.name} sample results and exam plan`);
  }
  await db.collection("results").insertMany(results);

  // ---------- study materials (with real little PDF files) ----------
  fs.mkdirSync(STORAGE, { recursive: true });
  const voters = users.map((u) => u._id);
  const MATERIALS = [
    ["Operating Systems – Unit 3: Memory Management", "note", "Ananya Iyer", "approved", "trusted", 14, -1],
    ["DBMS – Previous Year Questions (2021–2025)", "pyq", "Rohan Mehta", "approved", "trusted", 18, -2],
    ["Computer Networks – TCP/IP Slides", "ppt", "Priya Nair", "approved", "community", 7, -3],
    ["Data Structures – Trees & Graphs Cheatsheet", "note", "Karthik Raj", "approved", "moderator", 9, -4],
    ["Theory of Computation – PYQ Solutions", "pyq", "Ananya Iyer", "approved", "trusted", 11, -6],
    ["Software Engineering – UML Diagrams Guide", "ppt", "Sneha Reddy", "approved", "community", 5, -7],
    ["Operating Systems – Deadlock Practice Problems", "pyq", "Rohan Mehta", "approved", "trusted", 8, -9],
    ["Computer Networks – Subnetting Practice Set", "pyq", "Arjun Menon", "pending", "", 2, -1],
    ["Discrete Maths – Graph Theory Notes", "note", "Diya Patel", "pending", "", 2, -2],
    ["DBMS – Normalization Slides", "ppt", "Vikram Singh", "revision", "", 1, -5],
    ["OS Textbook (full scan)", "note", "Meera Krishnan", "reported", "", 0, -3],
    ["Random lecture photos", "ppt", "Aditya Kumar", "rejected", "", 0, -8],
  ];
  const materials = MATERIALS.map(([title, type, by, status, approvedBy, votes, days], i) => {
    const file = `seed-${i + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.pdf`;
    fs.writeFileSync(path.join(STORAGE, file), makePdf(title, [`Uploaded by ${by} for CSE`, "Sample material created for the PrepTrack demo.", "", "1. Key concepts", "2. Important questions", "3. Quick revision points"]));
    const uploader = id(by);
    const others = voters.filter((v) => !v.equals(uploader));
    return {
      title, branch: "CSE", type, uploadedBy: by, uploaderId: uploader,
      releaseDate: at(days), fileUrl: `${BACKEND_URL}/files/${file}`,
      status, approvedBy, reviewNotes: status === "revision" ? "Please add the remaining slides on BCNF." : status === "rejected" ? "Not study material." : "",
      upvotes: others.slice(0, votes),
      reports: status === "reported" ? ["Copyrighted or paid material", "Copyrighted or paid material", "Unreadable / low quality"].map((reason, k) => ({ _id: new ObjectId(), userId: others[k], reason, createdAt: at(days + 0.5 + k * 0.1) })) : [],
      pointsAwarded: status === "approved",
      uploadedAt: at(days), createdAt: at(days), updatedAt: at(days),
      seed: true, __v: 0,
    };
  });
  await db.collection("materials").insertMany(materials);
  console.log(`  added ${materials.length} study materials (files in Backend/storage)`);

  // ---------- discussions ----------
  const c = (author, text, d) => ({ _id: new ObjectId(), author, text, createdAt: at(d) });
  const DISCUSSIONS = [
    ["Best way to revise page replacement algorithms in one night?", "Rohan Mehta", ["os", "mid-terms", "tips"], -0.3, [
      c("Priya Nair", "Solve two numericals each for FIFO, LRU and Optimal. Belady's anomaly is a favourite viva question!", -0.25),
      c("Sneha Reddy", "Draw the frame tables by hand – it sticks better than reading.", -0.2),
      c("Ananya Iyer", "There's a deadlock + memory cheatsheet in Study Materials 🙌", -0.1)]],
    ["Which DBMS units carry the most weight in the end-sem?", "Diya Patel", ["dbms", "pyqs"], -1, [
      c("Rohan Mehta", "Normalization and transactions come every single year.", -0.9),
      c("Karthik Raj", "Check the DBMS PYQ bundle – 2023 and 2024 had the same 10-mark question.", -0.8)]],
    ["Study group for Computer Networks this weekend?", "Sneha Reddy", ["cn", "study-group"], -2, [
      c("Arjun Menon", "I'm in! Library, Saturday 10 am?", -1.9)]],
    ["How do you stay consistent during exam season?", "Ananya Iyer", ["motivation", "productivity"], -4, [
      c("Priya Nair", "Pomodoro + the focus timer here. Four sessions a day minimum.", -3.9),
      c("Rohan Mehta", "Leaderboard competition with my roommate 😅", -3.8),
      c("Vikram Singh", "Streaks! I don't want to break mine.", -3.5)]],
    ["Can someone explain the difference between DFA and NFA simply?", "Aditya Kumar", ["toc", "doubt"], -0.5, []],
  ];
  await db.collection("discussions").insertMany(
    DISCUSSIONS.map(([title, author, tags, d, comments]) => ({ title, body: "", author, branch: "CSE", tags, comments, commentsCount: comments.length, createdAt: at(d), seed: true, __v: 0 }))
  );
  console.log(`  added ${DISCUSSIONS.length} discussions`);

  // ---------- announcements ----------
  const NOTES = [
    ["End-semester exam timetable is out! Plan your revision with the exam tracker.", "All Users", true, -0.2],
    ["New DBMS PYQ bundle approved and live in Study Materials.", "CSE", false, -1],
    ["Hackathon registrations close this Friday – find teammates in the Forum!", "All Users", false, -3],
    ["Library open till midnight during exam week.", "All Users", false, -5],
  ];
  await db.collection("notifications").insertMany(
    NOTES.map(([message, audience, priority, d]) => ({ message, audience, priority, createdBy: adminName, createdAt: at(d), readBy: [], seed: true, __v: 0 }))
  );

  // ---------- branches ----------
  const BRANCHES = [["Computer Science & Engineering", "CSE"], ["Electronics & Communication", "ECE"], ["Mechanical Engineering", "MECH"], ["Civil Engineering", "CIVIL"], ["AI & Machine Learning", "AIML"]];
  for (const [branchName, branchCode] of BRANCHES) {
    if (!(await db.collection("branches").findOne({ branchCode })))
      await db.collection("branches").insertOne({ branchName, branchCode, createdAt: at(-300), updatedAt: at(-300), seed: true, __v: 0 });
  }

  // ---------- security log history ----------
  const LOGS = [
    ["Ananya Iyer", "Login Success", "User logged in", -2], ["Vikram Singh", "Login Failure", "Wrong password", -5],
    ["Rohan Mehta", "Login Success", "User logged in", -8], ["Aditya Kumar", "Login Failure", "Wrong password", -20],
    ["Aditya Kumar", "Login Failure", "Wrong password", -20.2], ["Priya Nair", "Admin Action", "Profile updated", -30],
  ];
  await db.collection("securitylogs").insertMany(
    LOGS.map(([name, eventType, details, h], i) => ({ userId: id(name), eventType, details, ipAddress: `10.21.${4 + i}.${30 + i * 7}`, createdAt: at(0, h), updatedAt: at(0, h), seed: true, __v: 0 }))
  );
  console.log("  added announcements, branches and security log history");
}

const mode = process.argv[2];
try {
  await mongoose.connect(process.env.MONGO_URI);
  const db = mongoose.connection.db;
  console.log("Removing previous demo data…");
  await clear(db);
  if (mode !== "--clear") {
    console.log("Adding demo data…");
    await seed(db);
    console.log(`✅ Done. Demo classmates log in with their email and the DEMO_PASSWORD in Backend/scripts/seed.js`);
  } else {
    console.log("✅ Demo data removed.");
  }
} catch (err) {
  console.error("❌ Seed failed:", err.message);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
