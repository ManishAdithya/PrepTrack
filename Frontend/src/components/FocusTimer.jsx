import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Timer, Play, Pause, RotateCcw } from "lucide-react";
import { MODES, formatClock, useFocus } from "../context/FocusContext.jsx";
import ProgressRing from "./ui/ProgressRing.jsx";
import Segmented from "./ui/Segmented.jsx";

// Big timer face, used in the topbar popover and on the dashboard
export function FocusFace({ size = 190 }) {
  const f = useFocus();
  const pct = ((f.total - f.secondsLeft) / f.total) * 100;
  const isBreak = f.mode !== "focus";

  return (
    <div className="flex flex-col items-center gap-5">
      <Segmented
        size="sm"
        value={f.mode}
        onChange={f.switchMode}
        options={Object.entries(MODES).map(([value, m]) => ({ value, label: m.short }))}
      />
      <ProgressRing
        value={pct}
        size={size}
        stroke={10}
        from={isBreak ? "#34d399" : "#FFD60A"}
        to={isBreak ? "#34d399" : "#FFD60A"}
      >
        <div>
          <div className="font-display text-4xl font-bold tabular-nums text-white">{formatClock(f.secondsLeft)}</div>
          <div className="mt-1 text-xs text-zinc-400">{f.running ? (isBreak ? "Recharging…" : "Stay in the zone") : "Paused"}</div>
        </div>
      </ProgressRing>
      <div className="flex items-center gap-2">
        {f.running ? (
          <button onClick={f.pause} className="btn-ghost w-32">
            <Pause size={16} /> Pause
          </button>
        ) : (
          <button onClick={f.start} className="btn-primary w-32">
            <Play size={16} /> Start
          </button>
        )}
        <button onClick={f.reset} className="btn-ghost px-3" aria-label="Reset timer">
          <RotateCcw size={16} />
        </button>
      </div>
      <div className="grid w-full grid-cols-2 gap-2 text-center">
        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
          <div className="font-display text-lg font-bold text-white">{f.stats.minutesToday}</div>
          <div className="text-[11px] text-zinc-400">minutes today</div>
        </div>
        <div className="rounded-xl bg-white/[0.04] px-3 py-2">
          <div className="font-display text-lg font-bold text-white">{f.stats.sessionsToday}</div>
          <div className="text-[11px] text-zinc-400">sessions today</div>
        </div>
      </div>
    </div>
  );
}

// Compact chip in the topbar that opens the timer
export default function FocusChip() {
  const f = useFocus();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex h-10 items-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
 f.running
 ? "border-accent/40 bg-accent/15 text-accent shadow-glow"
            : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10 hover:text-white"
        }`}
      >
        {f.running ? (
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-accent" />
          </span>
        ) : (
          <Timer size={16} />
        )}
        <span className="tabular-nums">{f.running ? formatClock(f.secondsLeft) : "Focus"}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-0 top-12 z-50 w-80 !rounded-2xl p-5"
          >
            <FocusFace size={170} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
