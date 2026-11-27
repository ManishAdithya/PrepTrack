import React from "react";
import { LayoutDashboard, FolderOpenDot, Users, Megaphone, Shield, GitBranch, BarChart3 } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import NavSidebar from "../NavSidebar.jsx";

export const adminSections = [
  {
    title: "Overview",
    links: [
      { to: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard },
      { to: "/admin/content", label: "Content Review", short: "Review", icon: FolderOpenDot },
      { to: "/admin/students", label: "Students", icon: Users },
    ],
  },
  {
    title: "Manage",
    links: [
      { to: "/admin/leaderboard", label: "Leaderboard", short: "Ranks", icon: BarChart3 },
      { to: "/admin/announcements", label: "Announcements", short: "News", icon: Megaphone },
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
        <div className="rounded-2xl border border-accent/20 bg-accent/15 p-4 text-xs text-zinc-300">
          <div className="mb-1 font-display text-sm font-semibold text-white">Keep it clean ✨</div>
          Approved materials go live for students on their release date.
        </div>
      }
    />
  );
}
