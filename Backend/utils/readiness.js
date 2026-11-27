// How PrepTrack turns marks into "readiness" — kept in one place so it's easy to explain and change.
//
// 1. Subject readiness = weighted average of every result logged for that subject.
//    Newer results count more: latest x1, the one before x0.7, then x0.49, ... (each older one x0.7).
//    So one bad test lowers a subject, but doesn't wipe out everything you did before.
// 2. Overall readiness = plain average of all subjects that have at least one result.
//    One subject can never stand in for the others.
// 3. Band: Strong (75%+), On track (60–74%), Needs work (below 60%).
// 4. Confidence is NOT calculated — it is how sure the student feels about a subject (High/Medium/Low),
//    set by themselves. We compare it with their marks to flag over- or under-confidence.

export const DECAY = 0.7;
export const BANDS = [
  { min: 75, label: "Strong" },
  { min: 60, label: "On track" },
  { min: 0, label: "Needs work" },
];
export const bandOf = (pct) => (pct == null ? null : BANDS.find((b) => pct >= b.min).label);

// The old `confidence` field on Progress (High/Medium/Low) now mirrors the readiness band
const LEGACY = { Strong: "High", "On track": "Medium", "Needs work": "Low" };

const key = (s) => String(s || "").trim().toLowerCase();

export function computeReadiness(results = [], prepSubjects = []) {
  // group results by subject, newest first
  const bySubject = new Map();
  for (const r of results) {
    const k = key(r.subject);
    if (!k) continue;
    if (!bySubject.has(k)) bySubject.set(k, { subject: String(r.subject).trim(), results: [] });
    bySubject.get(k).results.push(r);
  }

  const subjects = [];
  for (const { subject, results: rs } of bySubject.values()) {
    rs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt));
    let sum = 0;
    let weights = 0;
    rs.forEach((r, i) => {
      const w = DECAY ** i;
      sum += w * r.percentage;
      weights += w;
    });
    subjects.push({ subject, readiness: Math.round(sum / weights), results: rs.length, latest: rs[0].percentage });
  }

  // attach the student's own confidence (from their exam plan) and flag mismatches
  for (const p of prepSubjects) {
    const s = subjects.find((x) => key(x.subject) === key(p.subject));
    if (!s) continue;
    s.confidence = p.confidence;
    if (p.confidence === "High" && s.readiness < 60) s.check = "overconfident";
    else if (p.confidence === "Low" && s.readiness >= 75) s.check = "underconfident";
  }

  subjects.sort((a, b) => a.readiness - b.readiness); // weakest first
  const overall = subjects.length ? Math.round(subjects.reduce((t, s) => t + s.readiness, 0) / subjects.length) : null;
  for (const s of subjects) s.band = bandOf(s.readiness);

  return { overall, band: bandOf(overall), subjects };
}

// Keep the stored summary on the Progress document in sync (used by CR pages and the leaderboard)
export const storedSummary = ({ overall, band }) => ({
  progressPercent: overall ?? 0,
  confidence: LEGACY[band] || "Medium",
  lastUpdated: Date.now(),
});
