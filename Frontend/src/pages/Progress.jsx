import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  Cell,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import {
  TrendingUp,
  BookOpenCheck,
  Trophy,
  Gauge,
  LineChart,
  UploadCloud,
  CalendarPlus,
  Trash2,
  Pencil,
  Check,
  X,
  Star,
  Lightbulb,
  CalendarClock,
} from "lucide-react";
import API from "../api";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { bigCelebrate, celebrate } from "../utils/confetti.js";
import { confidenceOf, daysUntil, shortDate } from "../utils/ui.js";

const CONFIDENCE = ["High", "Medium", "Low"];

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="glass-strong !rounded-xl px-3 py-2 text-xs">
      <div className="font-semibold text-white">{p.subject || label}</div>
      <div className="text-slate-400">{p.date || label}</div>
      <div className="mt-1 font-display text-lg font-bold text-violet-200">{payload[0].value}%</div>
    </div>
  );
}

const scoreColor = (v) => (v >= 80 ? "#34d399" : v >= 60 ? "#fbbf24" : "#fb7185");

export default function Progress() {
  const toast = useToast();

  // existing result/progress state
  const [results, setResults] = useState([]);
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // upload result form
  const [showResult, setShowResult] = useState(false);
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [examDate, setExamDate] = useState("");

  // subjects modal
  const [showSubjectsModal, setShowSubjectsModal] = useState(false);

  // prep-subjects (personal exam prep tracker)
  const [prepSubjects, setPrepSubjects] = useState([]);
  const [showAddPrep, setShowAddPrep] = useState(false);
  const [prepSubject, setPrepSubject] = useState("");
  const [prepDate, setPrepDate] = useState("");
  const [prepConfidence, setPrepConfidence] = useState("Medium");

  // edit / delete state for a prep subject
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [resProgress, resResults] = await Promise.all([API.get("/progress"), API.get("/result")]);
      setProgress(resProgress.data);
      setPrepSubjects(resProgress.data.prepSubjects || []);
      setResults(resResults.data);
      setError(null);
    } catch (err) {
      console.error("Fetch Progress Error:", err);
      setError("Unable to load progress data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const apiError = (err, fallback) => toast({ type: "error", title: err.response?.data?.message || fallback });

  // === Upload exam result ===
  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const payload = { subject, marks: Number(marks), totalMarks: Number(totalMarks), examDate };
      await API.post("/result/upload", payload);
      const pct = Math.round((payload.marks / payload.totalMarks) * 100);
      await fetchData();
      setShowResult(false);
      setSubject("");
      setMarks("");
      setTotalMarks("");
      setExamDate("");
      if (pct >= 80) {
        bigCelebrate();
        toast({ type: "reward", title: `${pct}% — outstanding! 🏆`, description: "Result saved and readiness updated." });
      } else {
        toast({ title: "Result uploaded", description: `${pct}% saved. Every result sharpens your insights.` });
      }
    } catch (err) {
      console.error("Upload error:", err);
      apiError(err, "Failed to upload result.");
    }
  };

  // === Prep Subjects CRUD ===
  const handleAddPrep = async (e) => {
    e.preventDefault();
    if (!prepSubject.trim()) return;
    try {
      const payload = { subject: prepSubject.trim(), examDate: prepDate || null, confidence: prepConfidence };
      const res = await API.post("/progress/prep/add", payload);
      setPrepSubjects(res.data.prepSubjects || []);
      setPrepSubject("");
      setPrepDate("");
      setPrepConfidence("Medium");
      setShowAddPrep(false);
      celebrate({ particleCount: 50 });
      toast({ title: "Exam added to your tracker" });
    } catch (err) {
      console.error("Add prep subject error:", err);
      apiError(err, "Failed to add subject.");
    }
  };

  const updatePrep = async (id, payload) => {
    try {
      const res = await API.patch(`/progress/prep/update/${id}`, payload);
      setPrepSubjects(res.data.prepSubjects || []);
      if (payload.confidence === "High") toast({ type: "reward", title: "Feeling confident! 💪", duration: 2000 });
    } catch (err) {
      console.error("Update prep subject error:", err);
      apiError(err, "Failed to update subject.");
    }
  };

  const saveEditDate = async (id) => {
    await updatePrep(id, { examDate: editDate || null });
    setEditId(null);
  };

  const deletePrep = async (id) => {
    try {
      const res = await API.delete(`/progress/prep/delete/${id}`);
      setPrepSubjects(res.data.prepSubjects || []);
      if (editId === id) setEditId(null);
      toast({ type: "info", title: "Subject removed" });
    } catch (err) {
      console.error("Delete prep subject error:", err);
      apiError(err, "Failed to delete subject.");
    } finally {
      setConfirmDelete(null);
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid gap-4 md:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  if (error) return <EmptyState icon={TrendingUp} title="Couldn't load progress" text={error} />;

  // COMPUTATIONS ------------------------------------
  const avgScore = results.length > 0 ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length) : 0;

  const trendData = results.map((r) => ({
    x: shortDate(r.uploadedAt),
    date: new Date(r.uploadedAt).toLocaleDateString(),
    subject: r.subject,
    y: r.percentage,
  }));

  const subjects = [...new Set(results.map((r) => r.subject))];
  const bySubject = subjects.map((s) => {
    const rs = results.filter((r) => r.subject === s);
    return { subject: s, y: rs[rs.length - 1].percentage, short: s.length > 10 ? s.slice(0, 9) + "…" : s };
  });
  const best = [...bySubject].sort((a, b) => b.y - a.y)[0];

  let insight = { emoji: "📊", text: "Upload a few results to unlock personalised insights." };
  if (results.length >= 3) {
    const lastThree = results.slice(-3).map((r) => r.percentage);
    const diff = lastThree[lastThree.length - 1] - lastThree[0];
    if (diff > 5) insight = { emoji: "📈", text: "You are improving. Keep up the good work!" };
    else if (diff < -5) insight = { emoji: "📉", text: "Your performance dipped recently. Revise weak areas." };
    else insight = { emoji: "➖", text: "Your performance is stable. Maintain consistency." };
  }

  const confidence = progress?.confidence || "Medium";
  const sortedPrep = [...prepSubjects].sort((a, b) => {
    if (!a.examDate) return 1;
    if (!b.examDate) return -1;
    return new Date(a.examDate) - new Date(b.examDate);
  });
  const previewPct = marks && totalMarks ? Math.round((Number(marks) / Number(totalMarks)) * 100) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        icon={TrendingUp}
        eyebrow="Your journey"
        title="Exam Progress"
        subtitle="Track results, spot trends and plan your revision."
        gradient="from-emerald-400 to-teal-600"
        actions={
          <>
            <button onClick={() => setShowAddPrep(true)} className="btn-ghost">
              <CalendarPlus size={16} /> Add exam
            </button>
            <button onClick={() => setShowResult(true)} className="btn-primary">
              <UploadCloud size={16} /> Log a result
            </button>
          </>
        }
      />

      {/* ======== SUMMARY ======== */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card onClick={() => setShowSubjectsModal(true)} className="cursor-pointer p-5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Subjects <BookOpenCheck size={18} className="text-sky-300" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-white"><AnimatedNumber value={subjects.length} /></div>
          <div className="mt-1 text-xs text-violet-300">View all →</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Average score <Trophy size={18} className="text-amber-300" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-white"><AnimatedNumber value={avgScore} suffix="%" /></div>
          <div className="mt-1 text-xs" style={{ color: scoreColor(avgScore) }}>
            {avgScore >= 75 ? "Excellent!" : avgScore >= 60 ? "Good progress" : "Needs improvement"}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Readiness <Gauge size={18} className="text-violet-300" />
          </div>
          <div className="mt-2 font-display text-3xl font-bold text-white"><AnimatedNumber value={progress?.progressPercent || 0} suffix="%" /></div>
          <div className={`mt-1 text-xs ${confidenceOf(confidence).text}`}>Confidence: {confidence}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between text-sm text-slate-400">
            Best subject <Star size={18} className="text-fuchsia-300" />
          </div>
          <div className="mt-2 truncate font-display text-xl font-bold text-white">{best?.subject || "—"}</div>
          <div className="mt-1 text-xs text-emerald-300">{best ? `${best.y}% latest` : "Log a result"}</div>
        </Card>
      </div>

      {/* ======== CHARTS ======== */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr,1fr]">
        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              <LineChart size={18} className="text-violet-300" /> Performance trend
            </h2>
            <span className="chip">{results.length} exams</span>
          </div>
          {trendData.length === 0 ? (
            <EmptyState icon={LineChart} title="No results yet" text="Log your first exam result to see your trend line." />
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -18, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.55} />
                      <stop offset="100%" stopColor="#a78bfa" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#f0abfc" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(167,139,250,0.4)", strokeDasharray: 4 }} />
                  <Area
                    type="monotone"
                    dataKey="y"
                    stroke="url(#trendStroke)"
                    strokeWidth={3}
                    fill="url(#trendFill)"
                    dot={{ r: 4, fill: "#0f1526", stroke: "#c4b5fd", strokeWidth: 2 }}
                    activeDot={{ r: 7, fill: "#f0abfc", stroke: "#fff", strokeWidth: 2 }}
                    animationDuration={1400}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/[0.06] bg-white/[0.03] px-4 py-3 text-sm text-slate-300">
            <span className="text-xl">{insight.emoji}</span>
            <span><span className="font-semibold text-white">Insight: </span>{insight.text}</span>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="section-title mb-4">
            <Gauge size={18} className="text-emerald-300" /> Readiness
          </h2>
          <ProgressRing value={progress?.progressPercent || 0} size={170} label="overall readiness" from="#34d399" to="#a78bfa" />
          <div className="mt-6">
            <div className="mb-2 flex justify-between text-xs text-slate-400">
              <span>Preparation confidence</span>
              <span className={confidenceOf(confidence).text}>{confidence}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {["Low", "Medium", "High"].map((lvl, i) => {
                const on = ["Low", "Medium", "High"].indexOf(confidence) >= i;
                return (
                  <motion.div
                    key={lvl}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: 0.3 + i * 0.15 }}
                    className={`h-2 origin-left rounded-full ${on ? `bg-gradient-to-r ${confidenceOf(confidence).bar}` : "bg-white/10"}`}
                  />
                );
              })}
            </div>
          </div>
          {bySubject.length > 0 && (
            <div className="mt-6 h-36">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={bySubject} margin={{ left: -24, right: 0 }}>
                  <XAxis dataKey="short" tick={{ fill: "#64748b", fontSize: 10 }} axisLine={false} tickLine={false} interval={0} />
                  <YAxis domain={[0, 100]} hide />
                  <Tooltip content={<ChartTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="y" radius={[6, 6, 0, 0]} animationDuration={1200}>
                    {bySubject.map((s) => (
                      <Cell key={s.subject} fill={scoreColor(s.y)} fillOpacity={0.85} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      </div>

      {/* ================= PERSONAL EXAM PREP TRACKER ================= */}
      <Card className="p-6" spotlight={false}>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">
              <CalendarClock size={18} className="text-amber-300" /> Exam prep tracker
            </h2>
            <p className="mt-1 text-sm text-slate-400">Tap a confidence level as you revise — be honest with yourself!</p>
          </div>
          <button onClick={() => setShowAddPrep(true)} className="btn-ghost">
            <CalendarPlus size={16} /> Add subject
          </button>
        </div>

        {sortedPrep.length === 0 ? (
          <EmptyState
            icon={CalendarClock}
            title="No exams tracked yet"
            text="Add a subject and exam date to get countdowns on your dashboard."
            action={<button onClick={() => setShowAddPrep(true)} className="btn-primary"><CalendarPlus size={16} /> Add your first exam</button>}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sortedPrep.map((sub) => {
              const d = sub.examDate ? daysUntil(sub.examDate) : null;
              const c = confidenceOf(sub.confidence);
              const urgent = d !== null && d >= 0 && d <= 5;
              return (
                <motion.div
                  key={sub._id}
                  variants={item}
                  layout
                  className={`relative overflow-hidden rounded-2xl border p-5 transition ${
                    urgent ? "border-rose-400/30 bg-rose-500/[0.06]" : "border-white/[0.08] bg-white/[0.03]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="truncate font-display text-lg font-semibold text-white">{sub.subject}</div>
                      {editId === sub._id ? (
                        <div className="mt-2 flex items-center gap-1.5">
                          <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input !py-1.5 text-xs" />
                          <button onClick={() => saveEditDate(sub._id)} className="rounded-lg bg-emerald-500/20 p-2 text-emerald-200 hover:bg-emerald-500/30" aria-label="Save date">
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditId(null)} className="rounded-lg bg-white/10 p-2 text-slate-300 hover:bg-white/15" aria-label="Cancel">
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditId(sub._id);
                            setEditDate(sub.examDate ? new Date(sub.examDate).toISOString().slice(0, 10) : "");
                          }}
                          className="group mt-1 flex items-center gap-1.5 text-sm text-slate-400 hover:text-white"
                        >
                          {sub.examDate ? new Date(sub.examDate).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" }) : "Set exam date"}
                          <Pencil size={12} className="opacity-0 transition group-hover:opacity-100" />
                        </button>
                      )}
                    </div>
                    {d !== null && (
                      <div className={`shrink-0 rounded-2xl px-3 py-2 text-center ${urgent ? "bg-rose-500/20" : "bg-white/[0.06]"}`}>
                        <div className={`font-display text-2xl font-bold leading-none ${urgent ? "text-rose-200" : "text-white"}`}>{d < 0 ? "✓" : d}</div>
                        <div className="mt-0.5 text-[10px] uppercase tracking-wider text-slate-400">{d < 0 ? "done" : d === 1 ? "day" : "days"}</div>
                      </div>
                    )}
                  </div>

                  <div className="mt-4">
                    <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className={`h-full rounded-full bg-gradient-to-r ${c.bar}`}
                        animate={{ width: `${c.value}%` }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <Segmented
                        size="sm"
                        value={sub.confidence}
                        onChange={(v) => v !== sub.confidence && updatePrep(sub._id, { confidence: v })}
                        options={CONFIDENCE.map((x) => ({ value: x, label: x === "Medium" ? "Med" : x }))}
                      />
                      <button onClick={() => setConfirmDelete(sub)} className="rounded-lg p-2 text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300" aria-label="Delete subject">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-amber-300/15 bg-amber-300/[0.05] px-4 py-3 text-sm text-slate-300">
          <Lightbulb size={17} className="mt-0.5 shrink-0 text-amber-300" />
          Exams within 5 days are highlighted in red — if any of them are marked <span className="font-semibold text-rose-300">Low</span>, tackle those first.
        </div>
      </Card>

      {/* ================= MODALS ================= */}
      <Modal open={showResult} onClose={() => setShowResult(false)} title="Log an exam result" subtitle="Your readiness and confidence update automatically.">
        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex items-center gap-5">
            <ProgressRing value={previewPct} size={110} stroke={9} from={scoreColor(previewPct)} to="#a78bfa" />
            <div className="flex-1 space-y-3">
              <div>
                <label className="label">Subject</label>
                <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Operating Systems" className="input" list="subject-list" required />
                <datalist id="subject-list">
                  {[...new Set([...subjects, ...prepSubjects.map((p) => p.subject)])].map((s) => <option key={s} value={s} />)}
                </datalist>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marks</label>
              <input type="number" min="0" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="42" className="input" required />
            </div>
            <div>
              <label className="label">Total marks</label>
              <input type="number" min="1" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} placeholder="50" className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Exam date</label>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowResult(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary"><UploadCloud size={16} /> Save result</button>
          </div>
        </form>
      </Modal>

      <Modal open={showAddPrep} onClose={() => setShowAddPrep(false)} title="Add an exam to track" subtitle="You'll get a live countdown on your dashboard.">
        <form onSubmit={handleAddPrep} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input value={prepSubject} onChange={(e) => setPrepSubject(e.target.value)} placeholder="e.g., Computer Networks" className="input" required autoFocus />
          </div>
          <div>
            <label className="label">Exam date</label>
            <input type="date" value={prepDate} onChange={(e) => setPrepDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">How confident are you?</label>
            <Segmented value={prepConfidence} onChange={setPrepConfidence} options={CONFIDENCE} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAddPrep(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary"><CalendarPlus size={16} /> Add subject</button>
          </div>
        </form>
      </Modal>

      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete this subject?" subtitle={`"${confirmDelete?.subject}" will be removed from your tracker. This is permanent.`} width="max-w-md">
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Keep it</button>
          <button onClick={() => deletePrep(confirmDelete._id)} className="btn-danger"><Trash2 size={15} /> Delete</button>
        </div>
      </Modal>

      <Modal open={showSubjectsModal} onClose={() => setShowSubjectsModal(false)} title="Subjects with results" width="max-w-md">
        {bySubject.length === 0 ? (
          <p className="text-sm text-slate-400">No subjects uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {bySubject.map((s) => (
              <li key={s.subject} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-3">
                <span className="flex-1 text-slate-200">{s.subject}</span>
                <span className="font-display font-bold" style={{ color: scoreColor(s.y) }}>{s.y}%</span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </motion.div>
  );
}
