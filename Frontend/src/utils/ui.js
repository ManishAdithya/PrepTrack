import { FileText, Presentation, FileQuestion, LogIn, AlertTriangle, KeyRound, Ban, UserCog } from "lucide-react";

export const materialTypes = {
  note: {
    label: "Notes",
    icon: FileText,
    gradient: "bg-white/[0.06]",
    chip: "border-accent/25 bg-accent/10 text-accent",
    glow: "rgba(34,211,238,0.16)",
  },
  ppt: {
    label: "Slides",
    icon: Presentation,
    gradient: "bg-white/[0.06]",
    chip: "border-accent/25 bg-accent/10 text-accent",
    glow: "rgba(251,191,36,0.16)",
  },
  pyq: {
    label: "PYQs",
    icon: FileQuestion,
    gradient: "bg-white/[0.06]",
    chip: "border-accent/25 bg-accent/10 text-accent",
    glow: "rgba(232,121,249,0.16)",
  },
};

export const typeOf = (t) => materialTypes[t] || materialTypes.note;

export const confidenceStyles = {
  High: { chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", bar: "bg-emerald-400 ", text: "text-emerald-300", value: 90 },
  Medium: { chip: "border-accent/25 bg-accent/10 text-accent", bar: "bg-accent ", text: "text-accent", value: 60 },
  Low: { chip: "border-rose-400/25 bg-rose-400/10 text-rose-200", bar: "bg-rose-400 ", text: "text-rose-300", value: 30 },
};

export const confidenceOf = (c) => confidenceStyles[c] || confidenceStyles.Medium;

export const statusStyles = {
  pending: { label: "Pending review", chip: "border-accent/25 bg-accent/10 text-accent" },
  approved: { label: "Approved", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  revision: { label: "Needs revision", chip: "border-accent/25 bg-accent/10 text-accent" },
  rejected: { label: "Rejected", chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  reported: { label: "Reported", chip: "border-accent/30 bg-accent/10 text-accent" },
};

export const approvedByLabels = {
  moderator: "Approved by moderators",
  community: "Approved by classmates",
  trusted: "Trusted uploader",
};

export const eventStyles = {
  "Login Success": { icon: LogIn, chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  "Login Failure": { icon: AlertTriangle, chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  "Password Reset": { icon: KeyRound, chip: "border-accent/25 bg-accent/10 text-accent" },
  "Account Lock": { icon: Ban, chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  "Admin Action": { icon: UserCog, chip: "border-accent/25 bg-accent/10 text-accent" },
};

export const daysUntil =(d) => Math.ceil((new Date(d) - Date.now()) / 86400000);

export const isNew = (d, days = 3) => d && Date.now() - new Date(d) < days * 86400000;

export const shortDate = (d) => {
  try {
    return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  } catch {
    return "N/A";
  }
};

export const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 86400 * 30) return `${Math.floor(s / 86400)}d ago`;
  return new Date(d).toLocaleDateString();
};

// Readiness bands (from marks, see Backend/utils/readiness.js): green = strong, white = on track, red = needs work
export const bandStyles = {
  Strong: { text: "text-emerald-400", bar: "bg-emerald-400", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" },
  "On track": { text: "text-white", bar: "bg-accent", chip: "border-white/15 bg-white/[0.06] text-zinc-200" },
  "Needs work": { text: "text-rose-400", bar: "bg-rose-400", chip: "border-rose-400/25 bg-rose-400/10 text-rose-300" },
};
export const bandOf = (b) => bandStyles[b] || { text: "text-zinc-400", bar: "bg-zinc-600", chip: "border-white/10 bg-white/[0.04] text-zinc-400" };
