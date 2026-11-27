import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, AlertOctagon, Info, RefreshCw, ArrowLeft } from "lucide-react";
import API from "../api";
import { Brand } from "../components/NavSidebar.jsx";
import AccountMenu from "../components/AccountMenu.jsx";
import AuroraBackground from "../components/AuroraBackground.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { examWhen, relative } from "../utils/exams.js";

// ---- chart tokens (validated: single series = brand yellow; two series = #c98500 + #3987e5 on #16161a) ----
const ACCENT = "#FFD60A";
const SERIES = { posts: "#c98500", comments: "#3987e5" };
const STATUS = { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b", neutral: "#71717a" };
const AXIS = { fill: "#a1a1aa", fontSize: 11 };
const GRID = "rgba(255,255,255,0.06)";

const shortDay = (k) => new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });

function Panel({ title, sub, children, className = "" }) {
  return (
    <motion.section variants={item} className={`rounded-2xl border border-white/[0.08] bg-ink-800 p-4 sm:p-5 ${className}`}>
      <div className="mb-3">
        <h2 className="font-display text-base font-bold text-white">{title}</h2>
        {sub && <p className="text-xs text-zinc-500">{sub}</p>}
      </div>
      {children}
    </motion.section>
  );
}

function Tile({ label, value, sub }) {
  return (
    <div className="rounded-2xl border border-white/[0.08] bg-ink-800 p-4">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-1 font-display text-3xl font-bold text-white">{value}</div>
      {sub && <div className="mt-0.5 truncate text-xs text-zinc-400">{sub}</div>}
    </div>
  );
}

// One tooltip for every chart: label + values in text ink, colored dot carries identity
function Tip({ active, payload, label, fmt }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-ink-900 px-3 py-2 text-xs shadow-xl">
      <div className="mb-1 font-semibold text-white">{fmt ? fmt(label) : label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} className="flex items-center gap-2 text-zinc-300">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          {p.name}: <span className="font-semibold text-white">{p.value}</span>
        </div>
      ))}
    </div>
  );
}

