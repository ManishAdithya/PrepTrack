import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext.jsx";
import { UserProvider } from "./context/UserContext.jsx";
import { ToastProvider } from "./components/ui/Toast.jsx";
import { RequireStudent, RequireAdmin } from "./utils/guards.jsx";

import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";

// Student pages
import StudentLayout from "./layouts/StudentLayout.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Discussions from "./pages/Discussions.jsx";
import DiscussionDetail from "./pages/DiscussionDetail.jsx";
import Leaderboard from "./pages/Leaderboard.jsx";
import Profile from "./pages/Profile.jsx";
import Progress from "./pages/Progress.jsx";
import Resources from "./pages/Resources.jsx";

// Admin pages
import AdminLayout from "./layouts/AdminLayout.jsx";
import AdminDashboard from "./pages/admin/AdminDashboard.jsx";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard.jsx";
import AdminAnnouncements from "./pages/admin/AdminAnnouncements.jsx";
import AdminSecurityLogs from "./pages/admin/AdminSecurityLogs.jsx";
import AdminContent from "./pages/admin/AdminContent.jsx";
import AdminBranches from "./pages/admin/AdminBranches.jsx";
import AdminStudents from "./pages/admin/AdminStudents.jsx";

export default function App() {
  return (
    <AuthProvider>
      <UserProvider>
        <ToastProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* STUDENT ROUTES (protected) – the layout stays mounted while pages change */}
            <Route element={<RequireStudent />}>
              <Route element={<StudentLayout />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/resources" element={<Resources />} />
                <Route path="/discussions" element={<Discussions />} />
                <Route path="/discussions/:id" element={<DiscussionDetail />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/leaderboard" element={<Leaderboard />} />
                <Route path="/profile" element={<Profile />} />
              </Route>
            </Route>

            {/* ADMIN ROUTES (protected) */}
            <Route element={<RequireAdmin />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/students" element={<AdminStudents />} />
                <Route path="/admin/leaderboard" element={<AdminLeaderboard />} />
                <Route path="/admin/announcements" element={<AdminAnnouncements />} />
                <Route path="/admin/security" element={<AdminSecurityLogs />} />
                <Route path="/admin/branches" element={<AdminBranches />} />
              </Route>
            </Route>

            {/* fallback */}
            <Route path="*" element={<Navigate to="/login" replace />} />
          </Routes>
        </ToastProvider>
      </UserProvider>
    </AuthProvider>
  );
}
