import SecurityLog from "../models/SecurityLog.js";

// ====================
// ADD LOG (UTILITY)
// ====================
export const addSecurityLog = async (userId, eventType, ipAddress, details) => {
  try {
    console.log("🟦 ADDING SECURITY LOG:", { userId, eventType });

    const log = await SecurityLog.create({
      userId,
      eventType,
      ipAddress,
      details,
    });

    console.log("🟩 SECURITY LOG SAVED:", log._id);
  } catch (err) {
    console.error("❌ Error adding security log:", err.message);
  }
};
