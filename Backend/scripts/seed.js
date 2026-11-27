// Fills the database with realistic demo data for all four CSE batches (1st–4th year).
//   npm --prefix Backend run seed         -> (re)create the demo data
//   npm --prefix Backend run seed:clear   -> remove everything this script added
// Each batch gets its own classmates, materials, discussions, announcements, leaderboard and results,
// so you can log in as students of different years and check they never see each other.
// A batch with no real CR gets one demo CR (the first classmate listed for it).
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

// The batch now in 1st year: the academic year starts in July
const now = new Date();
const FIRST_YEAR_BATCH = now.getFullYear() - (now.getMonth() >= 6 ? 0 : 1);

// One entry per year of study. Classmates: [name, xp, uploads, readiness %, confidence]
const YEARS = [
  {
    year: 1,
    subjects: ["Programming in C", "Engineering Mathematics I", "Engineering Physics", "Digital Logic Design", "Problem Solving"],
    classmates: [
      ["Ishaan Verma", 210, 16, 84, "High"], ["Tara Joseph", 175, 13, 79, "High"], ["Nikhil Bose", 140, 11, 71, "Medium"],
      ["Aarav Shah", 105, 8, 66, "Medium"], ["Kavya Pillai", 70, 6, 58, "Low"], ["Yash Gupta", 35, 3, 49, "Low"],
    ],
    announcements: [["Welcome to PrepTrack! Your first mid-terms start in 3 weeks.", true], ["C programming lab record submission due Friday.", false]],
  },
  {
    year: 2,
    subjects: ["Data Structures", "Discrete Mathematics", "Computer Organization", "Object Oriented Programming", "Probability & Statistics"],
    classmates: [
      ["Riya Sharma", 330, 24, 88, "High"], ["Dev Malhotra", 280, 21, 83, "High"], ["Neha Kulkarni", 230, 17, 76, "Medium"],
      ["Sahil Khan", 180, 14, 70, "Medium"], ["Pooja Das", 120, 9, 61, "Low"], ["Manav Jain", 60, 5, 52, "Low"],
    ],
    announcements: [["End-semester timetable is out — Data Structures is the first paper.", true], ["Extra OOP lab session on Saturday, 10 am.", false]],
  },
  {
    year: 3,
    subjects: ["Operating Systems", "DBMS", "Computer Networks", "Theory of Computation", "Software Engineering"],
    classmates: [
      ["Ananya Iyer", 420, 30, 91, "High"], ["Rohan Mehta", 365, 27, 86, "High"], ["Priya Nair", 310, 23, 82, "High"],
      ["Karthik Raj", 255, 19, 74, "Medium"], ["Sneha Reddy", 198, 15, 69, "Medium"], ["Arjun Menon", 160, 12, 63, "Medium"],
      ["Diya Patel", 120, 9, 58, "Low"], ["Vikram Singh", 85, 7, 52, "Low"],
    ],
    announcements: [["End-semester timetable is out! Plan your revision with the exam tracker.", true], ["New DBMS PYQ bundle approved and live in Study Materials.", false]],
  },
  {
    year: 4,
    subjects: ["Compiler Design", "Machine Learning", "Cloud Computing", "Cryptography", "Distributed Systems"],
    classmates: [
      ["Aditi Rao", 390, 28, 89, "High"], ["Siddharth Nambiar", 320, 24, 84, "High"], ["Lakshmi Menon", 260, 19, 77, "Medium"],
      ["Rahul Varma", 200, 15, 70, "Medium"], ["Fatima Sheikh", 140, 10, 62, "Low"], ["Gautam Pillai", 80, 6, 54, "Low"],
    ],
    announcements: [["Placement drive: resume submissions close this Friday.", true], ["Final-year project review panels are posted.", false]],
  },
].map((y) => ({ ...y, batch: FIRST_YEAR_BATCH - (y.year - 1) }));

const ORDINAL = ["1st", "2nd", "3rd", "4th"];

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

