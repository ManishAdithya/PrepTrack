import React, { useId } from "react";
import { motion } from "framer-motion";

// Pill tabs with a sliding highlight. On narrow screens the row scrolls sideways instead of overflowing.
export default function Segmented({ options, value, onChange, className = "", size = "md" }) {
  const id = useId();
  const pad = size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm";

  return (
    <div
      className={`inline-flex max-w-full overflow-x-auto rounded-xl border border-white/10 bg-ink-900 p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {options.map((o) => {
        const opt = typeof o === "string" ? { value: o, label: o } : o;
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`relative flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg font-semibold transition-colors ${pad} ${
              active ? "text-black" : "text-zinc-400 hover:text-white"
            }`}
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-lg bg-accent"
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
              />
            )}
            <span className="relative flex items-center gap-1.5">
              {opt.icon && <opt.icon size={14} />}
              {opt.label}
              {opt.count != null && (
                <span className={`rounded-full px-1.5 text-[10px] ${active ? "bg-black/15" : "bg-white/10"}`}>{opt.count}</span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
