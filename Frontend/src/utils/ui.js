import { FileText, Presentation, FileQuestion, LogIn, AlertTriangle, KeyRound, Ban, UserCog } from "lucide-react";

export const materialTypes = {
  note: {
    label: "Notes",
    icon: FileText,
    gradient: "from-cyan-400 to-blue-600",
    chip: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200",
    glow: "rgba(34,211,238,0.16)",
  },
  ppt: {
    label: "Slides",
    icon: Presentation,
    gradient: "from-amber-300 to-orange-600",
    chip: "border-amber-300/25 bg-amber-300/10 text-amber-200",
    glow: "rgba(251,191,36,0.16)",
  },
  pyq: {
    label: "PYQs",
    icon: FileQuestion,
    gradient: "from-fuchsia-400 to-violet-600",
    chip: "border-fuchsia-400/25 bg-fuchsia-400/10 text-fuchsia-200",
    glow: "rgba(232,121,249,0.16)",
  },
};

export const typeOf = (t) => materialTypes[t] || materialTypes.note;

export const confidenceStyles = {
  High: { chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200", bar: "from-emerald-400 to-teal-400", text: "text-emerald-300", value: 90 },
  Medium: { chip: "border-amber-300/25 bg-amber-300/10 text-amber-200", bar: "from-amber-300 to-orange-400", text: "text-amber-300", value: 60 },
  Low: { chip: "border-rose-400/25 bg-rose-400/10 text-rose-200", bar: "from-rose-400 to-pink-500", text: "text-rose-300", value: 30 },
};

export const confidenceOf = (c) => confidenceStyles[c] || confidenceStyles.Medium;

export const statusStyles = {
  pending: { label: "Pending review", chip: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  approved: { label: "Approved", chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  revision: { label: "Needs revision", chip: "border-sky-400/25 bg-sky-400/10 text-sky-200" },
  rejected: { label: "Rejected", chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  reported: { label: "Reported", chip: "border-orange-400/30 bg-orange-500/10 text-orange-200" },
};

export const approvedByLabels = {
  moderator: "Approved by moderators",
  community: "Approved by classmates",
  trusted: "Trusted uploader",
};

export const eventStyles = {
  "Login Success": { icon: LogIn, chip: "border-emerald-400/25 bg-emerald-400/10 text-emerald-200" },
  "Login Failure": { icon: AlertTriangle, chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  "Password Reset": { icon: KeyRound, chip: "border-amber-300/25 bg-amber-300/10 text-amber-200" },
  "Account Lock": { icon: Ban, chip: "border-rose-400/25 bg-rose-400/10 text-rose-200" },
  "Admin Action": { icon: UserCog, chip: "border-cyan-400/25 bg-cyan-400/10 text-cyan-200" },
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
