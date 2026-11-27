import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Megaphone, Send, Save, Sparkles, Search, Clock, Eye, Users } from "lucide-react";
import API from "../../api";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container } from "../../components/ui/motion.js";
import { celebrate } from "../../utils/confetti.js";
import { readJSON, writeJSON } from "../../utils/gamification.js";
import { timeAgo } from "../../utils/ui.js";

// Students see announcements whose audience is "All Users" or exactly their branch code
const FALLBACK_AUDIENCES = [
  { value: "CSE", label: "Computer Science" },
  { value: "ECE", label: "Electronics" },
  { value: "MECH", label: "Mechanical" },
  { value: "CIVIL", label: "Civil" },
];

export default function AdminAnnouncements() {
  const toast = useToast();
  const draft = readJSON("pt_announcement_draft", null);

  const [announcements, setAnnouncements] = useState([]);
  const [audiences, setAudiences] = useState(FALLBACK_AUDIENCES);
  const [message, setMessage] = useState(draft?.message || "");
  const [audience, setAudience] = useState(draft?.audience || "All Users");
  const [priority, setPriority] = useState(draft?.priority || false);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all announcements + branch list from backend
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data } = await API.get("/notification");
        setAnnouncements(data);
      } catch (err) {
        console.error("Error fetching announcements:", err);
        setError("Failed to load announcements.");
      } finally {
        setLoading(false);
      }
    };
    fetchAnnouncements();
    API.get("/branch")
      .then(({ data }) => data.length && setAudiences(data.map((b) => ({ value: b.branchCode, label: b.branchName }))))
      .catch(() => {});
  }, []);

  // Publish new announcement
  const handlePublish = async () => {
    if (!message.trim()) {
      toast({ type: "error", title: "Write a message before publishing" });
      return;
    }
    setPublishing(true);
    try {
      const { data } = await API.post("/notification/create", { message, audience, priority });
      setAnnouncements([data, ...announcements]); // Add new one at top
      setMessage("");
      setPriority(false);
      setAudience("All Users");
      writeJSON("pt_announcement_draft", null);
      celebrate({ particleCount: 60 });
      toast({ title: "Announcement published", description: audience === "All Users" ? "Sent to every student." : `Sent to ${audience} students.` });
    } catch (err) {
      console.error("Error publishing announcement:", err);
      toast({ type: "error", title: "Failed to publish announcement" });
    } finally {
      setPublishing(false);
    }
  };

  const saveDraft = () => {
    writeJSON("pt_announcement_draft", { message, audience, priority });
    toast({ type: "info", title: "Draft saved on this device" });
  };

  const filtered = announcements.filter((a) => a.message.toLowerCase().includes(search.toLowerCase()));
  const audienceLabel = (v) => (v === "All Users" ? "All Users" : audiences.find((a) => a.value === v)?.label || v);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader icon={Megaphone} eyebrow="Broadcast" title="Announcements" subtitle="Share news, deadlines and exam updates with students." gradient="from-violet-500 to-fuchsia-600" />

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        {/* Composer */}
        <Card className="p-6" spotlight={false}>
          <h2 className="section-title mb-4">Create a new announcement</h2>
          <textarea
            className="input h-36 resize-none"
            placeholder="Compose your announcement here…"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            maxLength={500}
          />
          <div className="mt-1 text-right text-[11px] text-slate-500">{message.length}/500</div>

          <div className="mt-3">
            <label className="label flex items-center gap-1.5"><Users size={12} /> Audience</label>
            <div className="flex flex-wrap gap-2">
              {[{ value: "All Users", label: "All Users" }, ...audiences].map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAudience(a.value)}
                  className={`rounded-xl border px-3 py-1.5 text-xs font-semibold transition ${
                    audience === a.value ? "border-violet-400/60 bg-violet-500/20 text-white shadow-glow" : "border-white/10 bg-white/[0.04] text-slate-400 hover:text-white"
                  }`}
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          <button type="button" onClick={() => setPriority((p) => !p)} className="mt-4 flex w-full items-center gap-3 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-3 text-left transition hover:bg-white/[0.05]">
            <span className={`relative h-6 w-11 rounded-full border transition ${priority ? "border-rose-400/40 bg-rose-500/40" : "border-white/10 bg-white/10"}`}>
              <motion.span layout transition={{ type: "spring", stiffness: 500, damping: 30 }} className={`absolute top-0.5 h-[18px] w-[18px] rounded-full ${priority ? "right-0.5 bg-rose-200" : "left-0.5 bg-slate-300"}`} />
            </span>
            <span>
              <span className="block text-sm font-semibold text-white">High priority</span>
              <span className="text-xs text-slate-400">Highlighted in red on every student's dashboard</span>
            </span>
          </button>

          {/* Live preview */}
          <div className="mt-5">
            <div className="label flex items-center gap-1.5"><Eye size={12} /> Student preview</div>
            <div className={`relative overflow-hidden rounded-2xl border p-4 ${priority ? "border-rose-400/25 bg-rose-500/[0.08]" : "border-white/[0.06] bg-white/[0.03]"}`}>
              {priority && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-fuchsia-500" />}
              <div className="flex items-start gap-2 text-sm text-slate-200">
                {priority && <Sparkles size={16} className="mt-0.5 shrink-0 text-rose-300" />}
                {message || <span className="text-slate-500">Your message will appear here…</span>}
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-slate-500"><Clock size={12} /> just now · {audienceLabel(audience)}</div>
            </div>
          </div>

          <div className="mt-5 flex gap-2">
            <button onClick={handlePublish} disabled={publishing} className="btn-primary flex-1">
              <Send size={16} /> {publishing ? "Publishing…" : "Publish announcement"}
            </button>
            <button onClick={saveDraft} className="btn-ghost">
              <Save size={16} /> Save draft
            </button>
          </div>
        </Card>

        {/* Published */}
        <Card className="p-6" spotlight={false}>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">Published <span className="chip">{announcements.length}</span></h2>
            <div className="relative w-full sm:w-60">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input placeholder="Search announcements…" value={search} onChange={(e) => setSearch(e.target.value)} className="input !py-2 pl-9" />
            </div>
          </div>

          {loading ? (
            <div className="space-y-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-20" />)}</div>
          ) : error ? (
            <p className="text-sm text-rose-300">{error}</p>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Megaphone} title="No announcements found" />
          ) : (
            <div className="max-h-[38rem] space-y-3 overflow-y-auto pr-1">
              <AnimatePresence initial={false}>
                {filtered.map((x, idx) => (
                  <motion.div
                    key={x.id || x._id || idx}
                    layout
                    initial={{ opacity: 0, y: -12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className={`relative overflow-hidden rounded-2xl border p-4 ${x.priority ? "border-rose-400/25 bg-rose-500/[0.08]" : "border-white/[0.06] bg-white/[0.03]"}`}
                  >
                    {x.priority && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-fuchsia-500" />}
                    <div className="text-sm text-slate-200">{x.message}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} /> {timeAgo(x.createdAt)}
                      <span className="chip">{audienceLabel(x.audience)}</span>
                      {x.priority && <span className="chip !border-rose-400/30 !bg-rose-500/10 !text-rose-200">High priority</span>}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
