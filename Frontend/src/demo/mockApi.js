// Demo mode: an axios adapter that answers every API call from in-memory sample data,
// so the UI can be shown without the backend, MongoDB or Firebase.
// Enabled only with `npm run demo` (VITE_DEMO=true). Data resets on page refresh.
import { AxiosError } from "axios";

const DAY = 86400000;
const now = Date.now();
const at = (days, hours = 0) => new Date(now + days * DAY + hours * 3600000).toISOString();
let seq = 1000;
const nextId = () => `demo${++seq}`;

const student = {
  _id: "u1",
  name: "Aditi Rao",
  email: "aditi.rao@college.edu",
  rollNumber: "AM.SC.U4CSE23140",
  branch: "CSE",
  role: "student",
  phone: "",
  year: "3rd Year",
};

const admin = {
  _id: "a1",
  name: "Dr. Meera Krishnan",
  email: "admin@college.edu",
  branch: "CSE",
  role: "admin",
};

const users = [
  student,
  { _id: "u2", name: "Rohan Mehta", email: "rohan.m@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE23118" },
  { _id: "u3", name: "Priya Nair", email: "priya.n@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE23131" },
  { _id: "u4", name: "Karthik Raj", email: "karthik.r@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE22109" },
  { _id: "u5", name: "Sneha Reddy", email: "sneha.r@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE23152" },
  { _id: "u6", name: "Arjun Menon", email: "arjun.m@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE24104" },
  { _id: "u7", name: "Diya Patel", email: "diya.p@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE23107" },
  { _id: "u8", name: "Vikram Singh", email: "vikram.s@college.edu", branch: "CSE", rollNumber: "AM.SC.U4CSE22121" },
].map((u) => ({ role: "student", ...u }));

// the demo admin is a student moderator, listed with everyone else
users.push({ ...admin, rollNumber: "AM.SC.U4CSE22001" });

// Same defaults as Backend/config/community.js, with a sample college domain
const RULES = { emailDomain: "college.edu", branches: ["CSE"], trustedXp: 150, approveUpvotes: 3, hideReports: 3 };
const POINTS = { pyq: 15, note: 10, ppt: 8 };
const branchFromRoll = (roll) => String(roll || "").toUpperCase().match(/([A-Z]{2,5})\d{5}$/)?.[1] || null;

