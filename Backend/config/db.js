// config/db.js
import mongoose from "mongoose";

// One shared connection. On Vercel each warm function instance reuses it between requests
// instead of opening a new connection every time.
let connecting = null;

const connectDB = async () => {
  if (mongoose.connection.readyState === 1) return mongoose.connection;
  if (!connecting) {
    if (!process.env.MONGO_URI) throw new Error("MONGO_URI is not set");
    connecting = mongoose
      .connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 10000 })
      .then((m) => {
        console.log("✅ MongoDB Connected");
        return m.connection;
      })
      .catch((err) => {
        connecting = null; // let the next request try again
        console.error("❌ MongoDB Connection Failed", err.message);
        throw err;
      });
  }
  return connecting;
};

export default connectDB;
