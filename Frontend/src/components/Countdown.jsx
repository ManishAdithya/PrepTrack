import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

function Digit({ value, label }) {
  const v = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative grid h-16 w-16 place-items-center overflow-hidden rounded-2xl border border-white/10 bg-white/[0.05] sm:h-20 sm:w-20">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={v}
            initial={{ y: -24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="font-display text-3xl font-bold tabular-nums text-white sm:text-4xl"
          >
            {v}
          </motion.span>
        </AnimatePresence>
        <div className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-black/30" />
      </div>
      <div className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-slate-400">{label}</div>
    </div>
  );
}

// Live ticking countdown to an exam date
export default function Countdown({ date }) {
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const diff = Math.max(0, new Date(date) - now);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);

  return (
    <div className="flex items-start gap-2 sm:gap-3">
      <Digit value={days} label="days" />
      <span className="mt-5 font-display text-2xl text-slate-600 sm:mt-6">:</span>
      <Digit value={hours} label="hours" />
      <span className="mt-5 font-display text-2xl text-slate-600 sm:mt-6">:</span>
      <Digit value={mins} label="mins" />
      <span className="mt-5 hidden font-display text-2xl text-slate-600 sm:mt-6 sm:inline">:</span>
      <div className="hidden sm:block">
        <Digit value={secs} label="secs" />
      </div>
    </div>
  );
}
