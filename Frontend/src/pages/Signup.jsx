import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, Mail, Hash, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle, Users } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import AuthShell from "../components/AuthShell.jsx";
import { branchFromRoll, batchFromRoll, batchLabel, useRules } from "../utils/rules.js";

function strength(p) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p) && /[a-z]/.test(p)) s++;
  if (/\d/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}
const STRENGTH = [
  { label: "Too short", color: "bg-rose-500" },
  { label: "Weak", color: "bg-rose-400" },
  { label: "Okay", color: "bg-amber-400" },
  { label: "Strong", color: "bg-emerald-400" },
  { label: "Excellent", color: "bg-cyan-300" },
];

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
      <input {...props} className="input pl-11" />
    </div>
  );
}

export default function Signup() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const rules = useRules();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  // Branch is read from the roll number; only allowed branches can join
  const branch = branchFromRoll(rollNumber);
  const batch = batchFromRoll(rollNumber);
  const branchOk = !!branch && !!batch && rules.branches.includes(branch);
  const emailOk = !rules.emailDomain || email.trim().toLowerCase().endsWith(`@${rules.emailDomain}`);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!emailOk) {
      setErr(`Please use your college email (@${rules.emailDomain}).`);
      return;
    }
    if (!branchOk) {
      setErr(`PrepTrack is currently open to ${rules.branches.join(", ")} students only.`);
      return;
    }
    setErr("");
    setLoading(true);

    const res = await register({ name, email, rollNumber, branch, password });
    setLoading(false);

    if (res.ok) {
      toast({ title: "Account created 🎉", description: "Sign in to start your prep journey." });
      navigate("/login");
    } else setErr(res.error || "Signup failed");
  };

  const s = password ? strength(password) : -1;

  return (
    <AuthShell>
      <h2 className="text-3xl font-bold text-white">Create your account</h2>
      <p className="mt-1 text-slate-400">Join your batch on PrepTrack — it takes 30 seconds.</p>

      <div className="mt-5 flex items-start gap-2 rounded-xl border border-violet-400/20 bg-violet-500/[0.07] px-3 py-2.5 text-xs text-violet-100/90">
        <Users size={14} className="mt-0.5 shrink-0 text-violet-300" />
        <span>
          Now open to <b>{rules.branches.join(", ")}</b> students
          {rules.emailDomain ? <> with a <b>@{rules.emailDomain}</b> email</> : null}. Student moderators are added by the
          PrepTrack team.
        </span>
      </div>

      <form onSubmit={onSubmit} className="mt-5 space-y-4">
        <div>
          <label className="label">Full name</label>
          <IconInput icon={User} value={name} onChange={(e) => setName(e.target.value)} placeholder="Enter your full name" required />
        </div>

        <div>
          <label className="label">College email</label>
          <IconInput
            icon={Mail}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={`you@${rules.emailDomain || "college.edu"}`}
            required
          />
          {email.includes("@") && !emailOk && (
            <p className="mt-1.5 text-xs text-amber-200">Must end with @{rules.emailDomain}</p>
          )}
        </div>

        <div>
          <label className="label">Roll number</label>
          <IconInput icon={Hash} value={rollNumber} onChange={(e) => setRollNumber(e.target.value)} placeholder="AM.SC.U4CSE23140" required />
          {rollNumber.length >= 6 && (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${branchOk ? "text-emerald-300" : "text-amber-200"}`}>
              {branchOk ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {branchOk
                ? `Detected: ${batchLabel(branch, batch)} — you'll only see your batch`
                : branch
                ? `${branch} isn't open yet — PrepTrack is ${rules.branches.join(", ")}-only for now.`
                : "Enter your full roll number, e.g. AM.SC.U4CSE23140"}
            </p>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <IconInput icon={Lock} type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Create a password" autoComplete="new-password" required />
          {s >= 0 && (
            <div className="mt-2 flex items-center gap-2">
              <div className="grid flex-1 grid-cols-4 gap-1">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-colors ${i < s ? STRENGTH[s].color : "bg-white/10"}`} />
                ))}
              </div>
              <span className="w-16 text-right text-[11px] text-slate-400">{STRENGTH[s].label}</span>
            </div>
          )}
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
              <Loader2 size={18} className="animate-spin" /> Creating…
            </>
          ) : (
            <>
              Create account <ArrowRight size={18} className="transition group-hover:translate-x-1" />
            </>
          )}
        </button>

        <div className="text-center text-sm text-slate-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-violet-300 hover:text-violet-200">
            Log in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
