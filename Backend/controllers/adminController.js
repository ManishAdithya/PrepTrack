import User from "../models/User.js";
import Material from "../models/Material.js";
import { scopeOf } from "../config/community.js";

// Dashboard numbers for a CR — their own branch + batch only
export const getAdminStats = async (req, res) => {
  try {
    const scope = scopeOf(req.user);

    // Total uploads and approval statuses
    const totalUploads = await Material.countDocuments(scope);
    const approved = await Material.countDocuments({ ...scope, status: "approved" });
    const pending = await Material.countDocuments({ ...scope, status: "pending" });
    const rejected = await Material.countDocuments({ ...scope, status: "rejected" });

    // Active uploaders (distinct users who uploaded)
    const activeUploaders = await Material.distinct("uploadedBy", scope);

    // Total blocked users
    const blocked = await User.countDocuments({ ...scope, status: "blocked" });

    // Uploads grouped by branch (just the CR's own group now)
    const uploadsByBranch = await Material.aggregate([
      { $match: scope },
      { $group: { _id: "$branch", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.status(200).json({
      totalVerified: approved,
      activeUploaders: activeUploaders.length,
      pending,
      rejected,
      blocked,
      branchData: uploadsByBranch,
      approvalRate: totalUploads
        ? Math.round((approved / totalUploads) * 100)
        : 0,
    });
  } catch (err) {
    console.error("Admin Stats Error:", err);
    res.status(500).json({ message: "Error fetching admin statistics" });
  }
};
