// Admins are the CRs of one branch + batch. authMiddleware already loaded the role from
// the database, so removing someone's CR role takes effect immediately.
// What an admin can see or change is limited to their own batch inside each controller.
export const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Access forbidden: CRs only" });
  }
  next();
};

// The owner dashboard: only accounts marked as owner. Everyone else gets "not found" so it isn't advertised.
export const ownerOnly = (req, res, next) => {
  if (!req.user?.isOwner) return res.status(404).json({ message: "Not found" });
  next();
};
