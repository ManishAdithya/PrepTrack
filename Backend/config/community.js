// Rules for running PrepTrack as a student-run community.
// Every value can be overridden in .env (see .env.example).
// Read at call time because dotenv loads after ES module imports are evaluated.
const list = (value, fallback) =>
  value ? value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : fallback;

export function getRules() {
  return {
    // Only emails ending in this domain can sign up ("" allows any email)
    emailDomain: (process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase().replace(/^@/, ""),
    // Branches allowed to sign up, read from the roll number (AM.SC.U4CSE23140 -> CSE)
    branches: list(process.env.ALLOWED_BRANCHES, ["CSE"]),
    // Students with at least this much XP get their uploads approved instantly
    trustedXp: Number(process.env.TRUSTED_XP || 150),
    // A pending upload goes live once this many classmates upvote it
    approveUpvotes: Number(process.env.AUTO_APPROVE_UPVOTES || 3),
    // An upload is hidden for moderator review once this many students report it
    hideReports: Number(process.env.AUTO_HIDE_REPORTS || 3),
  };
}

// Leaderboard points per material type, awarded once the upload is approved
export const POINTS = { pyq: 15, note: 10, ppt: 8 };

// "AM.SC.U4CSE23140" -> "CSE"
export function branchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/([A-Z]{2,5})\d{5}$/);
  return m ? m[1] : null;
}

// "AM.SC.U4CSE23140" -> 2023 (the joining batch; the two digits before the last three)
export function batchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/[A-Z]{2,5}(\d{2})\d{3}$/);
  return m ? 2000 + Number(m[1]) : null;
}

// Each batch can have at most this many CRs (admins)
export const MAX_CRS_PER_BATCH = Number(process.env.MAX_CRS_PER_BATCH || 2);

// The group a user belongs to. Everything a user can see or manage is limited to it:
// students of one branch + joining batch never see another batch's data.
export const scopeOf = (user) => ({ branch: user.branch, batch: user.batch });
