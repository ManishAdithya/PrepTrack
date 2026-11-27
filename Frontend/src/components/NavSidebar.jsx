import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { LogOut, Target } from "lucide-react";

export function Brand({ subtitle = "Prep smarter" }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid h-10 w-10 place-items-center rounded-2xl bg-gradient-to-br from-violet-500 via-fuchsia-500 to-cyan-400 shadow-glow">
        <Target size={20} className="text-white" />
      </div>
      <div className="leading-tight">
        <div className="font-display text-xl font-bold text-white">
          Prep<span className="text-gradient">Track</span>
        </div>
        <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500">{subtitle}</div>
      </div>
    </div>
  );
}

// Shared desktop sidebar for the student and admin portals
export default function NavSidebar({ sections, subtitle, footer, onLogout, layoutId = "nav-active" }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-[270px] shrink-0 flex-col border-r border-white/[0.06] bg-ink-900/60 backdrop-blur-2xl md:flex">
      <div className="flex h-20 items-center px-6">
        <Brand subtitle={subtitle} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-2">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500">
              {section.title}
            </div>
            <div className="space-y-1">
              {section.links.map((l) => (
                <NavLink key={l.to} to={l.to} end={l.end ?? true} className="group relative block">
                  {({ isActive }) => (
                    <div
                      className={`relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                        isActive ? "text-white" : "text-slate-400 hover:text-slate-100"
                      }`}
                    >
                      {isActive && (
                        <motion.div
                          layoutId={layoutId}
                          className="absolute inset-0 rounded-xl border border-violet-400/20 bg-gradient-to-r from-violet-500/20 via-fuchsia-500/10 to-transparent"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        >
                          <span className="absolute left-0 top-1/2 h-5 w-1 -translate-y-1/2 rounded-r-full bg-gradient-to-b from-violet-400 to-cyan-300 shadow-[0_0_12px] shadow-violet-400" />
                        </motion.div>
                      )}
                      <span
                        className={`relative grid h-8 w-8 place-items-center rounded-lg transition ${
                          isActive
                            ? "bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-lg"
                            : "bg-white/[0.04] group-hover:bg-white/10"
                        }`}
                      >
                        <l.icon size={16} />
                      </span>
                      <span className="relative">{l.label}</span>
                      {l.badge && (
                        <span className="relative ml-auto rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold text-fuchsia-200">
                          {l.badge}
                        </span>
                      )}
                    </div>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-3 border-t border-white/[0.06] p-4">
        {footer}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-rose-500/10 hover:text-rose-200"
        >
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.04]">
            <LogOut size={16} />
          </span>
          Log out
        </button>
      </div>
    </aside>
  );
}
