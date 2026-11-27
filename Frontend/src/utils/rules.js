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