async function seedBatch(db, Y, hash) {
  const { batch, subjects: S } = Y;
  const scope = { branch: "CSE", batch };
  const yr = `${ORDINAL[Y.year - 1]} year`;

  // ---------- classmates (first one becomes the demo CR if the batch has no real CR) ----------
  const realCRs = await db.collection("users").countDocuments({ ...scope, role: "admin", seed: { $ne: true } });
  const users = Y.classmates.map(([name], i) => ({
    _id: new ObjectId(),
    name,
    email: `${name.toLowerCase().replace(/\s+/g, ".")}.${batch % 100}@demo.preptrack.edu`,
    rollNumber: `AM.SC.U4CSE${batch % 100}${String(101 + i).padStart(3, "0")}`,
    ...scope,
    role: i === 0 && realCRs === 0 ? "admin" : "student",
    password: hash,
    seed: true,
    __v: 0,
  }));
  await db.collection("users").insertMany(users);
  const id = (name) => users.find((u) => u.name === name)._id;
  const C = Y.classmates.map(([name]) => name);
  const cr = users.find((u) => u.role === "admin");
  const realCR = realCRs ? await db.collection("users").findOne({ ...scope, role: "admin", seed: { $ne: true } }) : null;
  const crName = cr?.name || realCR?.name || "Class CR";

  // ---------- leaderboard ----------
  await db.collection("leaderboards").insertMany(
    Y.classmates.map(([name, score, contributions], i) => ({ studentId: id(name), score, contributions, rank: i + 1, flagged: i === C.length - 1, seed: true, __v: 0 }))
  );

  // ---------- progress + results ----------
  const progress = [];
  const results = [];
  Y.classmates.forEach(([name, , , readiness, confidence], i) => {
    const uid = String(id(name));
    progress.push({
      userId: uid, branch: "CSE", progressPercent: readiness, confidence, lastUpdated: at(-i),
      prepSubjects: pick(S, 3).map((s, k) => ({ _id: new ObjectId(), subject: s, examDate: at(4 + k * 5, 4), confidence: ["High", "Medium", "Low"][(i + k) % 3] })),
      seed: true, __v: 0,
    });
    S.forEach((subject, k) => {
      const pct = Math.max(30, Math.min(98, readiness - 12 + k * 4 + ((i * 7 + k * 3) % 9) - 4));
      const total = k % 2 ? 50 : 60;
      results.push({ studentId: uid, subject, marks: Math.round((pct / 100) * total), totalMarks: total, percentage: pct, uploadedAt: at(-75 + k * 15 + i), seed: true, __v: 0 });
    });
  });
  await db.collection("progresses").insertMany(progress);

  // real students of this batch with no results get a sample history and exam plan
  const realStudents = await db.collection("users").find({ ...scope, role: "student", seed: { $ne: true } }).toArray();
  for (const s of realStudents) {
    const uid = String(s._id);
    if (await db.collection("results").countDocuments({ studentId: uid })) continue;
    [62, 68, 71, 66, 77].forEach((pct, k) =>
      results.push({ studentId: uid, subject: S[k], marks: Math.round((pct / 100) * 50), totalMarks: 50, percentage: pct, uploadedAt: at(-70 + k * 15), seed: true, __v: 0 })
    );
    await db.collection("progresses").updateOne(
      { userId: uid },
      {
        $set: {
          branch: "CSE", progressPercent: 77, confidence: "Medium", lastUpdated: new Date(), seedPrep: true,
          prepSubjects: [
            { _id: new ObjectId(), subject: S[0], examDate: at(4, 4), confidence: "Medium" },
            { _id: new ObjectId(), subject: S[1], examDate: at(9, 4), confidence: "High" },
            { _id: new ObjectId(), subject: S[2], examDate: at(13, 4), confidence: "Low" },
          ],
        },
        $setOnInsert: { __v: 0 },
      },
      { upsert: true }
    );
    console.log(`    gave ${s.name} sample results and exam plan`);
  }
  await db.collection("results").insertMany(results);

  // ---------- study materials (with real little PDF files) ----------
  fs.mkdirSync(STORAGE, { recursive: true });
  const voters = users.map((u) => u._id);
  const n = (i) => C[i % C.length];
  const MATERIALS = [
    [`${S[0]} – Unit 3 Notes`, "note", n(0), "approved", "trusted", 5, -1],
    [`${S[1]} – Previous Year Questions`, "pyq", n(1), "approved", "trusted", 5, -2],
    [`${S[2]} – Lecture Slides`, "ppt", n(2), "approved", "community", 4, -3],
    [`${S[3]} – Quick Revision Cheatsheet`, "note", n(3), "approved", "moderator", 3, -4],
    [`${S[4]} – PYQ Solutions`, "pyq", n(0), "approved", "trusted", 4, -6],
    [`${S[2]} – Practice Problem Set`, "pyq", n(4), "pending", "", 2, -1],
    [`${S[1]} – Unit 2 Slides`, "ppt", n(5), "revision", "", 1, -5],
    [`${S[0]} textbook (full scan)`, "note", n(4), "reported", "", 0, -3],
    ["Random lecture photos", "ppt", n(5), "rejected", "", 0, -8],
  ];
  const materials = MATERIALS.map(([title, type, by, status, approvedBy, votes, days], i) => {
    const file = `seed-${batch}-${i + 1}-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40)}.pdf`;
    fs.writeFileSync(path.join(STORAGE, file), makePdf(title, [`Uploaded by ${by} for CSE ${batch} batch (${yr})`, "Sample material created for the PrepTrack demo.", "", "1. Key concepts", "2. Important questions", "3. Quick revision points"]));
    const uploader = id(by);
    const others = voters.filter((v) => !v.equals(uploader));
    return {
      title, ...scope, type, uploadedBy: by, uploaderId: uploader,
      releaseDate: at(days), fileUrl: `${BACKEND_URL}/files/${file}`,
      status, approvedBy, reviewNotes: status === "revision" ? "Please add the remaining slides for the last topic." : status === "rejected" ? "Not study material." : "",
      upvotes: others.slice(0, votes),
      reports: status === "reported" ? ["Copyrighted or paid material", "Copyrighted or paid material", "Unreadable / low quality"].map((reason, k) => ({ _id: new ObjectId(), userId: others[k], reason, createdAt: at(days + 0.5 + k * 0.1) })) : [],
      pointsAwarded: status === "approved",
      uploadedAt: at(days), createdAt: at(days), updatedAt: at(days),
      seed: true, __v: 0,
    };
  });
  await db.collection("materials").insertMany(materials);

  // ---------- discussions ----------
  const c = (author, text, d) => ({ _id: new ObjectId(), author, text, createdAt: at(d) });
  const tag = (s) => s.toLowerCase().split(/\s+/)[0];
  const DISCUSSIONS = [
    [`Best way to revise ${S[0]} in one night?`, n(1), [tag(S[0]), "tips"], -0.3, [
      c(n(2), "Solve the PYQs first, then read only what you got wrong.", -0.25),
      c(n(3), "Write a one-page summary per unit — it sticks better than re-reading.", -0.2),
      c(n(0), `There's a ${S[0]} notes upload in Study Materials 🙌`, -0.1)]],
    [`Which ${S[1]} units carry the most weight in the end-sem?`, n(4), [tag(S[1]), "pyqs"], -1, [
      c(n(1), "Units 2 and 4 come every single year.", -0.9),
      c(n(3), "Check the PYQ bundle — the last two papers repeated a 10-mark question.", -0.8)]],
    [`Study group for ${S[2]} this weekend?`, n(3), [tag(S[2]), "study-group"], -2, [
      c(n(5), "I'm in! Library, Saturday 10 am?", -1.9)]],
    ["How do you stay consistent during exam season?", n(0), ["motivation", "productivity"], -4, [
      c(n(2), "Pomodoro + the focus timer here. Four sessions a day minimum.", -3.9),
      c(n(1), "Leaderboard competition with my roommate 😅", -3.8)]],
    [`Can someone explain the hardest topic in ${S[3]} simply?`, n(5), [tag(S[3]), "doubt"], -0.5, []],
  ];
  await db.collection("discussions").insertMany(
    DISCUSSIONS.map(([title, author, tags, d, comments]) => ({ title, body: "", author, ...scope, tags, comments, commentsCount: comments.length, createdAt: at(d), seed: true, __v: 0 }))
  );

  // ---------- announcements (from this batch's CR) ----------
  await db.collection("notifications").insertMany(
    [...Y.announcements, ["Library open till midnight during exam week.", false]].map(([message, priority], i) => ({
      message, audience: "All Users", priority, createdBy: crName, ...scope, createdAt: at(-0.2 - i * 2), readBy: [], seed: true, __v: 0,
    }))
  );

  // ---------- security log history ----------
  const LOGS = [
    [n(0), "Login Success", "User logged in", -2], [n(4), "Login Failure", "Wrong password", -5],
    [n(1), "Login Success", "User logged in", -8], [n(5), "Login Failure", "Wrong password", -20],
  ];
  await db.collection("securitylogs").insertMany(
    LOGS.map(([name, eventType, details, h], i) => ({ userId: id(name), eventType, details, ipAddress: `10.${Y.year}.${4 + i}.${30 + i * 7}`, createdAt: at(0, h), updatedAt: at(0, h), seed: true, __v: 0 }))
  );

  console.log(`  CSE ${batch} batch (${yr}): ${users.length} classmates, ${materials.length} materials, ${DISCUSSIONS.length} discussions` +
    (cr ? ` — demo CR: ${cr.email}` : ` — CR: ${realCR?.name} (real account)`));
  return cr ? [`${yr}`.padEnd(9) + cr.email + "  (CR)", `${yr}`.padEnd(9) + users[1].email] : [`${yr}`.padEnd(9) + users[1].email];
}

async function seed(db) {
  const hash = await bcrypt.hash(DEMO_PASSWORD, 10);
  const logins = [];
  for (const Y of YEARS) logins.push(...(await seedBatch(db, Y, hash)));

  // ---------- branches (just the list shown on the Branches page) ----------
  const BRANCHES = [["Computer Science & Engineering", "CSE"], ["Electronics & Communication", "ECE"], ["Mechanical Engineering", "MECH"], ["Civil Engineering", "CIVIL"], ["AI & Machine Learning", "AIML"]];
  for (const [branchName, branchCode] of BRANCHES) {
    if (!(await db.collection("branches").findOne({ branchCode })))
      await db.collection("branches").insertOne({ branchName, branchCode, createdAt: at(-300), updatedAt: at(-300), seed: true, __v: 0 });
  }

  console.log(`\n  Try logging in as (password: ${DEMO_PASSWORD}):\n` + logins.map((l) => "    " + l).join("\n"));
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
