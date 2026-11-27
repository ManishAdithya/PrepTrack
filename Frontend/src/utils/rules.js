import { useEffect, useState } from "react";
import API from "../api";

// Mirrors Backend/config/community.js; the backend's values win once loaded
const DEFAULTS = { emailDomain: "", rollFormats: ["AM.EN.U4EEE24###"], branches: ["EEE"], trustedXp: 150, approveUpvotes: 5, hideReports: 5, maxUploadMb: 15 };
let cache = null;

// Community rules: who can sign up and when uploads are auto-approved / hidden
export function useRules() {
  const [rules, setRules] = useState(cache || DEFAULTS);

  useEffect(() => {
    if (cache) return;
    API.get("/auth/rules")
      .then(({ data }) => {
        cache = { ...DEFAULTS, ...data };
        setRules(cache);
      })
      .catch(() => {});
  }, []);

  return rules;
}

// Does the roll number match one of the allowed formats? (# = any digit). Mirrors the backend.
export function rollAllowed(roll, formats = DEFAULTS.rollFormats) {
  const r = String(roll || "").trim().toUpperCase();
  return formats.some((f) =>
    new RegExp("^" + f.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/#/g, "\\d") + "$").test(r)
  );
}

// An example roll number for a format: "AM.EN.U4EEE24###" -> "AM.EN.U4EEE24001"
export const exampleRoll = (format = DEFAULTS.rollFormats[0]) => format.replace(/#+$/, (h) => "1".padStart(h.length, "0")).replace(/#/g, "0");

// "AM.EN.U4EEE24140" -> "EEE"
export function branchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/([A-Z]{2,5})\d{5}$/);
  return m ? m[1] : null;
}

// "AM.EN.U4EEE24140" -> 2024 (joining batch). Mirrors batchFromRoll in Backend/config/community.js
export function batchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/[A-Z]{2,5}(\d{2})\d{3}$/);
  return m ? 2000 + Number(m[1]) : null;
}

// 2024 -> "3rd year" (the academic year starts in July)
export function yearOfStudy(batch, now = new Date()) {
  if (!batch) return "";
  const year = now.getFullYear() - batch + (now.getMonth() >= 6 ? 1 : 0);
  if (year < 1) return "Incoming";
  if (year > 4) return "Alumni";
  return `${year}${["st", "nd", "rd", "th"][year - 1]} year`;
}

// "EEE · 2024 batch (3rd year)"
export const batchLabel = (branch, batch) =>
  [branch, batch && `${batch} batch (${yearOfStudy(batch)})`].filter(Boolean).join(" · ");