const db = {
  leaderboard: [
    { studentId: "u2", score: 410, contributions: 31, flagged: false },
    { studentId: "u3", score: 355, contributions: 27, flagged: false },
    { studentId: "u5", score: 298, contributions: 22, flagged: false },
    { studentId: "u1", score: 245, contributions: 19, flagged: false },
    { studentId: "u7", score: 190, contributions: 15, flagged: true },
    { studentId: "u4", score: 140, contributions: 11, flagged: false },
    { studentId: "u8", score: 95, contributions: 8, flagged: false },
    { studentId: "u6", score: 60, contributions: 5, flagged: false },
  ],

  materials: [
    { title: "Operating Systems – Unit 3: Memory Management", type: "note", uploadedBy: "Rohan Mehta", status: "approved", by: "trusted", votes: 12, days: -1 },
    { title: "Computer Networks – Subnetting Practice Set", type: "pyq", uploadedBy: "Arjun Menon", status: "pending", votes: 2, days: -1.5 },
    { title: "DBMS – Previous Year Questions (2021–2025)", type: "pyq", uploadedBy: "Priya Nair", status: "approved", by: "trusted", votes: 18, days: -2 },
    { title: "Computer Networks – TCP/IP Slides", type: "ppt", uploadedBy: "Sneha Reddy", status: "approved", by: "community", votes: 7, days: -3 },
    { title: "Design & Analysis of Algorithms – DP Cheatsheet", type: "note", uploadedBy: "Aditi Rao", status: "approved", by: "moderator", votes: 5, days: -4 },
    { title: "Software Engineering – UML Diagrams Guide", type: "ppt", uploadedBy: "Diya Patel", status: "revision", votes: 1, days: -6 },
    { title: "Theory of Computation – PYQ Solutions", type: "pyq", uploadedBy: "Rohan Mehta", status: "approved", by: "trusted", votes: 9, days: -8 },
    { title: "Compiler Design – Parsing Techniques", type: "note", uploadedBy: "Priya Nair", status: "approved", by: "trusted", votes: 6, days: -10 },
    { title: "Machine Learning – Unit 1 Handwritten Notes", type: "note", uploadedBy: "Aditi Rao", status: "approved", by: "community", votes: 4, days: -12 },
    { title: "Discrete Maths – Graph Theory Notes", type: "note", uploadedBy: "Karthik Raj", status: "pending", votes: 0, days: -2 },
    { title: "OS Textbook (full PDF scan)", type: "note", uploadedBy: "Vikram Singh", status: "reported", votes: 0, days: -3,
      reports: ["Copyrighted or paid material", "Copyrighted or paid material", "Unreadable / low quality"] },
    { title: "Random lecture photos", type: "ppt", uploadedBy: "Vikram Singh", status: "rejected", votes: 0, days: -5 },
  ].map((m) => {
    const uploader = users.find((u) => u.name === m.uploadedBy);
    const voters = users.filter((u) => u._id !== uploader?._id && u._id !== "u1").map((u) => u._id);
    return {
      _id: nextId(),
      title: m.title,
      type: m.type,
      branch: "CSE",
      uploadedBy: m.uploadedBy,
      uploaderId: uploader?._id,
      status: m.status,
      approvedBy: m.by || "",
      reviewNotes: "",
      fileUrl: "about:blank",
      releaseDate: at(m.days),
      createdAt: at(m.days),
      // fake voter ids beyond the sample users keep high counts realistic
      upvotes: Array.from({ length: m.votes }, (_, i) => voters[i] || `v${i}`),
      reports: (m.reports || []).map((reason, i) => ({ userId: voters[i], reason, createdAt: at(m.days + 0.5 + i * 0.2) })),
      pointsAwarded: m.status === "approved",
    };
  }),

  notifications: [
    { message: "End-semester exam timetable is out! Check the exam cell portal and plan your revision.", priority: true, audience: "All Users", days: -0.2 },
    { message: "New PYQ bundle for DBMS has been approved and is now live in Study Materials.", priority: false, audience: "CSE", days: -1 },
    { message: "Hackathon registrations close this Friday – team up in the Forum!", priority: false, audience: "All Users", days: -3 },
    { message: "Library will stay open till midnight during exam week.", priority: false, audience: "All Users", days: -5 },
  ].map((n) => ({
    id: nextId(),
    message: n.message,
    audience: n.audience,
    priority: n.priority,
    createdBy: admin.name,
    createdAt: at(n.days),
    read: false,
  })),

  progress: {
    userId: "u1",
    branch: "CSE",
    progressPercent: 78,
    confidence: "Medium",
    prepSubjects: [
      { _id: nextId(), subject: "Operating Systems", examDate: at(4, 5), confidence: "Medium" },
      { _id: nextId(), subject: "Database Management Systems", examDate: at(9, 5), confidence: "High" },
      { _id: nextId(), subject: "Computer Networks", examDate: at(13, 5), confidence: "Low" },
      { _id: nextId(), subject: "Theory of Computation", examDate: at(18, 5), confidence: "Medium" },
    ],
  },

  results: [
    { subject: "Data Structures", marks: 41, totalMarks: 60, days: -70 },
    { subject: "Discrete Mathematics", marks: 44, totalMarks: 60, days: -55 },
    { subject: "Operating Systems", marks: 39, totalMarks: 50, days: -40 },
    { subject: "DBMS", marks: 46, totalMarks: 50, days: -26 },
    { subject: "Computer Networks", marks: 35, totalMarks: 50, days: -14 },
    { subject: "Algorithms", marks: 47, totalMarks: 60, days: -5 },
  ].map((r) => ({
    _id: nextId(),
    studentId: "u1",
    subject: r.subject,
    marks: r.marks,
    totalMarks: r.totalMarks,
    percentage: Math.round((r.marks / r.totalMarks) * 100),
    uploadedAt: at(r.days),
  })),

  discussions: [
    {
      title: "Best way to revise page replacement algorithms in one night?",
      author: "Rohan Mehta",
      tags: ["os", "mid-terms", "tips"],
      days: -0.3,
      comments: [
        { author: "Priya Nair", text: "Solve 2 numericals each for FIFO, LRU and Optimal. Belady's anomaly is a favourite viva question!" },
        { author: "Sneha Reddy", text: "Draw the frame tables by hand – it sticks way better than reading." },
        { author: "Aditi Rao", text: "There's a great cheatsheet in Study Materials uploaded yesterday 🙌" },
      ],
    },
    {
      title: "Which DBMS units carry the most weight in the end-sem?",
      author: "Diya Patel",
      tags: ["dbms", "pyqs"],
      days: -1,
      comments: [
        { author: "Rohan Mehta", text: "Normalization and transactions show up every single year." },
      ],
    },
    {
      title: "Study group for Computer Networks this weekend?",
      author: "Sneha Reddy",
      tags: ["cn", "study-group"],
      days: -2,
      comments: [],
    },
    {
      title: "How do you guys stay consistent during exam season?",
      author: "Aditi Rao",
      tags: ["motivation", "productivity"],
      days: -4,
      comments: [
        { author: "Priya Nair", text: "Pomodoro + the focus timer on this site. 4 sessions a day minimum." },
        { author: "Rohan Mehta", text: "Leaderboard competition with my roommate 😅" },
      ],
    },
  ].map((d) => ({
    _id: nextId(),
    title: d.title,
    body: "",
    author: d.author,
    branch: "CSE",
    tags: d.tags,
    comments: d.comments.map((c, i) => ({ ...c, createdAt: at(d.days + (i + 1) * 0.05) })),
    commentsCount: d.comments.length,
    createdAt: at(d.days),
  })),

  branches: [
    { branchName: "Computer Science & Engineering", branchCode: "CSE" },
    { branchName: "Electronics & Communication", branchCode: "ECE" },
    { branchName: "Mechanical Engineering", branchCode: "MECH" },
    { branchName: "Civil Engineering", branchCode: "CIVIL" },
    { branchName: "AI & Machine Learning", branchCode: "AIML" },
  ].map((b, i) => ({ _id: nextId(), ...b, createdAt: at(-400 + i * 30) })),

  securityLogs: [
    { userId: "u1", eventType: "Login Success", details: "User logged in", hours: -1 },
    { userId: "u7", eventType: "Login Failure", details: "Wrong password", hours: -3 },
    { userId: "u2", eventType: "Login Success", details: "User logged in", hours: -5 },
    { userId: "u3", eventType: "Admin Action", details: "Profile updated", hours: -9 },
    { userId: "u8", eventType: "Login Failure", details: "Wrong password", hours: -20 },
    { userId: "u5", eventType: "Password Reset", details: "Reset link sent", hours: -30 },
    { userId: "u4", eventType: "Login Success", details: "User logged in", hours: -44 },
  ].map((l, i) => ({
    _id: nextId(),
    userId: users.find((u) => u._id === l.userId),
    eventType: l.eventType,
    details: l.details,
    ipAddress: `10.12.${4 + i}.${20 + i * 7}`,
    createdAt: at(0, l.hours),
  })),
};

