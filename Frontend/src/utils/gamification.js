import { useState } from "react";
import {
  Upload,
  Library,
  Crown,
  Flame,
  Timer,
  LineChart,
  MessagesSquare,
  Rocket,
} from "lucide-react";
import { DEMO_MODE } from "../api.js";

// ---------- storage helpers (per browser, never required for the app to work) ----------
export function readJSON(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable – ignore */
  }
}

export const dayKey = (d = new Date()) => d.toLocaleDateString("en-CA"); // YYYY-MM-DD, local time

// ---------- levels: XP is the leaderboard score earned from uploads ----------
export const LEVELS = [
  { xp: 0, title: "Fresher" },
  { xp: 30, title: "Note Taker" },
  { xp: 80, title: "Study Buddy" },
  { xp: 150, title: "Rising Star" },
  { xp: 250, title: "Topper in Making" },
  { xp: 400, title: "Exam Ninja" },
  { xp: 600, title: "Scholar" },
  { xp: 900, title: "Legend" },
];

export function levelFor(xp = 0) {
  let i = 0;
  LEVELS.forEach((l, idx) => {
    if (xp >= l.xp) i = idx;
  });
  const cur = LEVELS[i];
  const next = LEVELS[i + 1];
  return {
    level: i + 1,
    title: cur.title,
    xp,
    nextTitle: next?.title,
    toNext: next ? next.xp - xp : 0,
    progress: next ? (xp - cur.xp) / (next.xp - cur.xp) : 1,
  };
}

// ---------- daily activity + streak ----------
function seedDemoActivity() {
  const days = {};
  for (let i = 1; i < 35; i++) {
    if (Math.random() < 0.72) days[dayKey(new Date(Date.now() - i * 86400000))] = Math.round(10 + Math.random() * 110);
  }
  return days;
}

export function getActivity() {
  let act = readJSON("pt_activity", null);
  if (!act) {
    act = DEMO_MODE ? seedDemoActivity() : {};
    writeJSON("pt_activity", act);
  }
  return act;
}

export function addActivity(minutes) {
  const act = getActivity();
  const k = dayKey();
  act[k] = (act[k] || 0) + minutes;
  writeJSON("pt_activity", act);
}

function computeStreak() {
  const act = getActivity();
  const today = dayKey();
  if (!act[today]) {
    act[today] = 1; // visiting counts as showing up
    writeJSON("pt_activity", act);
  }
  let count = 0;
  for (let i = 0; i < 365; i++) {
    if (act[dayKey(new Date(Date.now() - i * 86400000))]) count++;
    else break;
  }
  const best = Math.max(readJSON("pt_best_streak", 0), count);
  writeJSON("pt_best_streak", best);
  return { count, best };
}

export function useStreak() {
  const [streak] = useState(computeStreak);
  return streak;
}

// ---------- badges ----------
export function computeBadges({
  contributions = 0,
  rank = null,
  resultsCount = 0,
  streak = 0,
  focusMinutes = 0,
  posts = 0,
  readiness = 0,
}) {
  return [
    { id: "first", label: "First Upload", desc: "Share your first material", icon: Upload, earned: contributions >= 1, color: "from-cyan-400 to-blue-600" },
    { id: "library", label: "Librarian", desc: "Upload 10 materials", icon: Library, earned: contributions >= 10, color: "from-violet-400 to-indigo-600" },
    { id: "podium", label: "Podium", desc: "Reach the top 3", icon: Crown, earned: !!rank && rank <= 3, color: "from-amber-300 to-orange-600" },
    { id: "fire", label: "On Fire", desc: "3-day study streak", icon: Flame, earned: streak >= 3, color: "from-orange-400 to-rose-600" },
    { id: "focus", label: "Deep Focus", desc: "100 focus minutes", icon: Timer, earned: focusMinutes >= 100, color: "from-emerald-400 to-teal-600" },
    { id: "tracker", label: "Self Tracker", desc: "Log 3 exam results", icon: LineChart, earned: resultsCount >= 3, color: "from-sky-400 to-cyan-600" },
    { id: "voice", label: "Community Voice", desc: "Start a discussion", icon: MessagesSquare, earned: posts >= 1, color: "from-pink-400 to-fuchsia-600" },
    { id: "ready", label: "Exam Ready", desc: "Reach 80% readiness", icon: Rocket, earned: readiness >= 80, color: "from-lime-300 to-emerald-600" },
  ];
}

// ---------- tip of the day ----------
const TIPS = [
  "Teach a topic out loud to an imaginary friend – gaps in your understanding show up fast.",
  "Solve one previous-year paper under a real timer this week. Exam stamina is a skill.",
  "Revise within 24 hours of a lecture. It's the cheapest way to beat the forgetting curve.",
  "Turn every heading in your notes into a question, then answer it without looking.",
  "Mix subjects in one session (interleaving). It feels harder but sticks better.",
  "Sleep is part of studying – memories consolidate overnight.",
  "Start with the topic you're avoiding. Ten minutes in, it's never as bad as it looked.",
  "Make a one-page cheatsheet per unit. Writing it is the revision.",
  "Use 25-minute focus sprints with 5-minute breaks. Phone in another room.",
  "Before an exam, scan the whole paper first and do the questions you're sure of.",
  "Explain your wrong answers to yourself. Mistakes you understand don't repeat.",
  "Study with a friend once a week – the Forum is a great place to find one.",
];

export function tipOfTheDay() {
  const start = new Date(new Date().getFullYear(), 0, 0);
  const day = Math.floor((Date.now() - start) / 86400000);
  return TIPS[day % TIPS.length];
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}
