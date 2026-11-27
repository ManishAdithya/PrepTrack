import React from "react";

const gradients = [
  "from-violet-500 to-fuchsia-500",
  "from-cyan-400 to-blue-600",
  "from-emerald-400 to-teal-600",
  "from-amber-400 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-indigo-400 to-violet-700",
  "from-lime-400 to-emerald-600",
  "from-sky-400 to-indigo-600",
];

function hash(str = "") {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function initials(name = "") {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  return (parts[0][0] + (parts.length > 1 ? parts[parts.length - 1][0] : "")).toUpperCase();
}

export default function Avatar({ name = "", size = 40, className = "", ring = false }) {
  const g = gradients[hash(name) % gradients.length];
  return (
    <div
      className={`grid shrink-0 place-items-center rounded-full bg-gradient-to-br ${g} font-display font-bold text-white shadow-lg ${
        ring ? "ring-2 ring-white/20 ring-offset-2 ring-offset-ink-900" : ""
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
