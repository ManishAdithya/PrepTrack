import React from "react";
import { Link } from "react-router-dom";
import { KeyRound, LogOut, ShieldCheck, ChevronRight } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "./ui/Card.jsx";
import HideNameToggle from "./HideNameToggle.jsx";

// Account section on the Profile page: leaderboard privacy, password, CR portal, log out
export default function AccountSettings({ onChange }) {
  const { user, logout } = useAuth();
  const row = "flex w-full items-center gap-3 p-4 text-left text-sm transition hover:bg-white/[0.03] sm:px-5";

  return (
    <section id="privacy" className="scroll-mt-20 space-y-3">
      <h2 className="font-display text-base font-bold text-white">Account</h2>

      <HideNameToggle onChange={(hidden) => onChange?.({ hideFromLeaderboard: hidden })} />

      <Card variants={null} className="divide-y divide-white/[0.06] p-0">
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
