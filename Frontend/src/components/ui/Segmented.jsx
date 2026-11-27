import React, { useId } from "react";
import { motion } from "framer-motion";

// Pill tabs with a sliding highlight
export default function Segmented({ options, value, onChange, className = "", size = "md" }) {
  const id = useId();
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div className={`inline-flex rounded-2xl border border-white/10 bg-white/[0.04] p-1 ${className}`}>
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex items-center gap-1.5 rounded-xl font-semibold transition-colors ${pad} ${
              active ? "text-white" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-gradient-to-r from-violet-600/90 to-fuchsia-600/90 shadow-glow"
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {opt.icon && <opt.icon size={14} />}
              {opt.label}
              {opt.count != null && (
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-white/20" : "bg-white/10"}`}>
                  {opt.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
