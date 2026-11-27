import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Loader2, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { DEMO_MODE } from "../api";
import AuthShell from "../components/AuthShell.jsx";

export default function Login() {
  const { login } = useAuth();
  const [emailOrRoll, setEmailOrRoll] = useState("");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await login(emailOrRoll, pwd);

    if (!res.ok) {
      setErr(res.error || "Login failed");
      setShake((s) => s + 1);
      setLoading(false);
      return;
    }

    // ⭐ FIX: Trigger user update instantly (NO refresh needed)
    window.dispatchEvent(new CustomEvent("user-logged-in"));

    setLoading(false);
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">Sign in</h2>
      <p className="mt-1 text-sm text-zinc-400">CRs and students use the same login.</p>

      <motion.form
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        onSubmit={onSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="label">Email</label>
          <div className="relative">
            <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={emailOrRoll}
              onChange={(e) => setEmailOrRoll(e.target.value)}
              placeholder="you@college.edu"
              type="email"
              inputMode="email"
              className="input pl-11"
              autoComplete="username"
              required
            />
          </div>
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              type={show ? "text" : "password"}
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="Enter password"
              className="input pl-11 pr-11"
              autoComplete="current-password"
              required
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-400 transition hover:text-white"
              aria-label={show ? "Hide password" : "Show password"}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {err && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="rounded-xl border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-200"
            >
              {err}
            </motion.div>
          )}
        </AnimatePresence>

        <button type="submit" disabled={loading} className="btn-primary group w-full !py-3 text-base">
          {loading ? (
            <>
              <Loader2 size={18} className="animate-spin" /> Signing in…
            </>
          ) : (
            <>
              Sign in <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </>
          )}
        </button>
      </motion.form>

      {DEMO_MODE && (
        <div className="mt-5 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/[0.06] px-3 py-2.5 text-xs text-accent/90">
          <FlaskConical size={14} className="mt-0.5 shrink-0 text-accent" />
          <span>
            Demo mode: any email and password work. Use an email containing <b>admin</b> to open the admin portal.
          </span>
        </div>
      )}

      <div className="mt-6 text-center text-sm text-zinc-400">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-accent hover:text-accent">
          Create one
        </Link>
      </div>
    </AuthShell>
  );
}
