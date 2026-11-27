import React, { useState } from "react";
import { Link } from "react-router-dom";
import { EyeOff, KeyRound, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useToast } from "./ui/Toast.jsx";
import Card from "./ui/Card.jsx";

// Account section on the Profile page: leaderboard privacy, password, CR portal, log out
export default function AccountSettings({ profile, onChange }) {
  const { user, logout } = useAuth();
  const game = useGame();
  const toast = useToast();
  const [saving, setSaving] = useState(false);
  const hidden = !!profile?.hideFromLeaderboard;

  const toggleHidden = async () => {
    setSaving(true);
    try {
      const { data } = await API.put("/auth/profile", { hideFromLeaderboard: !hidden });
      onChange?.(data);
      game.refresh?.();
      toast({ title: data.hideFromLeaderboard ? "Your name is hidden on the leaderboard" : "Your name is visible on the leaderboard" });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't save" });
    } finally {
      setSaving(false);
    }
  };

  const row = "flex w-full items-center gap-3 p-4 text-left text-sm transition hover:bg-white/[0.03] sm:px-5";

  return (
    <section id="privacy" className="scroll-mt-20">
      <h2 className="mb-3 font-display text-base font-bold text-white">Account</h2>
      <Card variants={null} className="divide-y divide-white/[0.06] p-0">
        {/* Leaderboard privacy */}
        <button onClick={toggleHidden} disabled={saving} className={row} role="switch" aria-checked={!hidden}>
          <EyeOff size={18} className="shrink-0 text-zinc-500" />
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-white">Show my name on the leaderboard</div>
            <div className="text-xs text-zinc-500">
              {hidden
                ? "Off — classmates see \"Hidden classmate\". You still earn XP and see your own rank."
                : "On — classmates see your name and XP."}
            </div>
          </div>
          <span className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${hidden ? "bg-white/15" : "bg-accent"}`}>
            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${hidden ? "left-0.5" : "left-[22px]"}`} />
          </span>
        </button>

        <Link to="/change-password" className={row}>
          <KeyRound size={18} className="shrink-0 text-zinc-500" />
          <span className="flex-1 font-semibold text-white">Change password</span>
          <ChevronRight size={16} className="text-zinc-600" />
        </Link>

        {user?.role === "admin" && (
          <Link to="/admin" className={row}>
            <ShieldCheck size={18} className="shrink-0 text-accent" />
            <span className="flex-1 font-semibold text-white">Open CR portal</span>
            <ChevronRight size={16} className="text-zinc-600" />
          </Link>
        )}

        <button onClick={logout} className={`${row} text-rose-300 hover:!bg-rose-500/10`}>
          <LogOut size={18} className="shrink-0" />
          <span className="flex-1 font-semibold">Log out</span>
        </button>
      </Card>
    </section>
  );
}
