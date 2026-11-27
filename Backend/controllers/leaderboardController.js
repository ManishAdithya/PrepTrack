import Leaderboard from "../models/Leaderboard.js";
import { idsInScope, userInScope } from "../utils/scope.js";

// GET /api/leaderboard — students see only their own class.
// Students who chose to hide their name appear as "Hidden classmate" to everyone else (they keep their rank).
// `isMe` marks the caller's own row, so the app never has to match people by name.
export const getLeaderboard = async (req, res) => {
  try {
    const data = await Leaderboard.find({ studentId: { $in: await idsInScope(req.user) } })
      .populate("studentId", "name branch hideFromLeaderboard")
      .sort({ score: -1 });

    const formatted = data.map((entry, index) => {
      const s = entry.studentId;
      const isMe = String(s?._id) === String(req.user.id);
      const hidden = !!s?.hideFromLeaderboard && !isMe;
      return {
        name: hidden ? "Hidden classmate" : s?.name || "Unknown",
        hidden,
        isMe,
        branch: s?.branch || "—",
        contributions: entry.contributions || 0,
        score: entry.score || 0,
        rank: index + 1,
      };
    });

    res.status(200).json(formatted);
  } catch (err) {
    console.error("Get Leaderboard Error:", err);
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

// POST /api/leaderboard/update — a CR adjusts points of a student in their batch
export const updateLeaderboard = async (req, res) => {
  try {
    const { studentId, points } = req.body;
    if (!Number.isFinite(Number(points))) {
      return res.status(400).json({ message: "Points must be a number" });
    }

    if (!(await userInScope(studentId, req.user))) {
      return res.status(404).json({ message: "User not found" });
    }

    const entry = await Leaderboard.findOneAndUpdate(
      { studentId },
      { $inc: { score: Number(points), contributions: 1 } },
      { upsert: true, new: true }
    ).populate("studentId", "name branch");

    res.status(200).json({
      message: "Leaderboard updated successfully",
      entry,
    });
  } catch (err) {
    console.error("Update Leaderboard Error:", err);
    res.status(500).json({ message: "Error updating leaderboard" });
  }
};

// GET /api/leaderboard/admin — a CR's dashboard, their batch only
export const getAdminLeaderboard = async (req, res) => {
  try {
    const data = await Leaderboard.find({ studentId: { $in: await idsInScope(req.user) } })
      .populate("studentId", "name email branch batch createdAt")
      .sort({ score: -1 });

    res.status(200).json(data);
  } catch (err) {
    console.error("Get Admin Leaderboard Error:", err);
    res.status(500).json({ message: "Error fetching admin leaderboard" });
  }
};

// PUT /api/leaderboard/flag — a CR flags a student in their batch
export const flagUser = async (req, res) => {
  try {
    const { studentId, flagged } = req.body;

    if (!(await userInScope(studentId, req.user))) {
      return res.status(404).json({ message: "User not found in leaderboard" });
    }

    const entry = await Leaderboard.findOneAndUpdate(
      { studentId },
      { flagged: !!flagged },
      { new: true }
    );

    if (!entry) {
      return res.status(404).json({ message: "User not found in leaderboard" });
    }

    res.status(200).json({ message: "User flag status updated", entry });
  } catch (err) {
    console.error("Flag User Error:", err);
    res.status(500).json({ message: "Error flagging user" });
  }
};
