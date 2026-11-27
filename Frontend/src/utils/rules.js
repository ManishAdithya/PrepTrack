import { useEffect, useState } from "react";
import API from "../api";

// Mirrors Backend/config/community.js; the backend's values win once loaded
const DEFAULTS = { emailDomain: "", branches: ["CSE"], trustedXp: 150, approveUpvotes: 3, hideReports: 3 };
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

// "AM.SC.U4CSE23140" -> "CSE"
export function branchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/([A-Z]{2,5})\d{5}$/);
  return m ? m[1] : null;
}

// "AM.SC.U4CSE23140" -> 2023 (joining batch). Mirrors batchFromRoll in Backend/config/community.js
export function batchFromRoll(roll) {
  const m = String(roll || "").toUpperCase().match(/[A-Z]{2,5}(\d{2})\d{3}$/);
  return m ? 2000 + Number(m[1]) : null;
}

// 2023 -> "4th year" (the academic year starts in July)
export function yearOfStudy(batch, now = new Date()) {
  if (!batch) return "";
  const year = now.getFullYear() - batch + (now.getMonth() >= 6 ? 1 : 0);
  if (year < 1) return "Incoming";
  if (year > 4) return "Alumni";
  return `${year}${["st", "nd", "rd", "th"][year - 1]} year`;
}

// "CSE · 2023 batch (4th year)"
export const batchLabel = (branch, batch) =>
  [branch, batch && `${batch} batch (${yearOfStudy(batch)})`].filter(Boolean).join(" · ");
