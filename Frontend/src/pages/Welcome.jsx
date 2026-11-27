import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, CalendarClock, MessagesSquare, Trophy, Loader2, ArrowRight } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import AuthShell from "../components/AuthShell.jsx";

const POINTS = [
  { icon: BookOpen, text: "Share your notes, slides and PYQs — every semester, every subject." },
  { icon: MessagesSquare, text: "Stuck on something? Ask in the forum. Know the answer? Help out." },
  { icon: CalendarClock, text: "Your CR posts the exams; you get a countdown so nothing sneaks up on you." },
  { icon: Trophy, text: "Good uploads earn XP. Climb the leaderboard — or hide your name, your call." },
];

// Shown once, right after signing up: what PrepTrack is for + pick the name classmates will see.
export default function Welcome() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const first = String(user?.fullName || user?.name || "").split(" ")[0];
  const [displayName, setDisplayName] = useState(first);
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async (e) => {
    e.preventDefault();
    setErr("");
    setSaving(true);
    try {
      const { data } = await API.put("/auth/display-name", { displayName });
      updateUser({ name: data.displayName, displayName: data.displayName, needsDisplayName: false });
      window.dispatchEvent(new CustomEvent("user-logged-in"));
      navigate(user?.isOwner ? "/owner" : user?.role === "admin" ? "/admin" : "/", { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || "Couldn't save that name.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AuthShell>
      <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">Welcome{first ? `, ${first}` : ""} 👋</div>
      <h2 className="mt-1 text-2xl font-bold text-white sm:text-3xl">This app is for you guys.</h2>
      <p className="mt-2 text-sm leading-relaxed text-zinc-300">
        PrepTrack is our class's own space — built by students, for students. The more you put in, the better it gets for
        everyone. Help each other out, and let's all score better marks together.
      </p>

      <ul className="mt-4 space-y-2.5">
        {POINTS.map((p) => (
          <li key={p.text} className="flex items-start gap-3 text-sm text-zinc-400">
            <p.icon size={16} className="mt-0.5 shrink-0 text-accent" />
            {p.text}
          </li>
        ))}
      </ul>

      <form onSubmit={save} className="mt-6 space-y-3 border-t border-white/[0.08] pt-5">
        <div>
          <label className="label" htmlFor="display-name">Pick your display name</label>
          <input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input"
            maxLength={24}
            placeholder="e.g., Meera"
            autoFocus
            required
          />
          <p className="mt-1.5 text-xs text-zinc-500">
            This is what classmates see on the leaderboard, your uploads and the forum. You can change it later in Profile.
          </p>
        </div>
        {err && <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{err}</div>}
        <button type="submit" disabled={saving || displayName.trim().length < 2} className="btn-primary w-full !py-3 text-base">
          {saving ? <Loader2 size={18} className="animate-spin" /> : <>Let's go <ArrowRight size={18} /></>}
        </button>
      </form>
    </AuthShell>
  );
}
