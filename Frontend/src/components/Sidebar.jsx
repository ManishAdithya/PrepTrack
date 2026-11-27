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
} from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import NavSidebar from "./NavSidebar.jsx";

export const studentSections = [
  {
    title: "Learn",
    links: [
      { to: "/", label: "Dashboard", icon: LayoutDashboard },
      { to: "/resources", label: "Study Materials", icon: BookOpen },
      { to: "/discussions", label: "Forum", icon: MessagesSquare, end: false },
    ],
  },
  {
    title: "Grow",
    links: [
      { to: "/progress", label: "Progress", icon: TrendingUp },
      { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
      { to: "/profile", label: "Profile", icon: User },
    ],
  },
];

function LevelCard() {
  const { level, xp } = useGame();
  return (
    <Link
      to="/profile"
      className="relative block overflow-hidden rounded-2xl border border-violet-400/20 bg-gradient-to-br from-violet-600/25 via-fuchsia-600/10 to-cyan-500/10 p-4 transition hover:border-violet-400/40"
    >
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full bg-fuchsia-500/30 blur-2xl" />
      <div className="relative flex items-center justify-between">
        <div className="text-xs font-semibold uppercase tracking-wider text-violet-200/80">Level {level.level}</div>
        <div className="flex items-center gap-1 text-xs font-bold text-amber-200">
          <Sparkles size={12} /> {xp} XP
        </div>
      </div>
      <div className="relative mt-1 font-display text-base font-bold text-white">{level.title}</div>
      <div className="relative mt-3 h-2 overflow-hidden rounded-full bg-white/10">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-cyan-300"
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(level.progress * 100)}%` }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        />
      </div>
      <div className="relative mt-2 text-[11px] text-slate-400">
        {level.nextTitle ? `${level.toNext} XP to ${level.nextTitle}` : "Max level reached 👑"}
      </div>
    </Link>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  return <NavSidebar sections={studentSections} subtitle="Student portal" footer={<LevelCard />} onLogout={logout} />;
}
