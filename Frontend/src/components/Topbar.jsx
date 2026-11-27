import React from "react";
import { Link } from "react-router-dom";
import { Search, Flame, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { DEMO_MODE } from "../api";
import NotificationBell from "./NotificationBell.jsx";
import FocusChip from "./FocusTimer.jsx";
import Avatar from "./ui/Avatar.jsx";
import { Brand } from "./NavSidebar.jsx";

export function DemoBadge() {
  if (!DEMO_MODE) return null;
  return (
    <span
      className="hidden items-center gap-1 rounded-full border border-amber-300/30 bg-amber-300/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200 lg:inline-flex"
      title="Running with sample data (npm run demo)"
    >
      <FlaskConical size={12} /> Demo data
    </span>
  );
}

export function SearchButton({ onOpen, label = "Search notes, PYQs, pages…" }) {
  return (
    <button
      onClick={onOpen}
      className="group flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-slate-500 transition hover:border-violet-400/30 hover:bg-white/[0.07]"
    >
      <Search size={16} className="text-slate-400 group-hover:text-violet-300" />
      <span className="hidden flex-1 text-left sm:inline">{label}</span>
      <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}

export default function Topbar({ onOpenSearch }) {
  const { user } = useAuth();
  const { streak } = useGame();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/60 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <div className="md:hidden">
          <Brand subtitle="" />
        </div>

        <div className="hidden flex-1 md:block">
          <SearchButton onOpen={onOpenSearch} />
        </div>

        <div className="ml-auto flex items-center gap-2">
          <DemoBadge />
          <button onClick={onOpenSearch} className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 md:hidden" aria-label="Search">
            <Search size={18} />
          </button>

          <div
            className="flex h-10 items-center gap-1.5 rounded-xl border border-orange-400/20 bg-orange-500/10 px-3 text-sm font-bold text-orange-200"
            title={`${streak.count}-day streak · best ${streak.best}`}
          >
            <Flame size={16} className="animate-flicker text-orange-400" />
            {streak.count}
            <span className="hidden font-medium text-orange-200/70 lg:inline">day streak</span>
          </div>

          <div className="hidden sm:block">
            <FocusChip />
          </div>
          <NotificationBell />

          <Link to="/profile" className="ml-1 hidden items-center gap-3 rounded-xl py-1 pl-1 pr-3 transition hover:bg-white/5 md:flex">
            <Avatar name={user?.name || "Student"} size={36} />
            <div className="leading-tight">
              <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
              <div className="text-xs text-slate-400">{user?.branch || "—"}</div>
            </div>
          </Link>
        </div>
      </div>
    </header>
  );
}
