import React from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

// Student pages: every signed-in account. A CR is also a student, so they can open
// their own dashboard, notes, progress and profile too (they switch from the CR portal).
export function RequireStudent() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.needsDisplayName) return <Navigate to="/welcome" replace />;
  return <Outlet />;
}

// CR (admin) pages
export function RequireAdmin() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (user.needsDisplayName) return <Navigate to="/welcome" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return <Outlet />;
}

// Any signed-in account (used for the change-password page)
export function RequireLogin() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

// Owner dashboard: owner accounts only (the server checks too)
export function RequireOwner() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  if (!user.isOwner) return <Navigate to="/" replace />;
  return <Outlet />;
}
