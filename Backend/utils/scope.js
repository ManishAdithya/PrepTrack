import mongoose from "mongoose";
import User from "../models/User.js";
import { scopeOf } from "../config/community.js";

// IDs of every account in the user's branch + batch (as ObjectIds)
export async function idsInScope(user) {
  return User.find(scopeOf(user)).distinct("_id");
}

// The account `id` if it is in the same branch + batch as `user`, otherwise null
export async function userInScope(id, user) {
  if (!mongoose.isValidObjectId(id)) return null;
  return User.findOne({ _id: id, ...scopeOf(user) });
}
