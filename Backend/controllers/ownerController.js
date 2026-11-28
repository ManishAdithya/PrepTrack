import mongoose from "mongoose";
import User from "../models/User.js";
import Material from "../models/Material.js";
import Discussion from "../models/Discussion.js";
import Exam from "../models/Exam.js";
import Notification from "../models/Notification.js";
import SecurityLog from "../models/SecurityLog.js";
import Leaderboard from "../models/Leaderboard.js";
import Feedback from "../models/Feedback.js";
import Subject from "../models/Subject.js";
import { getRules, branchFromRoll, batchFromRoll } from "../config/community.js";

// Owner dashboard: platform-wide totals and trends. Class-level numbers only —
// no individual student's login history.

const TZ = "Asia/Kolkata";
const DAY = 86400000;
const DB_LIMIT_MB = 512; // MongoDB Atlas free tier

const dayKey = (d) => new Date(d).toLocaleDateString("en-CA", { timeZone: TZ }); // YYYY-MM-DD
const since = (days) => new Date(Date.now() - days * DAY);

// [{ day: "2026-11-01", n }] for each of the last `days` days, zeros included
function dailySeries(rows, days) {
  const map = new Map(rows.map((r) => [r._id, r.n]));
  const out = [];
  for (let i = days - 1; i >= 0; i--) {
    const k = dayKey(Date.now() - i * DAY);
    out.push({ day: k, n: map.get(k) || 0 });
  }
  return out;
}

// [{ week: "2026-11-02" (Monday), n }] for each of the last `weeks` weeks
function weeklySeries(dates, weeks) {
  const monday = (d) => {
    const x = new Date(new Date(d).toLocaleString("en-US", { timeZone: TZ }));
    const back = (x.getDay() + 6) % 7;
    x.setDate(x.getDate() - back);
    x.setHours(0, 0, 0, 0);
    return x.toLocaleDateString("en-CA");
  };
  const out = [];
  for (let i = weeks - 1; i >= 0; i--) out.push({ week: monday(Date.now() - i * 7 * DAY), n: 0 });
  const idx = new Map(out.map((w, i) => [w.week, i]));
  for (const d of dates) {
    const i = idx.get(monday(d));
    if (i !== undefined) out[i].n++;
  }
  return out;
}

const createdFromId = { $toDate: "$_id" };

