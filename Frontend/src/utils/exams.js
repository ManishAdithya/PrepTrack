// Shared helpers for the CR-posted exam schedule (Backend/models/Exam.js)

export const EXAM_TYPES = ["Quiz", "Mid-term", "End-semester", "Lab exam", "Assignment", "Other"];

// Bigger exams get the accent; quizzes and the rest stay neutral
export const typeChip = (type) =>
  type === "End-semester" || type === "Mid-term"
    ? "border-accent/40 bg-accent/10 text-accent"
    : "border-white/10 bg-white/[0.05] text-zinc-300";

// "Tue, 9 Dec · 10:00 am"
export const examWhen = (d) => {
  const date = new Date(d);
  return `${date.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })} · ${date
    .toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })
    .toLowerCase()}`;
};

// Date -> value for <input type="datetime-local"> in the viewer's own time zone
export const toLocalInput = (d) => {
  const date = new Date(d);
  const pad = (n) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

// "Today", "Tomorrow", "in 5 days", "3 weeks"
export const relative = (d) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  const days = Math.round((target - start) / 86400000);
  if (days < 0) return "Done";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days < 14) return `in ${days} days`;
  return `in ${Math.round(days / 7)} weeks`;
};

export const daysLeft = (d) => {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const target = new Date(d);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - start) / 86400000);
};

// A short line of the optional details: "50 marks · 1 h 30 min · Room 204"
export const examFacts = (e) =>
  [
    e.maxMarks ? `${e.maxMarks} marks` : null,
    e.durationMinutes
      ? e.durationMinutes >= 60
        ? `${Math.floor(e.durationMinutes / 60)} h${e.durationMinutes % 60 ? ` ${e.durationMinutes % 60} min` : ""}`
        : `${e.durationMinutes} min`
      : null,
    e.venue || null,
  ]
    .filter(Boolean)
    .join(" · ");

// ---- semesters (S1–S7) ----
export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7];

// The semester a batch is in now: Jul–Dec is the odd semester of the year, Jan–Jun the even one.
// e.g. 2024 batch in Nov 2026 -> 3rd year, odd -> S5
export function currentSemester(batch, now = new Date()) {
  if (!batch) return 1;
  const year = now.getFullYear() - batch + (now.getMonth() >= 6 ? 1 : 0);
  const sem = now.getMonth() >= 6 ? year * 2 - 1 : year * 2;
  return Math.min(7, Math.max(1, sem));
}
