import Leaderboard from "../models/Leaderboard.js";
import { POINTS } from "../config/community.js";

// Give the uploader their leaderboard points the first time a material is approved.
// Mutates `material`; the caller saves it.
export async function awardApprovalPoints(material) {
  if (material.pointsAwarded || !material.uploaderId) return;

  await Leaderboard.findOneAndUpdate(
    { studentId: material.uploaderId },
    { $inc: { score: POINTS[material.type] || 10, contributions: 1 } },
    { upsert: true }
  );
  material.pointsAwarded = true;
}

export async function getScore(userId) {
  const entry = await Leaderboard.findOne({ studentId: userId });
  return entry?.score || 0;
}
