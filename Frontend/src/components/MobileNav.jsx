import React from "react";
import { NavLink } from "react-router-dom";

// Bottom tab bar for phones (the sidebar is hidden below md).
// Full-width, solid, and padded for the iPhone home indicator.
export default function MobileNav({ links }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-ink-900 md:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end ?? true} className="flex-1">
            {({ isActive }) => (
              <div
                className={`relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-semibold ${
                  isActive ? "text-accent" : "text-zinc-500"
                }`}
              >
                {isActive && <span className="absolute top-0 h-[3px] w-8 rounded-b bg-accent" />}
                <l.icon size={21} strokeWidth={isActive ? 2.4 : 2} />
                <span>{l.short || l.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
