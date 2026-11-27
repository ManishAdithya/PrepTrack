import { Link } from "react-router-dom";
import React from "react";
import { LayoutDashboard, FolderOpenDot, Users, Megaphone, BarChart3, GraduationCap, CalendarClock } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import NavSidebar from "../NavSidebar.jsx";

export const adminSections = [
  {
    title: "Overview",
    links: [
      { to: "/admin", label: "Dashboard", short: "Home", icon: LayoutDashboard },
      { to: "/admin/content", label: "Content Review", short: "Review", icon: FolderOpenDot },
      { to: "/admin/exams", label: "Exams", icon: CalendarClock },
      { to: "/admin/students", label: "Students", icon: Users },
    ],
  },
  {
    title: "Manage",
    links: [
      { to: "/admin/announcements", label: "Announcements", short: "News", icon: Megaphone },
      { to: "/admin/leaderboard", label: "Leaderboard", short: "Ranks", icon: BarChart3 },
    ],
  },
];

export default function AdminSidebar() {
  const { logout } = useAuth();
  return (
    <NavSidebar
      sections={adminSections}
      subtitle="CR portal"
      onLogout={logout}
      layoutId="admin-nav-active"
      footer={
        <Link to="/" className="flex items-center gap-3 rounded-lg border border-white/[0.08] px-3 py-2.5 text-sm font-medium text-zinc-200 hover:border-white/20">
          <GraduationCap size={17} className="text-accent" /> Switch to student view
        </Link>
      }
    />
  );
}
