import React from "react";

// Neutral greys only (colour is reserved for meaning); a few shades so people are still easy to tell apart
const gradients = ["bg-zinc-700", "bg-zinc-600", "bg-ink-600", "bg-stone-600", "bg-neutral-700"];

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
      className={`grid shrink-0 place-items-center rounded-full ${g} font-display font-bold text-white ${
 ring ? "ring-2 ring-white/20 ring-offset-2 ring-offset-ink-900" : ""
      } ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
      title={name}
    >
      {initials(name)}
    </div>
  );
}
