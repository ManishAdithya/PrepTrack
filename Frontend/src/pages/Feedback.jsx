import React, { useState } from "react";
import { motion } from "framer-motion";
import { Bug, Lightbulb, MessageCircle, Send, CheckCircle2 } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import { container, item } from "../components/ui/motion.js";

const KINDS = [
  { value: "Issue", label: "Something's wrong", icon: Bug, hint: "What happened, and what did you expect? Which page?" },
  { value: "Improvement", label: "Idea to improve", icon: Lightbulb, hint: "What would make PrepTrack more useful for you?" },
  { value: "Comment", label: "Comment", icon: MessageCircle, hint: "Anything else you want to tell the person running PrepTrack." },
];

// Students and CRs send issues, ideas and comments straight to the owner (shown in the owner dashboard).
export default function Feedback() {
  const { user } = useAuth();
  const toast = useToast();
  const [kind, setKind] = useState("Issue");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const k = KINDS.find((x) => x.value === kind);

  const send = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await API.post("/feedback", { kind, message, page: document.referrer ? new URL(document.referrer).pathname : "" });
      setSent(true);
      setMessage("");
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't send it" });
    } finally {
      setSending(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="mx-auto max-w-2xl space-y-5">
      <PageHeader title="Feedback" subtitle="Report a problem or suggest an improvement — it goes straight to the person who runs PrepTrack." />

      {sent ? (
        <motion.div variants={item} initial="hidden" animate="show" className="rounded-2xl border border-emerald-400/25 bg-emerald-400/[0.06] p-5">
          <div className="flex items-center gap-2 font-semibold text-white">
            <CheckCircle2 size={18} className="text-emerald-400" /> Sent — thank you!
          </div>
          <p className="mt-1 text-sm text-zinc-300">Every message is read. Fixes and improvements show up in the app for everyone.</p>
          <button onClick={() => setSent(false)} className="btn-ghost mt-4">
            Send another
          </button>
        </motion.div>
      ) : (
        <motion.form variants={item} onSubmit={send} className="space-y-4 rounded-2xl border border-white/[0.08] bg-ink-800 p-4 sm:p-5">
          <div className="grid grid-cols-3 gap-2">
            {KINDS.map((x) => (
              <button
                key={x.value}
                type="button"
                onClick={() => setKind(x.value)}
                aria-pressed={kind === x.value}
                className={`rounded-xl border px-2 py-3 text-center transition ${kind === x.value ? "border-accent bg-accent text-black" : "border-white/10 text-zinc-300 hover:border-white/25"}`}
              >
                <x.icon size={18} className="mx-auto" />
                <div className="mt-1 text-xs font-semibold">{x.label}</div>
              </button>
            ))}
          </div>

          <div>
            <label className="label" htmlFor="fb-message">Your message</label>
            <textarea
              id="fb-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={k.hint}
              className="input h-40 resize-none"
              maxLength={2000}
              required
            />
            <div className="mt-1 flex justify-between text-[11px] text-zinc-500">
              <span>
                Sent with your name and roll number ({user?.rollNumber}) so you can be contacted if needed.
              </span>
              <span>{message.length}/2000</span>
            </div>
          </div>

          <button type="submit" disabled={sending || message.trim().length < 5} className="btn-primary w-full sm:w-auto">
            <Send size={16} /> {sending ? "Sending…" : "Send"}
          </button>
        </motion.form>
      )}
    </motion.div>
  );
}
