import React from "react";
import { NavLink } from "react-router-dom";
import { motion } from "framer-motion";

// Bottom tab bar for phones (the sidebar is hidden below md)
export default function MobileNav({ links }) {
  return (
    <nav className="fixed inset-x-3 bottom-3 z-40 md:hidden">
      <div className="glass-strong flex items-center justify-around !rounded-2xl px-1 py-1.5">
        {links.map((l) => (
          <NavLink key={l.to} to={l.to} end={l.end ?? true} className="relative flex-1">
            {({ isActive }) => (
              <div className={`relative flex flex-col items-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold ${isActive ? "text-white" : "text-slate-500"}`}>
                {isActive && (
                  <motion.span
                    layoutId="mobile-active"
                    className="absolute inset-0 rounded-xl bg-gradient-to-b from-violet-500/30 to-fuchsia-500/10"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <l.icon size={19} className="relative" />
                <span className="relative">{l.short || l.label}</span>
              </div>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
