import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Hash, Lock, ArrowRight, Loader2, FlaskConical } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { DEMO_MODE } from "../api";
import AuthShell from "../components/AuthShell.jsx";
import { exampleRoll, useRules } from "../utils/rules.js";

export default function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const rules = useRules();
  // right after signup, the roll number is filled in for you
  const [roll, setRoll] = useState(location.state?.rollNumber || "");
  const [pwd, setPwd] = useState("");
  const [show, setShow] = useState(false);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(0);
  const [forgot, setForgot] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    setLoading(true);

    const res = await login(roll.trim(), pwd);

    if (!res.ok) {
      setErr(res.error || "Login failed");
      setShake((s) => s + 1);
      setLoading(false);
      return;
    }

    // let the rest of the app pick up the new user without a refresh
    window.dispatchEvent(new CustomEvent("user-logged-in"));
    setLoading(false);
  };

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">Sign in</h2>
      <p className="mt-1 text-sm text-zinc-400">Use your roll number. CRs sign in the same way.</p>

      <motion.form
        key={shake}
        animate={shake ? { x: [0, -10, 10, -6, 6, 0] } : {}}
        transition={{ duration: 0.4 }}
        onSubmit={onSubmit}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="label" htmlFor="login-roll">Roll number</label>
          <div className="relative">
            <Hash size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="login-roll"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder={exampleRoll(rules.rollFormats[0])}
              className="input pl-11 uppercase placeholder:normal-case"
              autoComplete="username"
              autoCapitalize="characters"
              autoCorrect="off"
              spellCheck={false}
              required
            />
          </div>
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="label !mb-0" htmlFor="login-password">Password</label>
            <button type="button" onClick={() => setForgot((f) => !f)} className="text-xs font-semibold text-zinc-400 hover:text-white">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              id="login-password"
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
          {forgot && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden rounded-xl border border-white/10 bg-ink-900 px-3 py-2.5 text-sm text-zinc-300"
            >
              Ask your <b className="text-white">CR</b> to reset it. They'll give you a temporary password — sign in with it and
              you'll be asked to choose a new one.
            </motion.div>
          )}
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
            Demo mode: anything works. Type <b>admin</b> as the roll number to open the CR portal.
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
