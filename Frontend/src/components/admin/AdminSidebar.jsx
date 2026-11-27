import React from "react";
import { LayoutDashboard, FolderOpenDot, Users, Megaphone, Shield, GitBranch, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import NavSidebar from "../NavSidebar.jsx";

export const adminSections = [
  {
    title: "Overview",
    links: [
      { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
      { to: "/admin/content", label: "Content Review", icon: FolderOpenDot },
      { to: "/admin/students", label: "Students", icon: Users },
    ],
  },
  {
    title: "Manage",
    links: [
      { to: "/admin/leaderboard", label: "Leaderboard", icon: BarChart3 },
      { to: "/admin/announcements", label: "Announcements", icon: Megaphone },
      { to: "/admin/security", label: "Security Logs", icon: Shield },
      { to: "/admin/branches", label: "Branches", icon: GitBranch },
    ],
  },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  return (
    <NavSidebar
      sections={adminSections}
      subtitle="Admin console"
      onLogout={logout}
      layoutId="admin-nav-active"
      footer={
        <div className="rounded-2xl border border-cyan-400/20 bg-gradient-to-br from-cyan-500/15 to-violet-500/10 p-4 text-xs text-slate-300">
          <div className="mb-1 font-display text-sm font-semibold text-white">Keep it clean ✨</div>
          Approved materials go live for students on their release date.
        </div>
      }
    />
  );
}