const userById = (id) => users.find((u) => u._id === id);

// Points go to the uploader once, when a material is first approved
function awardPoints(m) {
  if (m.pointsAwarded) return;
  const entry = db.leaderboard.find((e) => e.studentId === m.uploaderId);
  if (entry) {
    entry.score += POINTS[m.type] || 10;
    entry.contributions += 1;
  }
  m.pointsAwarded = true;
}

const forStudent = (m, me) => {
  const { upvotes = [], reports = [], ...rest } = m;
  return {
    ...rest,
    upvoteCount: upvotes.length,
    upvoted: upvotes.includes(me._id),
    reported: reports.some((r) => r.userId === me._id),
  };
};

const leaderboardRows = () =>
  [...db.leaderboard]
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, user: userById(e.studentId), rank: i + 1 }));

function currentUser(config) {
  const auth = config.headers?.Authorization || config.headers?.authorization || "";
  return String(auth).includes("admin") ? admin : student;
}

class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// [method, pattern, handler(params, body, me)]
const routes = [
  ["post", /^\/auth\/login$/, (_, body) => {
    const isAdmin = String(body?.email || "").toLowerCase().includes("admin");
    const u = isAdmin ? admin : student;
    return {
      token: isAdmin ? "demo-token-admin" : "demo-token-student",
      role: u.role,
      name: u.name,
      branch: u.branch,
      email: u.email,
      rollNumber: u.rollNumber,
    };
  }],
  ["get", /^\/auth\/rules$/, () => RULES],
  ["post", /^\/auth\/register$/, (_, body) => {
    const email = String(body.email || "").toLowerCase();
    if (RULES.emailDomain && !email.endsWith(`@${RULES.emailDomain}`)) throw new HttpError(403, `Please use your college email (@${RULES.emailDomain}).`);
    const branch = branchFromRoll(body.rollNumber);
    if (!branch) throw new HttpError(400, "That roll number doesn't look right (e.g. AM.SC.U4CSE23140).");
    if (!RULES.branches.includes(branch)) throw new HttpError(403, `PrepTrack is currently open to ${RULES.branches.join(", ")} students only.`);
    return { message: "User registered successfully", user: { id: nextId(), name: body.name, email, branch, role: "student" } };
  }],
  ["get", /^\/auth\/me$/, (_, __, me) => ({ ...me, progressPercent: me.role === "student" ? db.progress.progressPercent : undefined })],
  ["put", /^\/auth\/profile$/, (_, body, me) => {
    ["name", "phone", "year", "email"].forEach((k) => body[k] !== undefined && (me[k] = body[k]));
    return me;
  }],

  ["get", /^\/upload$/, (_, __, me) =>
    db.materials
      .filter((m) => m.branch === me.branch && ["approved", "pending", "revision"].includes(m.status))
      .sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate))
      .map((m) => forStudent(m, me))],
  ["get", /^\/upload\/all$/, () =>
    [...db.materials]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .map(({ upvotes, ...m }) => ({ ...m, upvoteCount: upvotes.length }))],
  ["post", /^\/upload$/, (_, body, me) => {
    if (db.materials.some((m) => m.title.toLowerCase() === String(body.title).trim().toLowerCase() && m.status !== "rejected")) {
      throw new HttpError(409, "A material with this title already exists.");
    }
    const trusted = (db.leaderboard.find((e) => e.studentId === me._id)?.score || 0) >= RULES.trustedXp;
    const material = {
      _id: nextId(),
      title: String(body.title).trim(),
      type: body.type,
      branch: me.branch,
      uploadedBy: me.name,
      uploaderId: me._id,
      status: trusted ? "approved" : "pending",
      approvedBy: trusted ? "trusted" : "",
      reviewNotes: "",
      fileUrl: "about:blank",
      releaseDate: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      upvotes: [],
      reports: [],
      pointsAwarded: false,
    };
    if (trusted) awardPoints(material);
    db.materials.unshift(material);
    return { message: "Uploaded!", autoApproved: trusted, material: forStudent(material, me) };
  }],
  ["post", /^\/upload\/([^/]+)\/upvote$/, ([id], _, me) => {
    const m = db.materials.find((x) => x._id === id);
    if (!m) throw new HttpError(404, "Material not found");
    if (m.uploaderId === me._id) throw new HttpError(400, "You can't upvote your own upload.");
    const already = m.upvotes.includes(me._id);
    m.upvotes = already ? m.upvotes.filter((v) => v !== me._id) : [...m.upvotes, me._id];
    let communityApproved = false;
    if (m.status === "pending" && m.upvotes.length >= RULES.approveUpvotes) {
      m.status = "approved";
      m.approvedBy = "community";
      awardPoints(m);
      communityApproved = true;
    }
    return { upvoted: !already, upvoteCount: m.upvotes.length, status: m.status, communityApproved };
  }],
  ["post", /^\/upload\/([^/]+)\/report$/, ([id], body, me) => {
    const m = db.materials.find((x) => x._id === id);
    if (!m) throw new HttpError(404, "Material not found");
    if (m.reports.some((r) => r.userId === me._id)) throw new HttpError(400, "You already reported this.");
    m.reports.push({ userId: me._id, reason: body.reason, createdAt: new Date().toISOString() });
    if (m.reports.length >= RULES.hideReports && m.status !== "rejected") m.status = "reported";
    return { reported: true, status: m.status };
  }],
  ["put", /^\/upload\/([^/]+)\/status$/, ([id], body) => {
    const m = db.materials.find((x) => x._id === id);
    if (!m) throw new HttpError(404, "Material not found");
    Object.assign(m, { status: body.status, reviewNotes: body.reviewNotes });
    if (body.status === "approved") {
      m.approvedBy = "moderator";
      m.reports = [];
      awardPoints(m);
    }
    return m;
  }],

  ["get", /^\/notification$/, () => db.notifications],
  ["post", /^\/notification\/create$/, (_, body, me) => {
    const note = { id: nextId(), _id: nextId(), ...body, createdBy: me.name, createdAt: new Date().toISOString(), read: false };
    db.notifications.unshift(note);
    return note;
  }],
  ["post", /^\/notification\/([^/]+)\/read$/, ([id]) => {
    const n = db.notifications.find((x) => x.id === id);
    if (n) n.read = true;
    return { message: "Notification marked as read" };
  }],

  ["get", /^\/progress$/, () => db.progress],
  ["get", /^\/progress\/all$/, () =>
    users.map((u, i) => ({
      userId: u._id,
      progressPercent: u._id === "u1" ? db.progress.progressPercent : [0, 91, 84, 52, 73, 38, 66, 47][i] ?? 0,
      confidence: ["Medium", "High", "High", "Low", "Medium", "Low", "Medium", "Low"][i] ?? "Medium",
    }))],
  ["post", /^\/progress\/prep\/add$/, (_, body) => {
    db.progress.prepSubjects.push({ _id: nextId(), subject: body.subject, examDate: body.examDate, confidence: body.confidence });
    return { message: "Subject added", prepSubjects: db.progress.prepSubjects };
  }],
  ["patch", /^\/progress\/prep\/update\/([^/]+)$/, ([id], body) => {
    const s = db.progress.prepSubjects.find((x) => x._id === id);
    if (!s) throw new HttpError(404, "Subject not found");
    if (body.confidence) s.confidence = body.confidence;
    if (body.examDate) s.examDate = body.examDate;
    return { message: "Updated", prepSubjects: db.progress.prepSubjects };
  }],
  ["delete", /^\/progress\/prep\/delete\/([^/]+)$/, ([id]) => {
    db.progress.prepSubjects = db.progress.prepSubjects.filter((x) => x._id !== id);
    return { message: "Deleted", prepSubjects: db.progress.prepSubjects };
  }],

  ["get", /^\/result$/, () => [...db.results].sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))],
  ["get", /^\/result\/([^/]+)$/, ([id]) => {
    if (id === "u1") return db.results;
    const seed = Number(id.replace(/\D/g, "")) || 1;
    return ["Data Structures", "Operating Systems", "DBMS", "Computer Networks"].map((subject, i) => {
      const percentage = 45 + ((seed * 17 + i * 23) % 50);
      return { _id: `${id}-r${i}`, studentId: id, subject, marks: percentage / 2, totalMarks: 50, percentage, uploadedAt: at(-60 + i * 15) };
    });
  }],
  ["post", /^\/result\/upload$/, (_, body) => {
    const percentage = Math.round((body.marks / body.totalMarks) * 100);
    const result = { _id: nextId(), studentId: "u1", ...body, percentage, uploadedAt: body.examDate || new Date().toISOString() };
    db.results.push(result);
    db.progress.progressPercent = percentage;
    db.progress.confidence = percentage >= 80 ? "High" : percentage >= 60 ? "Medium" : "Low";
    return { message: "Result uploaded successfully", result };
  }],

  ["get", /^\/leaderboard$/, () =>
    leaderboardRows().map((r) => ({
      name: r.user.name,
      branch: r.user.branch,
      contributions: r.contributions,
      score: r.score,
      rank: r.rank,
    }))],
  ["get", /^\/leaderboard\/admin$/, () =>
    leaderboardRows().map((r) => ({
      _id: `lb-${r.studentId}`,
      studentId: r.user,
      score: r.score,
      contributions: r.contributions,
      flagged: r.flagged,
    }))],
  ["put", /^\/leaderboard\/flag$/, (_, body) => {
    const e = db.leaderboard.find((x) => x.studentId === body.studentId);
    if (!e) throw new HttpError(404, "User not found in leaderboard");
    e.flagged = body.flagged;
    return { message: "User flag status updated", entry: e };
  }],

  ["get", /^\/discussions$/, () => [...db.discussions].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))],
  ["get", /^\/discussions\/([^/]+)$/, ([id]) => {
    const d = db.discussions.find((x) => x._id === id);
    if (!d) throw new HttpError(404, "Discussion not found");
    return d;
  }],
  ["post", /^\/discussions$/, (_, body, me) => {
    const d = {
      _id: nextId(),
      title: body.title,
      body: body.body || "",
      tags: (body.tags || []).filter(Boolean),
      author: me.name,
      branch: me.branch,
      comments: [],
      commentsCount: 0,
      createdAt: new Date().toISOString(),
    };
    db.discussions.unshift(d);
    return d;
  }],
  ["post", /^\/discussions\/([^/]+)\/comment$/, ([id], body, me) => {
    const d = db.discussions.find((x) => x._id === id);
    if (!d) throw new HttpError(404, "Discussion not found");
    d.comments.push({ author: me.name, text: body.text, createdAt: new Date().toISOString() });
    d.commentsCount = d.comments.length;
    return d;
  }],

  ["get", /^\/admin\/stats$/, () => {
    const count = (s) => db.materials.filter((m) => m.status === s).length;
    const byBranch = {};
    db.materials.forEach((m) => { byBranch[m.branch] = (byBranch[m.branch] || 0) + 1; });
    return {
      totalVerified: count("approved"),
      activeUploaders: new Set(db.materials.map((m) => m.uploadedBy)).size,
      pending: count("pending"),
      blocked: 1,
      rejected: count("rejected"),
      branchData: Object.entries(byBranch)
        .map(([_id, c]) => ({ _id, count: c }))
        .sort((a, b) => b.count - a.count),
      approvalRate: Math.round((count("approved") / db.materials.length) * 100),
    };
  }],
  ["get", /^\/users\/all$/, () => users],
  ["put", /^\/users\/([^/]+)\/role$/, ([id], body, me) => {
    if (id === me._id) throw new HttpError(400, "You can't change your own role.");
    const u = users.find((x) => x._id === id);
    if (!u) throw new HttpError(404, "User not found");
    if (u.role === "admin" && body.role === "student" && users.filter((x) => x.role === "admin").length <= 1) {
      throw new HttpError(400, "There must be at least one admin.");
    }
    u.role = body.role;
    return u;
  }],
  ["get", /^\/security-logs$/, () => db.securityLogs],

  ["get", /^\/branch$/, () => db.branches],
  ["post", /^\/branch\/add$/, (_, body) => {
    const b = { _id: nextId(), ...body, createdAt: new Date().toISOString() };
    db.branches.push(b);
    return b;
  }],
  ["delete", /^\/branch\/([^/]+)$/, ([id]) => {
    db.branches = db.branches.filter((b) => b._id !== id);
    return { message: "Branch deleted" };
  }],
];

function parseBody(data) {
  if (!data) return {};
  if (typeof FormData !== "undefined" && data instanceof FormData) {
    const out = {};
    data.forEach((v, k) => { out[k] = v; });
    return out;
  }
  if (typeof data === "string") {
    try { return JSON.parse(data); } catch { return {}; }
  }
  return data;
}

export async function demoAdapter(config) {
  const method = (config.method || "get").toLowerCase();
  const path = (config.url || "").replace(config.baseURL || "", "").split("?")[0];
  const body = parseBody(config.data);

  await new Promise((r) => setTimeout(r, 180 + Math.random() * 220));

  const route = routes.find(([m, re]) => m === method && re.test(path));
  const respond = (status, data) => ({ data, status, statusText: String(status), headers: {}, config, request: {} });

  try {
    if (!route) throw new HttpError(404, `Demo: no handler for ${method.toUpperCase()} ${path}`);
    const params = path.match(route[1]).slice(1);
    const data = route[2](params, body, currentUser(config));
    return respond(200, JSON.parse(JSON.stringify(data)));
  } catch (err) {
    const status = err.status || 500;
    const response = respond(status, { message: err.message });
    throw new AxiosError(err.message, String(status), config, null, response);
  }
}