// Horizontal proportion bar + legend with counts (identity never by color alone)
function StatusBar({ parts }) {
  const total = parts.reduce((t, p) => t + p.n, 0);
  return (
    <div>
      <div className="flex h-3 w-full gap-[2px] overflow-hidden rounded" role="img" aria-label={parts.map((p) => `${p.label} ${p.n}`).join(", ")}>
        {total === 0 ? (
          <div className="h-full w-full bg-white/[0.06]" />
        ) : (
          parts.filter((p) => p.n > 0).map((p) => <div key={p.label} title={`${p.label}: ${p.n}`} className="h-full first:rounded-l last:rounded-r" style={{ width: `${(p.n / total) * 100}%`, background: p.color }} />)
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm sm:grid-cols-3">
        {parts.map((p) => (
          <li key={p.label} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: p.color }} />
            <span className="truncate text-zinc-300">{p.label}</span>
            <span className="ml-auto font-semibold tabular-nums text-white">{p.n}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

const LEVEL = {
  critical: { icon: AlertOctagon, color: STATUS.critical, label: "Critical" },
  serious: { icon: AlertTriangle, color: STATUS.serious, label: "Needs action" },
  warning: { icon: Info, color: STATUS.warning, label: "Heads up" },
};

export default function OwnerDashboard() {
  const [d, setD] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    API.get("/owner/overview")
      .then(({ data }) => {
        setD(data);
        setError(null);
      })
      .catch((e) => setError(e.response?.status === 404 ? "This page is only for the PrepTrack owner." : "Couldn't load the overview."))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  const signupsCumulative = (() => {
    if (!d) return [];
    // signups only covers 60 days; start from the accounts that existed before that
    const before = d.users.students - d.users.signups.reduce((t, x) => t + x.n, 0);
    let run = before;
    return d.users.signups.map((x) => ({ day: x.day, total: (run += x.n) }));
  })();
  const forumWeeks = d ? d.forum.postsPerWeek.map((w, i) => ({ week: w.week, posts: w.n, comments: d.forum.commentsPerWeek[i]?.n || 0 })) : [];

  return (
    <div className="relative min-h-screen text-zinc-100">
      <AuroraBackground />
      <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/95">
        <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 md:h-16 md:px-8">
          <Brand compact />
          <div className="min-w-0 leading-tight">
            <div className="font-display text-sm font-bold uppercase tracking-wide text-white">Owner dashboard</div>
            <div className="truncate text-[11px] text-zinc-500">{d ? `Updated ${new Date(d.generatedAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}` : "PrepTrack"}</div>
          </div>
          <div className="ml-auto flex items-center gap-1.5">
            <button onClick={load} className="btn-ghost !min-h-[36px] !px-3 !py-1.5 text-xs" aria-label="Refresh">
              <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> <span className="hidden sm:inline">Refresh</span>
            </button>
            <AccountMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 pb-16 pt-5 md:px-8 md:pt-8">
        {error ? (
          <div className="rounded-2xl border border-white/10 bg-ink-800 p-6 text-sm text-zinc-300">
            {error}{" "}
            <Link to="/" className="font-semibold text-accent">
              Go home
            </Link>
          </div>
        ) : !d ? (
          <div className="space-y-4">
            <Skeleton className="h-24" />
            <Skeleton className="h-64" />
            <Skeleton className="h-64" />
          </div>
        ) : (
          <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
            <motion.div variants={item}>
              <Link to="/" className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-white">
                <ArrowLeft size={13} /> Back to the app
              </Link>
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">Everything at a glance</h1>
              <p className="text-sm text-zinc-400">Totals and trends across all classes. No individual student's logins.</p>
            </motion.div>

            {/* headline numbers */}
            <motion.div variants={item} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <Tile label="Students" value={d.users.students} sub={`${d.users.crs} CRs${d.users.demoAccounts ? ` · ${d.users.demoAccounts} demo` : ""}`} />
              <Tile label="Active this week" value={d.users.active7} sub={`${d.users.students ? Math.round((d.users.active7 / d.users.students) * 100) : 0}% of students`} />
              <Tile label="Uploads" value={d.content.total} sub={`${d.content.byStatus.pending} waiting for review`} />
              <Tile label="Forum posts" value={d.forum.discussions} sub={`${forumWeeks.at(-1)?.comments || 0} comments this week`} />
              <Tile label="Upcoming exams" value={d.exams.upcoming} sub={`${d.announcements30} announcements in 30 days`} />
            </motion.div>

            {/* needs attention */}
            <Panel title="Needs attention" sub={d.attention.length ? "Most urgent first" : undefined}>
              {d.attention.length === 0 ? (
                <p className="flex items-center gap-2 text-sm text-zinc-300">
                  <span className="h-2 w-2 rounded-full" style={{ background: STATUS.good }} /> All good — nothing needs you right now.
                </p>
              ) : (
                <ul className="space-y-2">
                  {d.attention.map((a, i) => {
                    const L = LEVEL[a.level] || LEVEL.warning;
                    return (
                      <li key={i} className="flex items-start gap-3 rounded-xl border border-white/[0.06] bg-ink-900 p-3 text-sm">
                        <L.icon size={17} className="mt-0.5 shrink-0" style={{ color: L.color }} />
                        <div>
                          <span className="mr-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: L.color }}>
                            {L.label}
                          </span>
                          <span className="text-zinc-200">{a.text}</span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Daily active students" sub="Accounts that signed in each day · last 30 days">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={d.users.dailyActive} margin={{ left: -20, right: 8, top: 8 }}>
                      <defs>
                        <linearGradient id="dauFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={ACCENT} stopOpacity={0.22} />
                          <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip fmt={shortDay} />} cursor={{ stroke: "rgba(255,255,255,0.25)" }} />
                      <Area type="monotone" dataKey="n" name="Active students" stroke={ACCENT} strokeWidth={2} fill="url(#dauFill)" dot={false} activeDot={{ r: 5, stroke: "#16161a", strokeWidth: 2 }} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Students over time" sub="Total accounts · last 60 days">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={signupsCumulative} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="day" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={24} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip fmt={shortDay} />} cursor={{ stroke: "rgba(255,255,255,0.25)" }} />
                      <Line type="stepAfter" dataKey="total" name="Students" stroke={ACCENT} strokeWidth={2} dot={false} activeDot={{ r: 5, stroke: "#16161a", strokeWidth: 2 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Uploads per week" sub="Notes, slides and PYQs · last 12 weeks">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={d.content.uploadsPerWeek} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="week" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip fmt={(w) => `Week of ${shortDay(w)}`} />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                      <Bar dataKey="n" name="Uploads" fill={ACCENT} radius={[4, 4, 0, 0]} maxBarSize={28} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Forum activity per week" sub="New questions and comments · last 12 weeks">
                <div className="mb-2 flex gap-4 text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES.posts }} /> Questions</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES.comments }} /> Comments</span>
                </div>
                <div className="h-52">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forumWeeks} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="week" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip fmt={(w) => `Week of ${shortDay(w)}`} />} cursor={{ stroke: "rgba(255,255,255,0.25)" }} />
                      <Line type="monotone" dataKey="posts" name="Questions" stroke={SERIES.posts} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: SERIES.posts }} />
                      <Line type="monotone" dataKey="comments" name="Comments" stroke={SERIES.comments} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: SERIES.comments }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </Panel>

              <Panel title="Uploads by status" sub={`${d.content.total} total · oldest waiting ${d.content.oldestPendingHours ? `${d.content.oldestPendingHours} h` : "—"}`}>
                <StatusBar
                  parts={[
                    { label: "Approved", n: d.content.byStatus.approved, color: STATUS.good },
                    { label: "Pending", n: d.content.byStatus.pending, color: STATUS.warning },
                    { label: "Rejected", n: d.content.byStatus.rejected, color: STATUS.critical },
                    { label: "Reported", n: d.content.byStatus.reported, color: STATUS.serious },
                    { label: "Needs revision", n: d.content.byStatus.revision, color: STATUS.neutral },
                  ]}
                />
                <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400">
                  <span className="rounded-full border border-white/10 px-2.5 py-1">Notes {d.content.byType.note || 0}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1">Slides {d.content.byType.ppt || 0}</span>
                  <span className="rounded-full border border-white/10 px-2.5 py-1">PYQs {d.content.byType.pyq || 0}</span>
                </div>
              </Panel>

            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Upcoming exams" sub={`${d.exams.upcoming} upcoming · ${d.exams.total} posted in total`} className="lg:col-span-2">
                {d.exams.next.length === 0 ? (
                  <p className="text-sm text-zinc-400">No upcoming exams posted.</p>
                ) : (
                  <ul className="divide-y divide-white/[0.06]">
                    {d.exams.next.map((e) => (
                      <li key={e._id} className="flex items-center gap-3 py-2.5 text-sm">
                        <div className="min-w-0 flex-1">
                          <div className="truncate font-semibold text-white">
                            {e.subject} <span className="font-normal text-zinc-400">· {e.type}</span>
                          </div>
                          <div className="text-xs text-zinc-500">
                            {e.branch} {e.batch} · {examWhen(e.date)}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-300">{relative(e.date)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Security" sub="Sign-ins and passwords">
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  {[
                    ["Failed sign-ins", d.security.failed7, "7 days"],
                    ["Lockouts", d.security.locks30, "30 days"],
                    ["Password resets", d.security.resets30, "30 days"],
                    ["Locked now", d.security.lockedNow, "accounts"],
                  ].map(([label, n, note]) => (
                    <div key={label} className="rounded-xl border border-white/[0.06] bg-ink-900 p-3">
                      <dt className="text-xs text-zinc-500">{label}</dt>
                      <dd className="font-display text-2xl font-bold text-white">{n}</dd>
                      <dd className="text-[11px] text-zinc-500">{note}</dd>
                    </div>
                  ))}
                </dl>
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Classes" sub="Students and CRs per class" className="lg:col-span-2">
                <table className="w-full text-left text-sm">
                  <thead className="text-[11px] uppercase tracking-wider text-zinc-500">
                    <tr>
                      <th className="pb-2 font-semibold">Class</th>
                      <th className="pb-2 text-right font-semibold">Students</th>
                      <th className="pb-2 text-right font-semibold">CRs</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.users.classes.map((c) => (
                      <tr key={`${c.branch}-${c.batch}`} className="border-t border-white/[0.06]">
                        <td className="py-2 text-white">
                          {c.branch} {c.batch}
                        </td>
                        <td className="py-2 text-right tabular-nums text-zinc-200">{c.students}</td>
                        <td className="py-2 text-right tabular-nums" style={{ color: c.crs ? undefined : STATUS.critical }}>
                          {c.crs || "none"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <p className="mt-3 text-xs text-zinc-500">
                  {d.xpTotal} XP earned in total · {d.users.active30} students active in the last 30 days
                </p>
              </Panel>

              <Panel title="Database storage" sub="MongoDB Atlas free tier">
                <div className="font-display text-2xl font-bold text-white">
                  {d.storage.usedMB} <span className="text-sm font-normal text-zinc-400">of {d.storage.limitMB} MB</span>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(1, Math.min(100, (d.storage.usedMB / d.storage.limitMB) * 100))}%`,
                      background: d.storage.usedMB / d.storage.limitMB > 0.8 ? STATUS.critical : ACCENT,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-zinc-500">Uploaded files live in Vercel Blob and don't count here.</p>
              </Panel>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
