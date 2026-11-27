import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CalendarClock, MapPin } from "lucide-react";
import Countdown from "./Countdown.jsx";
import { examFacts, examWhen, relative, typeChip } from "../utils/exams.js";

const KEY = "pt_countdown_exam";
const readChoice = () => {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
};

// Live countdown to one of the CR-posted exams. The student taps any upcoming exam to count down to it;
// the choice is remembered on this device and falls back to the next exam once it has passed.
export function useCountdownChoice(exams) {
  const [chosen, setChosen] = useState(readChoice);
  const choose = (id) => {
    setChosen(id);
    try {
      localStorage.setItem(KEY, id);
    } catch {
      /* storage blocked */
    }
  };
  const live = exams.filter((e) => new Date(e.date) > Date.now());
  const current = live.find((e) => e._id === chosen) || live[0] || null;
  return { current, choose, live };
}

export default function ExamCountdown({ exams, current, choose }) {
  // re-render every minute so an exam that just started drops off
  const [, tick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 60000);
    return () => clearInterval(t);
  }, []);

  if (!current) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 bg-ink-800/60 p-5 text-sm text-zinc-400">
        <div className="flex items-center gap-2 font-semibold text-white">
          <CalendarClock size={17} className="text-accent" /> No upcoming exams
        </div>
        <p className="mt-1">When your CR posts an exam, a live countdown appears here.</p>
      </div>
    );
  }

  const live = exams.filter((e) => new Date(e.date) > Date.now());

  return (
    <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-ink-800">
      <div className="p-5 sm:p-6">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Countdown</div>
        <AnimatePresence mode="wait">
          <motion.div key={current._id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.18 }}>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <h2 className="font-display text-xl font-bold text-white sm:text-2xl">{current.subject}</h2>
              <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${typeChip(current.type)}`}>{current.type}</span>
            </div>
            <div className="mt-1 text-sm text-zinc-400">
              {examWhen(current.date)}
              {examFacts(current) && <span className="text-zinc-500"> · {examFacts(current)}</span>}
            </div>
            <div className="mt-5">
              <Countdown date={current.date} />
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* switch the countdown to another exam */}
      {live.length > 1 && (
        <div className="border-t border-white/[0.06] px-5 py-3 sm:px-6">
          <div className="mb-2 text-xs text-zinc-500">Count down to</div>
          <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {live.map((e) => {
              const on = e._id === current._id;
              return (
                <button
                  key={e._id}
                  onClick={() => choose(e._id)}
                  aria-pressed={on}
                  className={`shrink-0 rounded-xl border px-3 py-2 text-left transition ${
                    on ? "border-accent bg-accent text-black" : "border-white/10 text-zinc-300 hover:border-white/25"
                  }`}
                >
                  <div className="whitespace-nowrap text-xs font-bold">{e.subject}</div>
                  <div className={`whitespace-nowrap text-[11px] ${on ? "text-black/70" : "text-zinc-500"}`}>
                    {e.type} · {relative(e.date)}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// Full list of upcoming exams; tapping one shows its details and sets it as the countdown
export function UpcomingExams({ exams, current, choose }) {
  const [open, setOpen] = useState(null);
  if (!exams.length) return null;
  return (
    <ul className="divide-y divide-white/[0.06]">
      {exams.map((e) => {
        const d = new Date(e.date);
        const isCurrent = current?._id === e._id;
        const expanded = open === e._id;
        const soon = (d - Date.now()) / 86400000 <= 3;
        return (
          <li key={e._id}>
            <button onClick={() => setOpen(expanded ? null : e._id)} className="flex w-full items-start gap-3 p-4 text-left transition hover:bg-white/[0.03] sm:px-5" aria-expanded={expanded}>
              <div className={`w-12 shrink-0 rounded-xl py-1.5 text-center leading-tight ${soon ? "bg-rose-500/15 text-rose-300" : "bg-white/[0.05] text-white"}`}>
                <div className="font-display text-lg font-bold">{d.getDate()}</div>
                <div className="text-[10px] font-semibold uppercase tracking-wider opacity-70">{d.toLocaleDateString("en-IN", { month: "short" })}</div>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-semibold text-white">{e.subject}</span>
                  <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeChip(e.type)}`}>{e.type}</span>
                  {isCurrent && <span className="text-[11px] font-semibold text-accent">● counting down</span>}
                </div>
                <div className="mt-0.5 text-xs text-zinc-400">
                  {examWhen(e.date)} · <span className={soon ? "text-rose-300" : ""}>{relative(e.date)}</span>
                </div>
                {examFacts(e) && <div className="text-xs text-zinc-500">{examFacts(e)}</div>}
              </div>
            </button>

            {expanded && (
              <div className="space-y-3 px-4 pb-4 pl-[76px] text-sm sm:px-5 sm:pl-[80px]">
                {e.details ? <p className="whitespace-pre-line text-zinc-300">{e.details}</p> : <p className="text-zinc-500">No extra details from the CR.</p>}
                {e.venue && (
                  <p className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <MapPin size={13} /> {e.venue}
                  </p>
                )}
                <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-500">
                  {!isCurrent && (
                    <button onClick={() => choose(e._id)} className="btn-ghost !min-h-[34px] !px-3 !py-1.5 text-xs">
                      Count down to this
                    </button>
                  )}
                  {e.createdBy && <span>Posted by {e.createdBy}</span>}
                </div>
              </div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