// The classes PrepTrack is open to, read from the allowed roll formats (AM.EN.U4EEE24### -> EEE 2024).
// Accounts or content outside them (old demo data, the owner's own account) are left out of every number.
function openClasses() {
  const seen = new Map();
  for (const f of getRules().rollFormats) {
    const roll = f.replace(/#/g, "0");
    const c = { branch: branchFromRoll(roll), batch: batchFromRoll(roll) };
    if (c.branch && c.batch) seen.set(`${c.branch}-${c.batch}`, c);
  }
  return [...seen.values()];
}
const inClasses = (classes) => (classes.length ? { $or: classes.map((c) => ({ branch: c.branch, batch: c.batch })) } : {});

// What was actually uploaded: a shared link, or a file of a given kind (read from the file name)
const KIND_EXT = { pdf: ["pdf"], ppt: ["ppt", "pptx"], doc: ["doc", "docx"], photo: ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp"] };
export function fileKind(m) {
  if (m.isLink) return "link";
  const ext = (String(m.fileUrl || "").split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i)?.[1] || "").toLowerCase();
  return Object.keys(KIND_EXT).find((k) => KIND_EXT[k].includes(ext)) || "file";
}
const linkHost = (url) => {
  const h = (() => { try { return new URL(url).hostname; } catch { return ""; } })();
  if (/drive\.google|docs\.google/.test(h)) return "Google Drive";
  if (/onedrive|1drv\.ms|sharepoint/.test(h)) return "OneDrive";
  return "Other";
};
const emptyKinds = () => ({ link: 0, pdf: 0, ppt: 0, doc: 0, photo: 0, file: 0 });
const emptyTypes = () => ({ note: 0, ppt: 0, pyq: 0, other: 0 });
const tally = (rows, key) => {
  const m = new Map();
  for (const r of rows) m.set(key(r), (m.get(key(r)) || 0) + 1);
  return m;
};
const shown = (u) => (u ? u.displayName || u.name || "Student" : "Removed student");

export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const classes = openClasses();
    const scope = inClasses(classes);
    // the owner runs the app over the class, so they are never counted as a member of it
    const members = { ...scope, isOwner: { $ne: true } };

    const [
      users,
      signupRows,
      logins,
      materials,
      subjects,
      discussions,
      exams,
      notifications,
      failed7,
      locks30,
      resets30,
      board,
      dbStats,
      feedback,
    ] = await Promise.all([
      User.find(members, { name: 1, displayName: 1, role: 1, branch: 1, batch: 1, seed: 1, hideFromLeaderboard: 1, mustChangePassword: 1, lockedUntil: 1 }).lean(),
      User.aggregate([
        { $match: members },
        { $addFields: { created: createdFromId } },
        { $match: { created: { $gte: since(60) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created", timezone: TZ } }, n: { $sum: 1 } } },
      ]),
      // sign-ins of the last 30 days (counted below, only for class members that still exist)
      SecurityLog.find({ eventType: "Login Success", createdAt: { $gte: since(30) } }, { userId: 1, createdAt: 1 }).lean(),
      Material.find(scope, { title: 1, branch: 1, batch: 1, semester: 1, subjectId: 1, subject: 1, type: 1, isLink: 1, fileUrl: 1, status: 1, approvedBy: 1, uploaderId: 1, upvotes: 1, reports: 1, createdAt: 1 }).lean(),
      Subject.find(scope).sort({ semester: 1, name: 1 }).lean(),
      Discussion.find(scope, { title: 1, author: 1, authorId: 1, tags: 1, comments: 1, createdAt: 1 }).lean(),
      Exam.find(scope).sort({ date: 1 }).select("subject type date branch batch maxMarks venue").lean(),
      Notification.find(scope, { message: 1, priority: 1, createdAt: 1, readBy: 1, createdBy: 1 }).sort({ createdAt: -1 }).lean(),
      SecurityLog.countDocuments({ eventType: "Login Failure", createdAt: { $gte: since(7) } }),
      SecurityLog.countDocuments({ eventType: "Account Lock", createdAt: { $gte: since(30) } }),
      SecurityLog.countDocuments({ eventType: "Password Reset", createdAt: { $gte: since(30) } }),
      Leaderboard.find({}, { studentId: 1, score: 1, contributions: 1, flagged: 1 }).lean(),
      mongoose.connection.db.stats(),
      Feedback.find({}, { kind: 1, status: 1 }).lean(),
    ]);

    const byId = new Map(users.map((u) => [String(u._id), u]));
    const memberCount = users.length;
    const crs = users.filter((u) => u.role === "admin").length;
    const demoAccounts = users.filter((u) => u.seed).length;

    // ---- active members: distinct class members that signed in ----
    const live = logins.filter((l) => l.userId && byId.has(String(l.userId)));
    const activeSince = (days) => new Set(live.filter((l) => l.createdAt >= since(days)).map((l) => String(l.userId))).size;
    const perDay = new Map();
    for (const l of live) {
      const k = dayKey(l.createdAt);
      if (!perDay.has(k)) perDay.set(k, new Set());
      perDay.get(k).add(String(l.userId));
    }
    const loginRows = [...perDay].map(([k, set]) => ({ _id: k, n: set.size }));
    const active30 = activeSince(30);

    // ---- content ----
    const byStatus = { approved: 0, pending: 0, rejected: 0, reported: 0, revision: 0 };
    const byType = emptyTypes();
    const byKind = emptyKinds();
    const approvedBy = { moderator: 0, community: 0, trusted: 0 };
    const linkHosts = {};
    let helpful = 0;
    let reports = 0;
    for (const m of materials) {
      byStatus[m.status] = (byStatus[m.status] || 0) + 1;
      byType[m.type] = (byType[m.type] || 0) + 1;
      const k = fileKind(m);
      byKind[k]++;
      if (k === "link") linkHosts[linkHost(m.fileUrl)] = (linkHosts[linkHost(m.fileUrl)] || 0) + 1;
      if (m.status === "approved" && approvedBy[m.approvedBy] !== undefined) approvedBy[m.approvedBy]++;
      helpful += m.upvotes?.length || 0;
      reports += m.reports?.length || 0;
    }
    const pendingDates = materials.filter((m) => m.status === "pending").map((m) => new Date(m.createdAt));
    const oldestPending = pendingDates.length ? Math.min(...pendingDates) : null;
    const pendingAgeHours = oldestPending ? Math.round((Date.now() - oldestPending) / 3600000) : 0;

    // ---- subjects per semester, with what was uploaded under each ----
    const subjectIds = new Set(subjects.map((s) => String(s._id)));
    const blank = () => ({ total: 0, live: 0, pending: 0, kinds: emptyKinds(), types: emptyTypes(), lastUpload: null });
    const stats = new Map(subjects.map((s) => [String(s._id), blank()]));
    const unsorted = new Map(); // semester -> stats, for uploads whose subject was removed (or never set)
    for (const m of materials) {
      const key = m.subjectId && subjectIds.has(String(m.subjectId)) ? String(m.subjectId) : null;
      let st = key && stats.get(key);
      if (!st) {
        const sem = m.semester || 0;
        if (!unsorted.has(sem)) unsorted.set(sem, blank());
        st = unsorted.get(sem);
      }
      st.total++;
      if (m.status === "approved") st.live++;
      if (m.status === "pending") st.pending++;
      st.kinds[fileKind(m)]++;
      st.types[m.type] = (st.types[m.type] || 0) + 1;
      if (!st.lastUpload || m.createdAt > st.lastUpload) st.lastUpload = m.createdAt;
    }
    const semesterRows = [1, 2, 3, 4, 5, 6].map((sem) => {
      const list = subjects
        .filter((s) => s.semester === sem)
        .map((s) => ({ _id: s._id, name: s.name, code: s.code, createdBy: s.createdBy || "", createdAt: s.createdAt, branch: s.branch, batch: s.batch, ...stats.get(String(s._id)) }));
      const u = unsorted.get(sem);
      return {
        semester: sem,
        subjects: list,
        unsorted: u || null,
        uploads: list.reduce((t, s) => t + s.total, 0) + (u?.total || 0),
      };
    });
    const noSemester = unsorted.get(0) || null;

    // top uploaders: uploads, how many went live, XP
    const xpOf = new Map(board.map((b) => [String(b.studentId), b]));
    const upCount = tally(materials.filter((m) => m.uploaderId), (m) => String(m.uploaderId));
    const liveCount = tally(materials.filter((m) => m.uploaderId && m.status === "approved"), (m) => String(m.uploaderId));
    const topUploaders = [...upCount]
      .filter(([id]) => byId.has(id))
      .sort((a, b) => b[1] - a[1] || (xpOf.get(b[0])?.score || 0) - (xpOf.get(a[0])?.score || 0))
      .slice(0, 6)
      .map(([id, n]) => ({ name: shown(byId.get(id)), role: byId.get(id).role, uploads: n, live: liveCount.get(id) || 0, xp: xpOf.get(id)?.score || 0 }));
    const uploaders = [...upCount.keys()].filter((id) => byId.has(id)).length;

    // ---- forum ----
    let comments = 0;
    let unanswered = 0;
    const posters = new Set();
    const commenters = new Set();
    const commentDates = [];
    for (const dsc of discussions) {
      if (dsc.authorId) posters.add(String(dsc.authorId));
      const kept = (dsc.comments || []).filter((c) => !c.removed);
      comments += kept.length;
      if (!kept.length) unanswered++;
      for (const c of kept) {
        if (c.authorId) commenters.add(String(c.authorId));
        if (c.createdAt >= since(12 * 7)) commentDates.push(c.createdAt);
      }
    }
    const topTags = [...tally(discussions.flatMap((dsc) => (dsc.tags || []).map((t) => ({ t: String(t).toLowerCase() }))), (x) => x.t)]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([tag, n]) => ({ tag, n }));
    const topThreads = discussions
      .map((dsc) => ({ _id: dsc._id, title: dsc.title, author: dsc.author, replies: (dsc.comments || []).filter((c) => !c.removed).length, createdAt: dsc.createdAt }))
      .sort((a, b) => b.replies - a.replies || new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 5);
    const forumPeople = new Set([...posters, ...commenters].filter((id) => byId.has(id))).size;

    // ---- exams ----
    const upcoming = exams.filter((e) => new Date(e.date) >= now);
    const examTypes = Object.fromEntries(tally(exams, (e) => e.type));
    const examsThisWeek = upcoming.filter((e) => new Date(e.date) <= new Date(Date.now() + 7 * DAY)).length;

    // ---- announcements: how many members have read them ----
    const readPct = (n) => (memberCount ? Math.round(((n.readBy || []).filter((id) => byId.has(String(id))).length / memberCount) * 100) : 0);
    const latestAnnouncements = notifications.slice(0, 5).map((n) => ({ _id: n._id, message: n.message, priority: !!n.priority, createdAt: n.createdAt, createdBy: n.createdBy || "", readPct: readPct(n) }));
    const avgRead = notifications.length ? Math.round(notifications.reduce((t, n) => t + readPct(n), 0) / notifications.length) : 0;

    // ---- leaderboard (class members only) ----
    const classBoard = board.filter((b) => byId.has(String(b.studentId)));
    const xpTotal = classBoard.reduce((t, b) => t + (b.score || 0), 0);
    const topXp = [...classBoard]
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((b) => ({ name: shown(byId.get(String(b.studentId))), score: b.score, contributions: b.contributions, flagged: !!b.flagged }));

    // ---- feedback ----
    const fbKinds = Object.fromEntries(tally(feedback, (f) => f.kind));
    const fbStatus = Object.fromEntries(tally(feedback, (f) => f.status));
    const feedbackNew = fbStatus.new || 0;

    // ---- security ----
    const lockedNow = users.filter((u) => u.lockedUntil && new Date(u.lockedUntil) > now).length;
    const mustChange = users.filter((u) => u.mustChangePassword).length;

    const dataMB = +(dbStats.dataSize / 1048576).toFixed(1);
    const storageMB = +((dbStats.storageSize + (dbStats.indexSize || 0)) / 1048576).toFixed(1);

    // per-class rows (members and CRs)
    const classRows = classes.map((c) => {
      const inc = users.filter((u) => u.branch === c.branch && u.batch === c.batch);
      return { branch: c.branch, batch: c.batch, students: inc.length, crs: inc.filter((u) => u.role === "admin").length };
    });

    // things the owner should look at, most urgent first
    const attention = [];
    if (feedbackNew) attention.push({ level: "serious", text: `${feedbackNew} new feedback message${feedbackNew > 1 ? "s" : ""} from students — see the inbox below.` });
    if (!subjects.length) attention.push({ level: "warning", text: "No subjects added yet — CRs add them in CR portal → Subjects so students can upload." });
    if (pendingAgeHours >= 48) attention.push({ level: "serious", text: `An upload has waited ${Math.floor(pendingAgeHours / 24)} days for CR review.` });
    if (byStatus.reported) attention.push({ level: "serious", text: `${byStatus.reported} upload${byStatus.reported > 1 ? "s are" : " is"} hidden after reports and waiting for a CR decision.` });
    const noCR = classRows.filter((c) => c.crs === 0);
    if (noCR.length) attention.push({ level: "critical", text: `${noCR.map((c) => `${c.branch} ${c.batch}`).join(", ")} ${noCR.length > 1 ? "have" : "has"} no CR yet — the CR roll numbers in CR_ROLL_NUMBERS need to sign up.` });
    if (lockedNow) attention.push({ level: "warning", text: `${lockedNow} account${lockedNow > 1 ? "s are" : " is"} locked after wrong passwords right now.` });
    if (failed7 >= 20) attention.push({ level: "warning", text: `${failed7} failed sign-ins this week — someone may be guessing passwords.` });
    if (storageMB > DB_LIMIT_MB * 0.8) attention.push({ level: "critical", text: `Database is ${Math.round((storageMB / DB_LIMIT_MB) * 100)}% full.` });
    if (demoAccounts) attention.push({ level: "warning", text: `${demoAccounts} demo accounts are still in the database — run seed:clear before launch.` });
    if (!upcoming.length) attention.push({ level: "warning", text: "No upcoming exams posted — students have no countdown." });
    const emptySubjects = semesterRows.flatMap((s) => s.subjects).filter((s) => s.total === 0).length;
    if (subjects.length && emptySubjects) attention.push({ level: "warning", text: `${emptySubjects} subject${emptySubjects > 1 ? "s have" : " has"} no uploads yet.` });

    res.json({
      generatedAt: now,
      classes: classes.map((c) => `${c.branch} ${c.batch}`),
      users: {
        students: memberCount,
        crs,
        demoAccounts,
        displayNames: users.filter((u) => u.displayName).length,
        hiddenFromLeaderboard: users.filter((u) => u.hideFromLeaderboard).length,
        activeToday: activeSince(1),
        active7: activeSince(7),
        active30,
        quiet30: memberCount - active30,
        signups: dailySeries(signupRows, 60),
        dailyActive: dailySeries(loginRows, 30),
        classes: classRows,
      },
      content: {
        total: materials.length,
        byStatus,
        byType,
        byKind,
        linkHosts,
        approvedBy,
        helpful,
        reports,
        uploaders,
        topUploaders,
        uploadsPerWeek: weeklySeries(materials.filter((m) => m.createdAt >= since(12 * 7)).map((m) => m.createdAt), 12),
        oldestPendingHours: pendingAgeHours,
      },
      subjectsBySemester: semesterRows,
      noSemester,
      forum: {
        discussions: discussions.length,
        comments,
        unanswered,
        avgReplies: discussions.length ? +(comments / discussions.length).toFixed(1) : 0,
        people: forumPeople,
        topTags,
        topThreads,
        postsPerWeek: weeklySeries(discussions.filter((dsc) => dsc.createdAt >= since(12 * 7)).map((dsc) => dsc.createdAt), 12),
        commentsPerWeek: weeklySeries(commentDates, 12),
      },
      exams: { upcoming: upcoming.length, total: exams.length, past: exams.length - upcoming.length, thisWeek: examsThisWeek, byType: examTypes, next: upcoming.slice(0, 6) },
      announcements: {
        total: notifications.length,
        last30: notifications.filter((n) => n.createdAt >= since(30)).length,
        highPriority: notifications.filter((n) => n.priority).length,
        avgReadPct: avgRead,
        latest: latestAnnouncements,
      },
      announcements30: notifications.filter((n) => n.createdAt >= since(30)).length,
      leaderboard: { xpTotal, flagged: classBoard.filter((b) => b.flagged).length, top: topXp },
      security: { failed7, locks30, resets30, lockedNow, mustChange },
      xpTotal,
      storage: { dataMB, usedMB: storageMB, limitMB: DB_LIMIT_MB },
      feedback: { new: feedbackNew, total: feedback.length, byKind: fbKinds, byStatus: fbStatus },
      subjects: subjects.length,
      attention,
    });
  } catch (err) {
    console.error("Owner Overview Error:", err);
    res.status(500).json({ message: "Error building the overview" });
  }
};

