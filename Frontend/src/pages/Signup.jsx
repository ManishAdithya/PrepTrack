import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { User, Mail, Hash, Lock, ArrowRight, Loader2, CheckCircle2, AlertTriangle } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import AuthShell from "../components/AuthShell.jsx";
import { branchFromRoll, batchFromRoll, batchLabel, exampleRoll, rollAllowed, useRules } from "../utils/rules.js";

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
  { label: "Okay", color: "bg-accent" },
  { label: "Strong", color: "bg-emerald-400" },
  { label: "Excellent", color: "bg-accent" },
];

function IconInput({ icon: Icon, ...props }) {
  return (
    <div className="relative">
      <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
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

  // Only roll numbers of the open class(es) can join; branch + batch come from the roll number
  const roll = rollNumber.trim().toUpperCase();
  const branch = branchFromRoll(roll);
  const batch = batchFromRoll(roll);
  const example = exampleRoll(rules.rollFormats[0]);
  const branchOk = rollAllowed(roll, rules.rollFormats);
  const emailOk = !rules.emailDomain || email.trim().toLowerCase().endsWith(`@${rules.emailDomain}`);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!emailOk) {
      setErr(`Please use your college email (@${rules.emailDomain}).`);
      return;
    }
    if (!branchOk) {
      setErr(`PrepTrack is currently open only to roll numbers like ${example}.`);
      return;
    }
    setErr("");
    setLoading(true);

    const res = await register({ name, email, rollNumber: roll, branch, password });
    setLoading(false);

    if (res.ok) {
      toast({ title: "Account created", description: "Sign in to get started." });
      navigate("/login");
    } else setErr(res.error || "Signup failed");
  };

  const s = password ? strength(password) : -1;

  return (
    <AuthShell>
      <h2 className="text-2xl font-bold text-white sm:text-3xl">Create your account</h2>
      <p className="mt-1 text-sm text-zinc-400">
        Open to <span className="font-semibold text-white">{batchLabel(rules.branches[0], batchFromRoll(example))}</span>
        {rules.emailDomain ? <> with a @{rules.emailDomain} email</> : null}.
      </p>

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
            <p className="mt-1.5 text-xs text-accent">Must end with @{rules.emailDomain}</p>
          )}
        </div>

        <div>
          <label className="label">Roll number</label>
          <IconInput
            icon={Hash}
            value={rollNumber}
            onChange={(e) => setRollNumber(e.target.value)}
            placeholder={example}
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            required
          />
          {rollNumber.length >= 6 && (
            <p className={`mt-1.5 flex items-center gap-1.5 text-xs ${branchOk ? "text-emerald-400" : "text-rose-300"}`}>
              {branchOk ? <CheckCircle2 size={13} /> : <AlertTriangle size={13} />}
              {branchOk ? batchLabel(branch, batch) : `Must look like ${example}`}
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
              <span className="w-16 text-right text-[11px] text-zinc-400">{STRENGTH[s].label}</span>
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

        <div className="text-center text-sm text-zinc-400">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold text-accent hover:text-accent">
            Log in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}
