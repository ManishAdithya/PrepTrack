import React from "react";
import { Link } from "react-router-dom";
import { Search, Flame, FlaskConical } from "lucide-react";
import { useGame } from "../context/GameContext.jsx";
import { DEMO_MODE } from "../api";
import NotificationBell from "./NotificationBell.jsx";
import AccountMenu from "./AccountMenu.jsx";
import { Brand } from "./NavSidebar.jsx";

export function DemoBadge() {
  if (!DEMO_MODE) return null;
  return (
    <span
      className="hidden items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[11px] font-semibold text-accent lg:inline-flex"
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
      className="group flex h-10 w-full max-w-md items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-3 text-sm text-zinc-500 transition hover:border-accent/30 hover:bg-white/[0.07]"
    >
      <Search size={16} className="text-zinc-400 group-hover:text-accent" />
      <span className="hidden flex-1 text-left sm:inline">{label}</span>
      <kbd className="hidden rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold text-zinc-400 sm:inline">
        Ctrl K
      </kbd>
    </button>
  );
}

export default function Topbar({ onOpenSearch }) {
  const { streak } = useGame();

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/95">
      <div className="flex h-14 items-center gap-2 px-4 md:h-16 md:gap-3 md:px-8">
        <div className="md:hidden">
          <Brand compact />
        </div>

        <div className="hidden flex-1 md:block">
          <SearchButton onOpen={onOpenSearch} />
        </div>

        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <DemoBadge />
          <button onClick={onOpenSearch} className="grid h-10 w-10 place-items-center rounded-xl text-zinc-300 hover:bg-white/5 md:hidden" aria-label="Search">
            <Search size={19} />
          </button>

          {/* streak: desktop only, to keep the phone top bar simple */}
          <div
            className="hidden h-10 items-center gap-1.5 rounded-xl border border-white/10 px-3 text-sm font-bold text-white md:flex"
            title={`${streak.count}-day streak · best ${streak.best}`}
          >
            <Flame size={16} className="text-accent" />
            {streak.count}
            <span className="hidden font-medium text-zinc-400 lg:inline">day streak</span>
          </div>

          <NotificationBell />

          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
