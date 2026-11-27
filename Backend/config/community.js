// Rules for running PrepTrack as a student-run community.
// Every value can be overridden in .env (see .env.example).
// Read at call time because dotenv loads after ES module imports are evaluated.
const list = (value, fallback) =>
  value ? value.split(",").map((s) => s.trim().toUpperCase()).filter(Boolean) : fallback;

// Who can sign up: roll numbers in this format, where # is any digit 0–9.
// The pilot is one class: EEE students who joined in 2024 (AM.EN.U4EEE24001 … AM.EN.U4EEE24999).
// To open more classes later, list several formats separated by commas,
// e.g. "AM.EN.U4EEE24###,AM.EN.U4EEE25###".
const DEFAULT_ROLL_FORMATS = "AM.EN.U4EEE24###";

// A format without any # would only match one exact roll number — almost always an unquoted
// .env value where everything after # was dropped as a comment. Fall back to the default then.
let warned = false;
const rollFormats = () => {
  const fromEnv = list(process.env.ALLOWED_ROLL_FORMATS, []);
  if (fromEnv.length && fromEnv.some((f) => !f.includes("#"))) {
    if (!warned) {
      console.warn(`⚠️  ALLOWED_ROLL_FORMATS has no # (is it quoted in .env?). Using the default ${DEFAULT_ROLL_FORMATS}.`);
      warned = true;
    }
    return list(DEFAULT_ROLL_FORMATS, []);
  }
  return fromEnv.length ? fromEnv : list(DEFAULT_ROLL_FORMATS, []);
};
const formatToRegex = (f) =>
  new RegExp("^" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/#/g, "\\d") + "$");

// Does this roll number match one of the allowed formats?
export function rollAllowed(roll) {
  const r = String(roll || "").trim().toUpperCase();
  return rollFormats().some((f) => formatToRegex(f).test(r));
}

export function getRules() {
  const rollFormatList = rollFormats();
  return {
    // Only emails ending in this domain can sign up ("" allows any email)
    emailDomain: (process.env.ALLOWED_EMAIL_DOMAIN || "").trim().toLowerCase().replace(/^@/, ""),
    // Roll number formats that can sign up (# = any digit)
    rollFormats: rollFormatList,
    // Branches that can sign up, read from the allowed roll formats (AM.EN.U4EEE24### -> EEE)
    branches: [...new Set(rollFormatList.map((f) => branchFromRoll(f.replace(/#/g, "0"))).filter(Boolean))],
    // Students with at least this much XP get their uploads approved instantly
    trustedXp: Number(process.env.TRUSTED_XP || 150),
    // A pending upload goes live once this many classmates upvote it
    approveUpvotes: Number(process.env.AUTO_APPROVE_UPVOTES || 5),
    // An upload is hidden for moderator review once this many students report it
    hideReports: Number(process.env.AUTO_HIDE_REPORTS || 5),
    // Biggest file a student can upload, in MB (Blob storage is only 1 GB; bigger files go on Drive)
    maxUploadMb: Number(process.env.MAX_UPLOAD_MB || 5),
  };
}

// Leaderboard points per material type, awarded once the upload is approved
export const POINTS = { pyq: 15, note: 10, ppt: 8, other: 5 };

// "AM.EN.U4EEE24140" -> "EEE"
export function branchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/([A-Z]{2,5})\d{5}$/);
  return m ? m[1] : null;
}

// "AM.EN.U4EEE24140" -> 2024 (the joining batch; the two digits before the last three)
export function batchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/[A-Z]{2,5}(\d{2})\d{3}$/);
  return m ? 2000 + Number(m[1]) : null;
}

// Roll numbers that become CRs as soon as they sign up (comma-separated in CR_ROLL_NUMBERS)
const DEFAULT_CR_ROLLS = "AM.EN.U4EEE24045,AM.EN.U4EEE24021";
export const crRolls = () => list(process.env.CR_ROLL_NUMBERS, DEFAULT_CR_ROLLS.split(",")).map((r) => r.toUpperCase());

// Each batch can have at most this many CRs (admins)
export const MAX_CRS_PER_BATCH = Number(process.env.MAX_CRS_PER_BATCH || 2);

// The group a user belongs to. Everything a user can see or manage is limited to it:
// students of one branch + joining batch never see another batch's data.
export const scopeOf = (user) => ({ branch: user.branch, batch: user.batch });
