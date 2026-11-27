import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useToast } from "../components/ui/Toast.jsx";
import { celebrate } from "../utils/confetti.js";
import { addActivity, dayKey, readJSON, writeJSON } from "../utils/gamification.js";

// Pomodoro timer shared by the topbar chip and the dashboard card.
// It keeps running while the student moves between pages (and across refreshes).
const FocusCtx = createContext(null);

export const MODES = {
  focus: { label: "Focus", short: "Focus 25", seconds: 25 * 60 },
  short: { label: "Short break", short: "Break 5", seconds: 5 * 60 },
  long: { label: "Long break", short: "Long 15", seconds: 15 * 60 },
};

function loadStats() {
  const s = readJSON("pt_focus", null);
  const today = dayKey();
  if (!s) return { day: today, minutesToday: 0, sessionsToday: 0, totalMinutes: 0 };
  if (s.day !== today) return { ...s, day: today, minutesToday: 0, sessionsToday: 0 };
  return s;
}

export function FocusProvider({ children }) {
  const toast = useToast();
  const saved = readJSON("pt_timer", null);
  const resume = saved?.endsAt > Date.now();

  const [mode, setMode] = useState(resume ? saved.mode : "focus");
  const [endsAt, setEndsAt] = useState(resume ? saved.endsAt : null);
  const [remaining, setRemaining] = useState(MODES[resume ? saved.mode : "focus"].seconds);
  const [stats, setStats] = useState(loadStats);
  const [, tick] = useState(0);

  const secondsLeft = endsAt ? Math.max(0, Math.round((endsAt - Date.now()) / 1000)) : remaining;
  const running = !!endsAt;

  useEffect(() => writeJSON("pt_timer", endsAt ? { mode, endsAt } : null), [mode, endsAt]);
  useEffect(() => writeJSON("pt_focus", stats), [stats]);

  const complete = useCallback(() => {
    setEndsAt(null);
    if (mode === "focus") {
      const mins = MODES.focus.seconds / 60;
      addActivity(mins);
      setStats((s) => ({
        ...s,
        minutesToday: s.minutesToday + mins,
        sessionsToday: s.sessionsToday + 1,
        totalMinutes: s.totalMinutes + mins,
      }));
      celebrate();
      toast({ type: "reward", title: `+${mins} focus minutes!`, description: "Session complete. Take a 5-minute break 🌿" });
      setMode("short");
      setRemaining(MODES.short.seconds);
    } else {
      toast({ type: "info", title: "Break's over", description: "Ready for another focus sprint?" });
      setMode("focus");
      setRemaining(MODES.focus.seconds);
    }
  }, [mode, toast]);

  useEffect(() => {
    if (!endsAt) return;
    const t = setInterval(() => {
      if (Date.now() >= endsAt) complete();
      else tick((x) => x + 1);
    }, 1000);
    return () => clearInterval(t);
  }, [endsAt, complete]);

  // Show the countdown in the browser tab while running
  useEffect(() => {
    const base = "PrepTrack";
    if (!running) {
      document.title = base;
      return;
    }
    const m = String(Math.floor(secondsLeft / 60)).padStart(2, "0");
    const s = String(secondsLeft % 60).padStart(2, "0");
    document.title = `⏱ ${m}:${s} · ${MODES[mode].label}`;
  }, [running, secondsLeft, mode]);

  const start = useCallback(() => setEndsAt(Date.now() + remaining * 1000), [remaining]);
  const pause = useCallback(() => {
    setRemaining(secondsLeft);
    setEndsAt(null);
  }, [secondsLeft]);
  const reset = useCallback(() => {
    setEndsAt(null);
    setRemaining(MODES[mode].seconds);
  }, [mode]);
  const switchMode = useCallback((m) => {
    setEndsAt(null);
    setMode(m);
    setRemaining(MODES[m].seconds);
  }, []);

  const value = useMemo(
    () => ({
      mode,
      running,
      secondsLeft,
      total: MODES[mode].seconds,
      stats,
      start,
      pause,
      reset,
      switchMode,
    }),
    [mode, running, secondsLeft, stats, start, pause, reset, switchMode]
  );

  return <FocusCtx.Provider value={value}>{children}</FocusCtx.Provider>;
}

export function useFocus() {
  return useContext(FocusCtx);
}

export const formatClock = (sec) =>
  `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
