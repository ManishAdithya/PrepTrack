import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  MessagesSquare,
  TrendingUp,
  Trophy,
  User,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import NavSidebar from "./NavSidebar.jsx";

export const studentSections = [
  {
    title: "Learn",
    links: [
      { to: "/", label: "Dashboard", short: "Home", icon: LayoutDashboard },
      { to: "/resources", label: "Study Materials", short: "Notes", icon: BookOpen },
      { to: "/discussions", label: "Forum", short: "Forum", icon: MessagesSquare, end: false },
    ],
  },
  {
    title: "Grow",
    links: [
      { to: "/progress", label: "Progress", short: "Progress", icon: TrendingUp },
      { to: "/leaderboard", label: "Leaderboard", short: "Ranks", icon: Trophy },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

function LevelCard() {
  const { level, xp } = useGame();
  return (
    <Link to="/profile" className="block rounded-xl border border-white/[0.08] bg-ink-800 p-3 transition hover:border-white/20">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold uppercase tracking-wider text-zinc-400">Level {level.level}</span>
        <span className="flex items-center gap-1 font-bold text-accent">
          <Sparkles size={12} /> {xp} XP
        </span>
      </div>
      <div className="mt-1 text-sm font-bold text-white">{level.title}</div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-accent" style={{ width: `${Math.round(level.progress * 100)}%` }} />
      </div>
      <div className="mt-1.5 text-[11px] text-zinc-500">
        {level.nextTitle ? `${level.toNext} XP to ${level.nextTitle}` : "Max level reached"}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const footer = (
    <>
      {/* a CR is also a student: they can jump back to the CR portal from here */}
      {user?.role === "admin" && (
        <Link to="/admin" className="flex items-center gap-3 rounded-lg border border-accent/30 px-3 py-2.5 text-sm font-medium text-white hover:bg-accent/10">
          <ShieldCheck size={17} className="text-accent" /> Open CR portal
        </Link>
      )}
      <LevelCard />
    </>
  );
  return <NavSidebar sections={studentSections} subtitle="Student portal" footer={footer} onLogout={logout} />;
}
