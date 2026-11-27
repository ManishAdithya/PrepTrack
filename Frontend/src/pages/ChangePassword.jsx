import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Loader2 } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import AuthShell from "../components/AuthShell.jsx";

// Used in two cases:
// 1. right after a CR reset the password (mustChangePassword) — no current password needed
// 2. from Profile → Change password — the current password is asked
export default function ChangePassword() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const forced = !!user?.mustChangePassword;

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    if (next.length < 6) return setErr("New password must be at least 6 characters.");
    if (next !== again) return setErr("The two new passwords don't match.");
    setSaving(true);
    try {
      await API.put("/auth/password", { currentPassword: current, newPassword: next });
      updateUser({ mustChangePassword: false });
      toast({ title: "Password changed" });
      navigate(user.isOwner ? "/owner" : user.role === "admin" && forced ? "/admin" : forced ? "/" : "/profile", { replace: true });
    } catch (e2) {
      setErr(e2.response?.data?.message || "Couldn't change the password.");
    } finally {
      setSaving(false);
    }
  };

  const field = (label, value, set, autoComplete, id) => (
    <div>
      <label className="label" htmlFor={id}>{label}</label>
      <div className="relative">
        <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input id={id} type="password" value={value} onChange={(e) => set(e.target.value)} className="input pl-11" autoComplete={autoComplete} required />
      </div>
    </div>
  );

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">{forced ? "Choose a new password" : "Change password"}</h2>
      <p className="mt-1 text-sm text-zinc-400">
        {forced
          ? "Your CR reset your password. Pick a new one that only you know."
          : "Use at least 6 characters. Don't reuse your college or email password."}
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        {!forced && field("Current password", current, setCurrent, "current-password", "cp-current")}
        {field("New password", next, setNext, "new-password", "cp-new")}
        {field("New password again", again, setAgain, "new-password", "cp-again")}

        {err && <div className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200">{err}</div>}

        <button type="submit" disabled={saving} className="btn-primary w-full !py-3 text-base">
          {saving ? <Loader2 size={18} className="animate-spin" /> : "Save new password"}
        </button>
        <button type="button" onClick={forced ? logout : () => navigate(-1)} className="btn-ghost w-full">
          {forced ? "Log out" : "Cancel"}
        </button>
      </form>
    </AuthShell>
  );
}
