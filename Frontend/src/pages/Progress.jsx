import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AreaChart, Area, Tooltip, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";
import { TrendingUp, UploadCloud, CalendarPlus, Trash2, Pencil, Check, X, AlertTriangle, ThumbsUp } from "lucide-react";
import API from "../api";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Modal from "../components/ui/Modal.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ReadinessHelp from "../components/ReadinessHelp.jsx";
import { container, item } from "../components/ui/motion.js";
import { celebrate } from "../utils/confetti.js";
import { bandOf, daysUntil, shortDate } from "../utils/ui.js";

const CONFIDENCE = ["High", "Medium", "Low"];

function ChartTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-xs">
      <div className="font-semibold text-white">{p.subject}</div>
      <div className="text-zinc-500">{p.date}</div>
      <div className="mt-0.5 font-display text-base font-bold text-accent">{p.y}%</div>
    </div>
  );
}

function SectionHead({ title, children }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      {children}
    </div>
  );
}

export default function Progress() {
  const toast = useToast();

  const [results, setResults] = useState([]);
  const [readiness, setReadiness] = useState(null);
  const [prepSubjects, setPrepSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // log-a-result form
  const [showResult, setShowResult] = useState(false);
  const [subject, setSubject] = useState("");
  const [marks, setMarks] = useState("");
  const [totalMarks, setTotalMarks] = useState("");
  const [examDate, setExamDate] = useState("");

  // exam plan
  const [showAddPrep, setShowAddPrep] = useState(false);
  const [prepSubject, setPrepSubject] = useState("");
  const [prepDate, setPrepDate] = useState("");
  const [prepConfidence, setPrepConfidence] = useState("Medium");
  const [editId, setEditId] = useState(null);
  const [editDate, setEditDate] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(null);

  const fetchData = async () => {
    try {
      const [p, r] = await Promise.all([API.get("/progress"), API.get("/result")]);
      setReadiness(p.data.readiness);
      setPrepSubjects(p.data.prepSubjects || []);
      setResults(r.data);
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

  // the plan endpoints return the plan + recalculated readiness
  const applyPlan = (data) => {
    setPrepSubjects(data.prepSubjects || []);
    if (data.readiness) setReadiness(data.readiness);
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      const { data } = await API.post("/result/upload", { subject, marks: Number(marks), totalMarks: Number(totalMarks), examDate });
      const pct = data.result.percentage;
      await fetchData();
      setShowResult(false);
      setSubject("");
      setMarks("");
      setTotalMarks("");
      setExamDate("");
      if (pct >= 80) celebrate({ particleCount: 60 });
      toast({ title: `${pct}% saved`, description: `Overall readiness is now ${data.readiness.overall}% (${data.readiness.band}).` });
    } catch (err) {
      apiError(err, "Failed to save result.");
    }
  };

  const handleAddPrep = async (e) => {
    e.preventDefault();
    if (!prepSubject.trim()) return;
    try {
      const { data } = await API.post("/progress/prep/add", { subject: prepSubject.trim(), examDate: prepDate || null, confidence: prepConfidence });
      applyPlan(data);
      setPrepSubject("");
      setPrepDate("");
      setPrepConfidence("Medium");
      setShowAddPrep(false);
      toast({ title: "Exam added" });
    } catch (err) {
      apiError(err, "Failed to add subject.");
    }
  };

  const updatePrep = async (id, payload) => {
    try {
      const { data } = await API.patch(`/progress/prep/update/${id}`, payload);
      applyPlan(data);
    } catch (err) {
      apiError(err, "Failed to update subject.");
    }
  };

  const deletePrep = async (id) => {
    try {
      const { data } = await API.delete(`/progress/prep/delete/${id}`);
      applyPlan(data);
      if (editId === id) setEditId(null);
      toast({ type: "info", title: "Subject removed" });
    } catch (err) {
      apiError(err, "Failed to delete subject.");
    } finally {
      setConfirmDelete(null);
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
        <Skeleton className="h-48" />
      </div>
    );
  if (error) return <EmptyState icon={TrendingUp} title="Couldn't load progress" text={error} />;

  const trendData = [...results]
    .sort((a, b) => new Date(a.uploadedAt) - new Date(b.uploadedAt))
    .map((r) => ({ x: shortDate(r.uploadedAt), date: new Date(r.uploadedAt).toLocaleDateString(), subject: r.subject, y: r.percentage }));

  const plan = [...prepSubjects].sort((a, b) => {
    if (!a.examDate) return 1;
    if (!b.examDate) return -1;
    return new Date(a.examDate) - new Date(b.examDate);
  });
  const knownSubjects = [...new Set([...results.map((r) => r.subject), ...prepSubjects.map((p) => p.subject)])];
  const previewPct = marks !== "" && Number(totalMarks) > 0 ? Math.round((Number(marks) / Number(totalMarks)) * 100) : null;
  const overall = readiness?.overall;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Progress"
        subtitle="Your readiness from marks, and your exam plan."
        actions={
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto">
            <button onClick={() => setShowAddPrep(true)} className="btn-ghost">
              <CalendarPlus size={16} /> Add exam
            </button>
            <button onClick={() => setShowResult(true)} className="btn-primary">
              <UploadCloud size={16} /> Log result
            </button>
          </div>
        }
      />

      {/* ===== Readiness ===== */}
      <motion.section variants={item}>
        <SectionHead title="Readiness">
          <ReadinessHelp />
        </SectionHead>
        <Card variants={null} className="p-0">
          <div className="flex items-end gap-4 border-b border-white/[0.06] p-5">
            <div className="font-display text-5xl font-bold leading-none text-white">{overall != null ? `${overall}%` : "—"}</div>
            <div className="pb-1">
              <div className={`text-sm font-semibold ${bandOf(readiness?.band).text}`}>{readiness?.band || "No results yet"}</div>
              <div className="text-xs text-zinc-500">
                {readiness?.subjects.length ? `average of ${readiness.subjects.length} subject${readiness.subjects.length > 1 ? "s" : ""}` : "log a result to see it"}
              </div>
            </div>
          </div>

          {readiness?.subjects.length ? (
            <ul className="divide-y divide-white/[0.06]">
              {readiness.subjects.map((s) => {
                const b = bandOf(s.band);
                return (
                  <li key={s.subject} className="p-4 sm:px-5">
                    <div className="flex items-center gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{s.subject}</div>
                        <div className="text-xs text-zinc-500">
                          {s.results} result{s.results > 1 ? "s" : ""} · latest {s.latest}%
                          {s.confidence && <> · you feel {s.confidence}</>}
                        </div>
                      </div>
                      <div className={`font-display text-lg font-bold ${b.text}`}>{s.readiness}%</div>
                    </div>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className={`h-full rounded-full ${b.bar}`} style={{ width: `${s.readiness}%` }} />
                    </div>
                    {s.check === "overconfident" && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-rose-300">
                        <AlertTriangle size={13} className="mt-0.5 shrink-0" /> You feel High, but your marks say {s.readiness}%. Revise this one.
                      </div>
                    )}
                    {s.check === "underconfident" && (
                      <div className="mt-2 flex items-start gap-1.5 text-xs text-emerald-300">
                        <ThumbsUp size={13} className="mt-0.5 shrink-0" /> You feel Low, but you score {s.readiness}%. You're ready — focus on weaker subjects.
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="p-5 text-sm text-zinc-400">Log your class tests and exam marks to see readiness per subject.</div>
          )}
        </Card>
      </motion.section>

      {/* ===== Exam plan ===== */}
      <motion.section variants={item}>
        <SectionHead title="Exam plan">
          <span className="text-xs text-zinc-500">tap how confident you feel</span>
        </SectionHead>
        <Card variants={null} className="p-0">
          {plan.length === 0 ? (
            <button onClick={() => setShowAddPrep(true)} className="flex w-full items-center gap-3 p-5 text-left text-sm text-zinc-400 hover:text-white">
              <CalendarPlus size={18} /> Add your exams to get countdowns
            </button>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {plan.map((sub) => {
                const d = sub.examDate ? daysUntil(sub.examDate) : null;
                const soon = d !== null && d >= 0 && d <= 5;
                return (
                  <li key={sub._id} className="p-4 sm:px-5">
                    <div className="flex items-start gap-3">
                      <div
                        className={`grid h-12 w-12 shrink-0 place-items-center rounded-xl text-center leading-none ${
                          soon ? "bg-rose-500/15 text-rose-300" : "bg-white/[0.05] text-white"
                        }`}
                      >
                        {d === null ? (
                          <span className="text-[10px] text-zinc-500">no date</span>
                        ) : d < 0 ? (
                          <span className="text-[11px] font-semibold text-zinc-500">done</span>
                        ) : (
                          <div>
                            <div className="font-display text-lg font-bold">{d}</div>
                            <div className="text-[9px] uppercase tracking-wider opacity-70">{d === 1 ? "day" : "days"}</div>
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{sub.subject}</div>
                        {editId === sub._id ? (
                          <div className="mt-1.5 flex items-center gap-1.5">
                            <input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input !py-1.5 text-xs" />
                            <button
                              onClick={async () => {
                                await updatePrep(sub._id, { examDate: editDate || null });
                                setEditId(null);
                              }}
                              className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-black"
                              aria-label="Save date"
                            >
                              <Check size={15} />
                            </button>
                            <button onClick={() => setEditId(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-zinc-300" aria-label="Cancel">
                              <X size={15} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditId(sub._id);
                              setEditDate(sub.examDate ? new Date(sub.examDate).toISOString().slice(0, 10) : "");
                            }}
                            className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500 hover:text-white"
                          >
                            {sub.examDate
                              ? new Date(sub.examDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" })
                              : "Set exam date"}
                            <Pencil size={11} />
                          </button>
                        )}
                      </div>

                      <button
                        onClick={() => setConfirmDelete(sub)}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-600 hover:bg-rose-500/10 hover:text-rose-300"
                        aria-label={`Delete ${sub.subject}`}
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>

                    <div className="mt-3 sm:ml-[3.75rem]">
                      <Segmented
                        size="sm"
                        value={sub.confidence}
                        onChange={(v) => v !== sub.confidence && updatePrep(sub._id, { confidence: v })}
                        options={CONFIDENCE.map((x) => ({ value: x, label: x === "Medium" ? "Med" : x }))}
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </motion.section>

      {/* ===== History ===== */}
      {trendData.length > 0 && (
        <motion.section variants={item}>
          <SectionHead title="Results history">
            <span className="text-xs text-zinc-500">{results.length} logged</span>
          </SectionHead>
          <Card variants={null} className="p-4 sm:p-5">
            <div className="h-48 sm:h-56">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ left: -22, right: 6, top: 8 }}>
                  <defs>
                    <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#FFD60A" stopOpacity={0.18} />
                      <stop offset="100%" stopColor="#FFD60A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="x" tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} minTickGap={16} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#71717a", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
                  <Area type="monotone" dataKey="y" stroke="#FFD60A" strokeWidth={2} fill="url(#trendFill)" dot={{ r: 3, fill: "#FFD60A", strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </motion.section>
      )}

      {/* ===== Modals ===== */}
      <Modal open={showResult} onClose={() => setShowResult(false)} title="Log a result" subtitle="Class tests, mocks and finals all count towards readiness.">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g., Power Systems" className="input" list="subject-list" required />
            <datalist id="subject-list">
              {knownSubjects.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Marks</label>
              <input type="number" inputMode="decimal" min="0" step="any" value={marks} onChange={(e) => setMarks(e.target.value)} placeholder="42" className="input" required />
            </div>
            <div>
              <label className="label">Out of</label>
              <input type="number" inputMode="decimal" min="1" step="any" value={totalMarks} onChange={(e) => setTotalMarks(e.target.value)} placeholder="50" className="input" required />
            </div>
          </div>
          <div>
            <label className="label">Exam date</label>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input" />
          </div>
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="font-display text-2xl font-bold text-white">{previewPct != null ? `${previewPct}%` : ""}</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => setShowResult(false)} className="btn-ghost">Cancel</button>
              <button type="submit" className="btn-primary">Save</button>
            </div>
          </div>
        </form>
      </Modal>

      <Modal open={showAddPrep} onClose={() => setShowAddPrep(false)} title="Add an exam" subtitle="You'll get a countdown on your dashboard.">
        <form onSubmit={handleAddPrep} className="space-y-4">
          <div>
            <label className="label">Subject</label>
            <input value={prepSubject} onChange={(e) => setPrepSubject(e.target.value)} placeholder="e.g., Control Systems" className="input" list="subject-list" required />
          </div>
          <div>
            <label className="label">Exam date</label>
            <input type="date" value={prepDate} onChange={(e) => setPrepDate(e.target.value)} className="input" />
          </div>
          <div>
            <label className="label">How confident do you feel?</label>
            <Segmented value={prepConfidence} onChange={setPrepConfidence} options={CONFIDENCE} />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={() => setShowAddPrep(false)} className="btn-ghost">Cancel</button>
            <button type="submit" className="btn-primary">Add</button>
          </div>
        </form>
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        title="Delete this exam?"
        subtitle={`"${confirmDelete?.subject}" will be removed from your plan. Your results stay.`}
        width="max-w-md"
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Keep</button>
          <button onClick={() => deletePrep(confirmDelete._id)} className="btn-danger">
            <Trash2 size={15} /> Delete
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
