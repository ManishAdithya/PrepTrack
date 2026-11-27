import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  rollNumber: { type: String, index: true }, // students sign in with this; one account per roll number
  branch: String,
  batch: Number, // joining year from the roll number (AM.EN.U4EEE24140 -> 2024)
  password: String,
  role: { type: String, enum: ["student", "admin"], default: "student" },

  // The person running PrepTrack: sees the owner dashboard (platform-wide totals). Set with `npm run make-owner`.
  isOwner: { type: Boolean, default: false },

  // Leaderboard privacy: when true, classmates see "Hidden classmate" instead of the name
  hideFromLeaderboard: { type: Boolean, default: false },

  // Set when a CR resets the password; the app asks for a new password on next login
  mustChangePassword: { type: Boolean, default: false },

  // Brute-force protection: too many wrong passwords lock the account for a while
  failedLogins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null },
});

export default mongoose.model("User", userSchema);
