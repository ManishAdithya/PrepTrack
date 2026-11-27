import React from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Zap } from "lucide-react";

// Logo: black bolt on an electric-yellow tile + bold wordmark
export function Brand({ subtitle = "", compact = false }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-accent">
        <Zap size={19} className="text-black" fill="currentColor" strokeWidth={1.5} />
      </div>
      {!compact && (
        <div className="leading-tight">
          <div className="font-display text-lg font-bold uppercase tracking-wide text-white">PrepTrack</div>
          {subtitle && <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-500">{subtitle}</div>}
        </div>
      )}
    </div>
  );
}

// Shared desktop sidebar for the student and admin portals
export default function NavSidebar({ sections, subtitle, footer, onLogout }) {
  return (
    <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-white/[0.06] bg-ink-900 md:flex">
      <div className="flex h-16 items-center px-5">
        <Brand subtitle={subtitle} />
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.title}>
            <div className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-zinc-600">
              {section.title}
            </div>
            <div className="space-y-0.5">
              {section.links.map((l) => (
                <NavLink
                  key={l.to}
                  to={l.to}
                  end={l.end ?? true}
                  className={({ isActive }) =>
                    `relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive ? "bg-white/[0.06] text-white" : "text-zinc-400 hover:bg-white/[0.03] hover:text-white"
                    }`
                  }
                >
                  {({ isActive }) => (
                    <>
                      {isActive && <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r bg-accent" />}
                      <l.icon size={17} className={isActive ? "text-accent" : ""} />
                      <span>{l.label}</span>
                      {l.badge && (
                        <span className="ml-auto rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-black">{l.badge}</span>
                      )}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="space-y-2 border-t border-white/[0.06] p-3">
        {footer}
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition hover:bg-rose-500/10 hover:text-rose-300"
        >
          <LogOut size={17} />
          Log out
        </button>
      </div>
    </aside>
  );
}
