import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Users, Search, Mail, Hash, GraduationCap, Gauge, LineChart, UserSearch, ShieldCheck, ShieldOff } from "lucide-react";
import API from "../../api";
import { useUser } from "../../context/UserContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Segmented from "../../components/ui/Segmented.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import ProgressRing from "../../components/ui/ProgressRing.jsx";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container } from "../../components/ui/motion.js";
import { confidenceOf, shortDate } from "../../utils/ui.js";

export default function AdminStudents() {
  const [students, setStudents] = useState([]);
  const [progressData, setProgressData] = useState([]);
  const [selected, setSelected] = useState(null);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("name");
  const [confirmRole, setConfirmRole] = useState(null);
  const { user: me } = useUser();
  const toast = useToast();

  // Promote a student to CR (admin role) or step a CR down
  const changeRole = async () => {
    const role = confirmRole;
    setConfirmRole(null);
    try {
      const { data } = await API.put(`/users/${selected._id}/role`, { role });
      setStudents((prev) => prev.map((u) => (u._id === data._id ? { ...u, role: data.role } : u)));
      setSelected((s) => ({ ...s, role: data.role }));
      toast({
        title: role === "admin" ? `${data.name} is now a CR` : `${data.name} is no longer a CR`,
        description: role === "admin" ? "They need to log out and back in to see the admin portal." : undefined,
      });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't change role" });
    }
  };

  // Fetch users and progress
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [userRes, progressRes] = await Promise.all([API.get("/users/all"), API.get("/progress/all")]);
        setStudents(userRes.data);
        setProgressData(progressRes.data);
      } catch (err) {
        console.error("Error fetching students:", err);
        setError("Unable to load student data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Load the selected student's exam results
  useEffect(() => {
    if (!selected) return;
    setResults([]);
    API.get(`/result/${selected._id}`)
      .then((res) => setResults(res.data || []))
      .catch(() => setResults([]));
  }, [selected]);

  const getStudentProgress = (id) => progressData.find((p) => p.userId === id) || { progressPercent: 0, confidence: "Unknown" };

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    const l = students.filter((s) => !q || [s.name, s.email, s.branch, s.rollNumber].some((v) => String(v || "").toLowerCase().includes(q)));
    return sort === "progress"
      ? [...l].sort((a, b) => getStudentProgress(b._id).progressPercent - getStudentProgress(a._id).progressPercent)
      : [...l].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  }, [students, query, sort, progressData]); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-80" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[380px,1fr]">
          <Skeleton className="h-[28rem]" />
          <Skeleton className="h-[28rem]" />
        </div>
      </div>
    );
  if (error) return <EmptyState icon={Users} title="Couldn't load students" text={error} />;

  const learners = students.filter((u) => u.role !== "admin");
  const avg = learners.length ? Math.round(learners.reduce((s, u) => s + (getStudentProgress(u._id).progressPercent || 0), 0) / learners.length) : 0;
  const byConf = ["High", "Medium", "Low"].map((c) => learners.filter((u) => getStudentProgress(u._id).confidence === c).length);
  const sp = selected ? getStudentProgress(selected._id) : null;
  const avgResult = results.length ? Math.round(results.reduce((s, r) => s + (r.percentage || 0), 0) / results.length) : 0;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader icon={Users} eyebrow="People" title="Students & CRs" subtitle="See how every student is preparing, and pick up to 2 CRs for your batch. You only see your own batch." gradient="from-cyan-400 to-blue-600" />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Card className="p-5">
          <div className="text-sm text-slate-400">Students</div>
          <div className="mt-1 font-display text-3xl font-bold text-white"><AnimatedNumber value={learners.length} /></div>
          <div className="text-xs text-slate-500">{students.length - learners.length} CRs</div>
        </Card>
        <Card className="p-5">
          <div className="text-sm text-slate-400">Average readiness</div>
          <div className="mt-1 font-display text-3xl font-bold text-white"><AnimatedNumber value={avg} suffix="%" /></div>
        </Card>
        <Card className="col-span-2 p-5">
          <div className="text-sm text-slate-400">Confidence split</div>
          <div className="mt-3 flex h-3 overflow-hidden rounded-full bg-white/10">
            {["High", "Medium", "Low"].map((c, i) => (
              <motion.div
                key={c}
                className={`h-full bg-gradient-to-r ${confidenceOf(c).bar}`}
                initial={{ width: 0 }}
                animate={{ width: `${learners.length ? (byConf[i] / learners.length) * 100 : 0}%` }}
                transition={{ duration: 1, delay: i * 0.1 }}
              />
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-xs">
            {["High", "Medium", "Low"].map((c, i) => (
              <span key={c} className={confidenceOf(c).text}>
                {c}: <b>{byConf[i]}</b>
              </span>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[400px,1fr]">
        {/* Student list */}
        <Card className="p-3" spotlight={false}>
          <div className="mb-2 flex gap-2 p-1">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search students…" className="input !py-2 pl-9" />
            </div>
            <Segmented size="sm" value={sort} onChange={setSort} options={[{ value: "name", label: "A–Z" }, { value: "progress", label: "Top" }]} />
          </div>
          <div className="max-h-[32rem] space-y-1 overflow-y-auto pr-1">
            {list.map((s) => {
              const p = getStudentProgress(s._id);
              const active = selected?._id === s._id;
              return (
                <motion.button
                  key={s._id}
                  layout
                  onClick={() => setSelected(s)}
                  className={`w-full rounded-2xl px-3 py-3 text-left transition ${active ? "border border-cyan-400/30 bg-cyan-500/10" : "border border-transparent hover:bg-white/[0.04]"}`}
                >
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} size={36} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 truncate font-semibold text-white">
                        {s.name}
                        {s.role === "admin" && <ShieldCheck size={13} className="shrink-0 text-cyan-300" aria-label="CR" />}
                      </div>
                      <div className="text-xs text-slate-500">{s.branch || "N/A"}</div>
                    </div>
                    <div className="font-display font-bold text-white">{p.progressPercent}%</div>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-violet-400"
                      initial={{ width: 0 }}
                      animate={{ width: `${p.progressPercent}%` }}
                      transition={{ duration: 0.9 }}
                    />
                  </div>
                </motion.button>
              );
            })}
            {list.length === 0 && <p className="p-4 text-center text-sm text-slate-500">No students match.</p>}
          </div>
        </Card>

        {/* Student details */}
        <AnimatePresence mode="wait">
          {selected ? (
            <motion.div key={selected._id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.2 }} className="space-y-4">
              <div className="glass p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <Avatar name={selected.name} size={72} ring />
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold text-white">
                      {selected.name}
                      {selected.role === "admin" && (
                        <span className="chip !border-cyan-400/30 !bg-cyan-400/10 !text-cyan-200">
                          <ShieldCheck size={12} /> CR
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2 text-sm">
                      <span className="chip"><Mail size={12} /> {selected.email}</span>
                      {selected.rollNumber && <span className="chip"><Hash size={12} /> {selected.rollNumber}</span>}
                      <span className="chip"><GraduationCap size={12} /> {selected.branch || "N/A"}</span>
                    </div>
                  </div>
                  {selected._id !== me?._id &&
                    (selected.role === "admin" ? (
                      <button onClick={() => setConfirmRole("student")} className="btn-danger shrink-0">
                        <ShieldOff size={15} /> Remove CR
                      </button>
                    ) : (
                      <button onClick={() => setConfirmRole("admin")} className="btn-ghost shrink-0">
                        <ShieldCheck size={15} /> Make CR
                      </button>
                    ))}
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px,1fr]">
                <div className="glass p-6 text-center">
                  <div className="section-title mb-4 justify-center text-base"><Gauge size={16} className="text-cyan-300" /> Readiness</div>
                  <ProgressRing value={sp.progressPercent} size={150} stroke={12} from="#22d3ee" to="#a78bfa" />
                  <span className={`chip mt-4 ${confidenceOf(sp.confidence).chip}`}>{sp.confidence} confidence</span>
                </div>
                <div className="glass p-6">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="section-title text-base"><LineChart size={16} className="text-violet-300" /> Exam results</div>
                    {results.length > 0 && <span className="chip">avg {avgResult}%</span>}
                  </div>
                  {results.length === 0 ? (
                    <p className="py-10 text-center text-sm text-slate-500">No results uploaded yet.</p>
                  ) : (
                    <>
                      <div className="h-40">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={results.map((r) => ({ x: shortDate(r.uploadedAt), y: r.percentage, subject: r.subject }))} margin={{ left: -24, right: 6, top: 6 }}>
                            <defs>
                              <linearGradient id="stuFill" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#22d3ee" stopOpacity={0.5} />
                                <stop offset="100%" stopColor="#22d3ee" stopOpacity={0} />
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="x" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                            <Tooltip
                              content={({ active, payload }) =>
                                active && payload?.length ? (
                                  <div className="glass-strong !rounded-xl px-3 py-2 text-xs text-white">
                                    {payload[0].payload.subject}: <b>{payload[0].value}%</b>
                                  </div>
                                ) : null
                              }
                            />
                            <Area type="monotone" dataKey="y" stroke="#22d3ee" strokeWidth={2.5} fill="url(#stuFill)" dot={{ r: 3, fill: "#22d3ee" }} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {results.slice(-4).map((r) => (
                          <span key={r._id} className="chip">
                            {r.subject}: <b className="text-white">{r.percentage}%</b>
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <EmptyState icon={UserSearch} title="Select a student" text="Pick someone on the left to see their readiness and results." />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        open={!!confirmRole}
        onClose={() => setConfirmRole(null)}
        width="max-w-md"
        title={confirmRole === "admin" ? `Make ${selected?.name} a CR?` : `Remove ${selected?.name} as CR?`}
        subtitle={
          confirmRole === "admin"
            ? "CRs can approve or reject uploads, publish announcements and flag students — all only for your batch. A batch can have at most 2 CRs."
            : "They'll go back to a regular student account. This is recorded in the security logs."
        }
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmRole(null)} className="btn-ghost">Cancel</button>
          <button onClick={changeRole} className={confirmRole === "admin" ? "btn-primary" : "btn-danger"}>
            {confirmRole === "admin" ? <><ShieldCheck size={15} /> Make CR</> : <><ShieldOff size={15} /> Remove</>}
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
