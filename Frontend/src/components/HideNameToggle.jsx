import React, { useEffect, useState } from "react";
import { EyeOff, Eye } from "lucide-react";
import API from "../api";
import { useGame } from "../context/GameContext.jsx";
import { useToast } from "./ui/Toast.jsx";

// Bold, obvious switch: hide / show my name on the class leaderboard.
// Saves instantly; `onChange(hidden)` lets the page refresh what it shows.
export default function HideNameToggle({ onChange, className = "" }) {
  const game = useGame();
  const toast = useToast();
  const [hidden, setHidden] = useState(null); // null = loading
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    API.get("/auth/me")
      .then(({ data }) => setHidden(!!data.hideFromLeaderboard))
      .catch(() => setHidden(false));
  }, []);

  const toggle = async () => {
    if (hidden === null || saving) return;
    const next = !hidden;
    setHidden(next); // instant
    setSaving(true);
    try {
      await API.put("/auth/profile", { hideFromLeaderboard: next });
      onChange?.(next);
      game.refresh?.();
      toast({ title: next ? "Your name is now hidden" : "Your name is visible again", duration: 2000 });
    } catch (err) {
      setHidden(!next); // undo
      toast({ type: "error", title: err.response?.data?.message || "Couldn't save — try again" });
    } finally {
      setSaving(false);
    }
  };

  const on = hidden === true;
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={toggle}
      disabled={hidden === null}
      className={`flex w-full items-center gap-4 rounded-2xl border-2 p-4 text-left transition sm:p-5 ${
        on ? "border-accent bg-accent/[0.08]" : "border-white/15 bg-ink-800 hover:border-white/30"
      } ${className}`}
    >
      <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${on ? "bg-accent text-black" : "bg-white/[0.06] text-white"}`}>
        {on ? <EyeOff size={20} /> : <Eye size={20} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-display text-base font-bold text-white sm:text-lg">Hide my name</span>
        <span className="block text-xs text-zinc-400 sm:text-sm">
          {hidden === null
            ? "Loading…"
            : on
            ? "On — classmates see \"Hidden classmate\". You keep your rank and XP."
            : "Off — classmates can see your name on the leaderboard."}
        </span>
      </span>
      {/* the switch */}
      <span className={`relative h-8 w-14 shrink-0 rounded-full transition-colors ${on ? "bg-accent" : "bg-white/15"}`}>
        <span className={`absolute top-1 h-6 w-6 rounded-full shadow transition-all ${on ? "left-7 bg-black" : "left-1 bg-white"}`} />
      </span>
    </button>
  );
}
