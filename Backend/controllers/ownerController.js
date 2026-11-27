import mongoose from "mongoose";
import User from "../models/User.js";
import Material from "../models/Material.js";
import Discussion from "../models/Discussion.js";
import Exam from "../models/Exam.js";
import Notification from "../models/Notification.js";
import SecurityLog from "../models/SecurityLog.js";
import Leaderboard from "../models/Leaderboard.js";

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

export const getOverview = async (req, res) => {
  try {
    const now = new Date();
    const [
      students,
      crs,
      demoAccounts,
      classes,
      signupRows,
      logins,
      userIds,
      ,
      materialsByStatus,
      materialsByType,
      materialDates,
      oldestPending,
      discussions,
      discussionDates,
      commentDates,
      examsUpcoming,
      nextExams,
      examsTotal,
      announcements30,
      failed7,
      locks30,
      resets30,
      lockedNow,
      mustChange,
      xp,
      dbStats,
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ seed: true }),
      User.aggregate([
        { $group: { _id: { branch: "$branch", batch: "$batch" }, students: { $sum: 1 }, crs: { $sum: { $cond: [{ $eq: ["$role", "admin"] }, 1, 0] } } } },
        { $sort: { "_id.batch": 1, "_id.branch": 1 } },
      ]),
      User.aggregate([
        { $addFields: { created: createdFromId } },
        { $match: { created: { $gte: since(60) } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$created", timezone: TZ } }, n: { $sum: 1 } } },
      ]),
      // sign-ins of the last 30 days (counted below, only for accounts that still exist)
      SecurityLog.find({ eventType: "Login Success", createdAt: { $gte: since(30) } }, { userId: 1, createdAt: 1 }).lean(),
      User.distinct("_id"),
      null,
      Material.aggregate([{ $group: { _id: "$status", n: { $sum: 1 } } }]),
      Material.aggregate([{ $group: { _id: "$type", n: { $sum: 1 } } }]),
      Material.find({ createdAt: { $gte: since(12 * 7) } }, { createdAt: 1 }).lean(),
      Material.findOne({ status: "pending" }).sort({ createdAt: 1 }).select("createdAt").lean(),
      Discussion.countDocuments(),
      Discussion.find({ createdAt: { $gte: since(12 * 7) } }, { createdAt: 1 }).lean(),
      Discussion.aggregate([{ $unwind: "$comments" }, { $match: { "comments.createdAt": { $gte: since(12 * 7) } } }, { $project: { d: "$comments.createdAt" } }]),
      Exam.countDocuments({ date: { $gte: now } }),
      Exam.find({ date: { $gte: now } }).sort({ date: 1 }).limit(6).select("subject type date branch batch maxMarks").lean(),
      Exam.countDocuments(),
      Notification.countDocuments({ createdAt: { $gte: since(30) } }),
      SecurityLog.countDocuments({ eventType: "Login Failure", createdAt: { $gte: since(7) } }),
      SecurityLog.countDocuments({ eventType: "Account Lock", createdAt: { $gte: since(30) } }),
      SecurityLog.countDocuments({ eventType: "Password Reset", createdAt: { $gte: since(30) } }),
      User.countDocuments({ lockedUntil: { $gt: now } }),
      User.countDocuments({ mustChangePassword: true }),
      Leaderboard.aggregate([{ $group: { _id: null, total: { $sum: "$score" } } }]),
      mongoose.connection.db.stats(),
    ]);

    // active users: distinct existing accounts that signed in
    const exists = new Set(userIds.map(String));
    const live = logins.filter((l) => l.userId && exists.has(String(l.userId)));
    const activeSince = (days) => new Set(live.filter((l) => l.createdAt >= since(days)).map((l) => String(l.userId))).size;
    const perDay = new Map();
    for (const l of live) {
      const k = dayKey(l.createdAt);
      if (!perDay.has(k)) perDay.set(k, new Set());
      perDay.get(k).add(String(l.userId));
    }
    const loginRows = [...perDay].map(([k, set]) => ({ _id: k, n: set.size }));

    const byStatus = Object.fromEntries(materialsByStatus.map((r) => [r._id, r.n]));
    const pendingAgeHours = oldestPending ? Math.round((Date.now() - new Date(oldestPending.createdAt)) / 3600000) : 0;
    const dataMB = +(dbStats.dataSize / 1048576).toFixed(1);
    const storageMB = +((dbStats.storageSize + (dbStats.indexSize || 0)) / 1048576).toFixed(1);

    // things the owner should look at, most urgent first
    const attention = [];
    if (pendingAgeHours >= 48) attention.push({ level: "serious", text: `An upload has waited ${Math.floor(pendingAgeHours / 24)} days for CR review.` });
    if (byStatus.reported) attention.push({ level: "serious", text: `${byStatus.reported} upload${byStatus.reported > 1 ? "s are" : " is"} hidden after reports and waiting for a CR decision.` });
    const noCR = classes.filter((c) => c.crs === 0);
    if (noCR.length) attention.push({ level: "critical", text: `${noCR.map((c) => `${c._id.branch} ${c._id.batch}`).join(", ")} ${noCR.length > 1 ? "have" : "has"} no CR — run make-admin.` });
    if (lockedNow) attention.push({ level: "warning", text: `${lockedNow} account${lockedNow > 1 ? "s are" : " is"} locked after wrong passwords right now.` });
    if (failed7 >= 20) attention.push({ level: "warning", text: `${failed7} failed sign-ins this week — someone may be guessing passwords.` });
    if (storageMB > DB_LIMIT_MB * 0.8) attention.push({ level: "critical", text: `Database is ${Math.round((storageMB / DB_LIMIT_MB) * 100)}% full.` });
    if (demoAccounts) attention.push({ level: "warning", text: `${demoAccounts} demo accounts are still in the database — run seed:clear before launch.` });
    if (!examsUpcoming) attention.push({ level: "warning", text: "No upcoming exams posted — students have no countdown." });

    res.json({
      generatedAt: now,
      users: {
        students,
        crs,
        demoAccounts,
        active7: activeSince(7),
        active30: activeSince(30),
        signups: dailySeries(signupRows, 60),
        dailyActive: dailySeries(loginRows, 30),
        classes: classes.map((c) => ({ branch: c._id.branch, batch: c._id.batch, students: c.students, crs: c.crs })),
      },
      content: {
        total: materialsByStatus.reduce((t, r) => t + r.n, 0),
        byStatus: {
          approved: byStatus.approved || 0,
          pending: byStatus.pending || 0,
          rejected: byStatus.rejected || 0,
          reported: byStatus.reported || 0,
          revision: byStatus.revision || 0,
        },
        byType: Object.fromEntries(materialsByType.map((r) => [r._id, r.n])),
        uploadsPerWeek: weeklySeries(materialDates.map((m) => m.createdAt), 12),
        oldestPendingHours: pendingAgeHours,
      },
      forum: {
        discussions,
        postsPerWeek: weeklySeries(discussionDates.map((d) => d.createdAt), 12),
        commentsPerWeek: weeklySeries(commentDates.map((c) => c.d), 12),
      },
      exams: { upcoming: examsUpcoming, total: examsTotal, next: nextExams },
      announcements30,
      security: { failed7, locks30, resets30, lockedNow, mustChange },
      xpTotal: xp[0]?.total || 0,
      storage: { dataMB, usedMB: storageMB, limitMB: DB_LIMIT_MB },
      attention,
    });
  } catch (err) {
    console.error("Owner Overview Error:", err);
    res.status(500).json({ message: "Error building the overview" });
  }
};
