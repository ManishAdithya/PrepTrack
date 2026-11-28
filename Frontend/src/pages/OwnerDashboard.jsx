import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, AlertOctagon, Info, RefreshCw, ArrowLeft, ShieldCheck } from "lucide-react";
import API from "../api";
import { Brand } from "../components/NavSidebar.jsx";
import AccountMenu from "../components/AccountMenu.jsx";
import AuroraBackground from "../components/AuroraBackground.jsx";
import FeedbackInbox from "../components/FeedbackInbox.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { examWhen, relative } from "../utils/exams.js";

// ---- chart tokens (validated: single series = brand yellow; two series = #c98500 + #3987e5 on #16161a) ----
const ACCENT = "#FFD60A";
const SERIES = { posts: "#c98500", comments: "#3987e5" };
const STATUS = { good: "#0ca30c", warning: "#fab219", serious: "#ec835a", critical: "#d03b3b", neutral: "#71717a" };
const AXIS = { fill: "#a1a1aa", fontSize: 11 };
const GRID = "rgba(255,255,255,0.06)";

// what was uploaded: a shared link or a file of some kind
const KINDS = [
  { key: "link", label: "Links" },
  { key: "pdf", label: "PDFs" },
  { key: "ppt", label: "PPTs" },
  { key: "photo", label: "Photos" },
  { key: "doc", label: "Word" },
  { key: "file", label: "Other files" },
];
const TYPES = [
  { key: "note", label: "Notes" },
  { key: "ppt", label: "Slides" },
  { key: "pyq", label: "PYQs" },
  { key: "other", label: "Other" },
];

const shortDay = (k) => new Date(k + "T00:00:00").toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const shortDate = (d) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
const pct = (n, of) => (of ? Math.round((n / of) * 100) : 0);
// "just now", "3 h ago", "yesterday", "5 days ago"
const ago = (d) => {
  const mins = Math.round((Date.now() - new Date(d)) / 60000);
  if (mins < 60) return mins <= 1 ? "just now" : `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
};

function Panel({ title, sub, children, className = "", right }) {
  return (
    <motion.section variants={item} className={`rounded-2xl border border-white/[0.08] bg-ink-800 p-4 sm:p-5 ${className}`}>
      <div className="mb-3 flex flex-wrap items-start gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-base font-bold text-white">{title}</h2>
          {sub && <p className="text-xs text-zinc-500">{sub}</p>}
        </div>
        {right}
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

// small labelled number inside a panel
function Stat({ label, value, note }) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-ink-900 p-3">
      <dt className="text-xs text-zinc-500">{label}</dt>
      <dd className="font-display text-2xl font-bold tabular-nums text-white">{value}</dd>
      {note && <dd className="text-[11px] text-zinc-500">{note}</dd>}
    </div>
  );
}

// label · count chips
function Chips({ items }) {
  return (
    <div className="flex flex-wrap gap-2 text-xs text-zinc-400">
      {items.map(([label, n]) => (
        <span key={label} className="rounded-full border border-white/10 px-2.5 py-1">
          {label} <span className="font-semibold text-white">{n}</span>
        </span>
      ))}
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

// ranked list with a thin bar showing each row's share of the top value
function RankList({ rows, empty }) {
  if (!rows.length) return <p className="text-sm text-zinc-400">{empty}</p>;
  const top = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ol className="space-y-2.5">
      {rows.map((r, i) => (
        <li key={r.key ?? i} className="text-sm">
          <div className="flex items-baseline gap-2">
            <span className="w-4 shrink-0 text-xs tabular-nums text-zinc-500">{i + 1}</span>
            <span className="min-w-0 flex-1 truncate text-zinc-100">{r.label}</span>
            <span className="shrink-0 tabular-nums font-semibold text-white">{r.valueLabel ?? r.value}</span>
          </div>
          {r.sub && <div className="ml-6 text-[11px] text-zinc-500">{r.sub}</div>}
          <div className="ml-6 mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
            <div className="h-full rounded-full" style={{ width: `${(r.value / top) * 100}%`, background: ACCENT }} />
          </div>
        </li>
      ))}
    </ol>
  );
}

const LEVEL = {
  critical: { icon: AlertOctagon, color: STATUS.critical, label: "Critical" },
  serious: { icon: AlertTriangle, color: STATUS.serious, label: "Needs action" },
  warning: { icon: Info, color: STATUS.warning, label: "Heads up" },
};

// Every subject the CRs added, semester by semester, with what was uploaded under each
function SubjectsBySemester({ semesters, noSemester }) {
  const withSubjects = semesters.filter((s) => s.subjects.length || s.unsorted);
  const busiest = [...withSubjects].sort((a, b) => b.uploads - a.uploads)[0];
  const [sem, setSem] = useState(busiest?.semester || 1);
  const row = semesters.find((s) => s.semester === sem) || semesters[0];
  const lines = [...row.subjects, ...(row.unsorted ? [{ _id: "unsorted", name: "Unsorted", unsorted: true, ...row.unsorted }] : [])];
  // only show file columns that have something in this semester (links always)
  const cols = KINDS.filter((k) => k.key === "link" || lines.some((l) => l.kinds[k.key]));
  const sum = (key) => lines.reduce((t, l) => t + (l.kinds[key] || 0), 0);
  const total = lines.reduce((t, l) => t + l.total, 0);

  return (
    <div>
      <Segmented
        size="sm"
        value={sem}
        onChange={setSem}
        options={semesters.map((s) => ({ value: s.semester, label: `S${s.semester}`, count: s.subjects.length || null }))}
      />
      <p className="mt-3 text-xs text-zinc-500">
        S{row.semester}: {row.subjects.length} subject{row.subjects.length === 1 ? "" : "s"} · {total} upload{total === 1 ? "" : "s"}
        {row.subjects.length > 0 && ` · ${row.subjects.filter((s) => s.total === 0).length} with nothing yet`}
      </p>

      {lines.length === 0 ? (
        <p className="mt-3 rounded-xl border border-white/[0.06] bg-ink-900 p-4 text-sm text-zinc-400">The CRs haven't added any S{row.semester} subjects yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="pb-2 font-semibold">Subject</th>
                {cols.map((c) => (
                  <th key={c.key} className="pb-2 text-right font-semibold">
                    {c.label}
                  </th>
                ))}
                <th className="pb-2 text-right font-semibold">Total</th>
              </tr>
            </thead>
            <tbody>
              {lines.map((l) => (
                <tr key={l._id} className="border-t border-white/[0.06] align-top">
                  <td className="py-2.5 pr-3">
                    <div className={`font-semibold ${l.unsorted ? "text-zinc-400" : "text-white"}`}>
                      {l.name} {l.code && <span className="ml-1 text-xs font-normal text-zinc-500">{l.code}</span>}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {l.unsorted
                        ? "Files whose subject was removed"
                        : `Added by ${l.createdBy || "a CR"}${l.createdAt ? ` · ${shortDate(l.createdAt)}` : ""}`}
                      {l.lastUpload && ` · last upload ${shortDate(l.lastUpload)}`}
                    </div>
                    {l.total > 0 && (
                      <div className="mt-1 text-[11px] text-zinc-500">
                        {TYPES.filter((t) => l.types[t.key]).map((t) => `${t.label} ${l.types[t.key]}`).join(" · ")}
                      </div>
                    )}
                  </td>
                  {cols.map((c) => (
                    <td key={c.key} className={`py-2.5 text-right tabular-nums ${l.kinds[c.key] ? "text-zinc-100" : "text-zinc-600"}`}>
                      {l.kinds[c.key] || "–"}
                    </td>
                  ))}
                  <td className="py-2.5 text-right">
                    <div className={`font-semibold tabular-nums ${l.total ? "text-white" : "text-zinc-600"}`}>{l.total || "0"}</div>
                    {l.total > 0 && (
                      <div className="text-[11px] text-zinc-500">
                        {l.live} live{l.pending ? ` · ${l.pending} pending` : ""}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-white/15 text-zinc-300">
                <td className="py-2.5 font-semibold">All of S{row.semester}</td>
                {cols.map((c) => (
                  <td key={c.key} className="py-2.5 text-right font-semibold tabular-nums">
                    {sum(c.key)}
                  </td>
                ))}
                <td className="py-2.5 text-right font-semibold tabular-nums text-white">{total}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
      {noSemester?.total > 0 && <p className="mt-3 text-xs text-zinc-500">{noSemester.total} older upload{noSemester.total > 1 ? "s have" : " has"} no semester and isn't counted above.</p>}
    </div>
  );
}

// Every student in the class with what they've done; search and sort
const ROSTER_SORTS = [
  { value: "roll", label: "Roll no.", by: (a, b) => a.rollNumber.localeCompare(b.rollNumber) },
  { value: "name", label: "Name", by: (a, b) => a.name.localeCompare(b.name) },
  { value: "xp", label: "XP", by: (a, b) => b.xp - a.xp || b.uploads - a.uploads },
  { value: "uploads", label: "Uploads", by: (a, b) => b.uploads - a.uploads || b.xp - a.xp },
  { value: "seen", label: "Last sign-in", by: (a, b) => new Date(b.lastSeen || 0) - new Date(a.lastSeen || 0) },
];

function StudentRoster({ roster }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("roll");
  const rows = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = s
      ? roster.filter((r) => [r.name, r.displayName, r.rollNumber, r.email].some((v) => v.toLowerCase().includes(s)))
      : roster;
    return [...list].sort(ROSTER_SORTS.find((o) => o.value === sort).by);
  }, [roster, q, sort]);

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search name, roll number or email"
          className="input !py-2 min-w-0 flex-1 text-sm sm:max-w-xs"
          aria-label="Search students"
        />
        <label className="flex items-center gap-2 text-xs text-zinc-500">
          Sort by
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="input !w-auto !py-2 text-sm">
            {ROSTER_SORTS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {rows.length === roster.length ? `${roster.length} students` : `${rows.length} of ${roster.length} students`}
      </p>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-zinc-400">{roster.length ? "No student matches that search." : "Nobody has signed up yet."}</p>
      ) : (
        <div className="mt-2 max-h-[560px] overflow-auto rounded-xl border border-white/[0.06]">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="sticky top-0 z-10 bg-ink-900 text-[11px] uppercase tracking-wider text-zinc-500">
              <tr>
                <th className="px-3 py-2 font-semibold">Student</th>
                <th className="px-3 py-2 font-semibold">Roll number</th>
                <th className="px-3 py-2 font-semibold">Joined</th>
                <th className="px-3 py-2 font-semibold">Last sign-in</th>
                <th className="px-3 py-2 text-right font-semibold">Uploads</th>
                <th className="px-3 py-2 text-right font-semibold">Forum</th>
                <th className="px-3 py-2 text-right font-semibold">XP</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r._id} className="border-t border-white/[0.06] align-top">
                  <td className="px-3 py-2.5">
                    <div className="flex flex-wrap items-center gap-1.5 font-semibold text-white">
                      {r.name || "—"}
                      {r.role === "admin" && <span className="rounded bg-accent px-1.5 text-[10px] font-bold text-black">CR</span>}
                      {r.locked && <span className="rounded px-1.5 text-[10px] font-bold" style={{ background: STATUS.critical }}>Locked</span>}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      {r.displayName ? `Shown as “${r.displayName}”` : "No display name yet"}
                      {r.hidden && " · hidden on leaderboard"}
                    </div>
                    <div className="truncate text-[11px] text-zinc-500">{r.email}</div>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-zinc-300">{r.rollNumber}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-zinc-300">{shortDate(r.joined)}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-zinc-300">{r.lastSeen ? ago(r.lastSeen) :<span className="text-zinc-600">not in 30 days</span>}</td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    <span className={r.uploads ? "text-white" : "text-zinc-600"}>{r.uploads}</span>
                    {r.uploads > 0 && <div className="text-[11px] text-zinc-500">{r.live} live</div>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2.5 text-right tabular-nums">
                    <span className={r.posts + r.replies ? "text-white" : "text-zinc-600"}>{r.posts + r.replies}</span>
                    {r.posts + r.replies > 0 && <div className="text-[11px] text-zinc-500">{r.posts} asked · {r.replies} {r.replies === 1 ? "reply" : "replies"}</div>}
                  </td>
                  <td className={`whitespace-nowrap px-3 py-2.5 text-right font-semibold tabular-nums ${r.xp ? "text-white" : "text-zinc-600"}`}>{r.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

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

  const signupsCumulative = useMemo(() => {
    if (!d) return [];
    // signups only covers 60 days; start from the accounts that existed before that
    const before = d.users.students - d.users.signups.reduce((t, x) => t + x.n, 0);
    let run = before;
    return d.users.signups.map((x) => ({ day: x.day, total: (run += x.n) }));
  }, [d]);
  const forumWeeks = d ? d.forum.postsPerWeek.map((w, i) => ({ week: w.week, posts: w.n, comments: d.forum.commentsPerWeek[i]?.n || 0 })) : [];
  const className = d?.classes?.length ? d.classes.join(", ") : "your class";

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
              <h1 className="mt-1 text-2xl font-bold text-white sm:text-3xl">{className} at a glance</h1>
              <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-400">
                <ShieldCheck size={15} className="mt-0.5 shrink-0 text-accent" />
                You're the owner and main admin over the class, so your account isn't counted in any of these numbers.
              </p>
            </motion.div>

            {/* headline numbers */}
            <motion.div variants={item} className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <Tile label="Students" value={d.users.students} sub={`${d.users.crs} CR${d.users.crs === 1 ? "" : "s"}${d.users.demoAccounts ? ` · ${d.users.demoAccounts} demo` : ""}`} />
              <Tile label="Active this week" value={d.users.active7} sub={`${pct(d.users.active7, d.users.students)}% · ${d.users.activeToday} today`} />
              <Tile label="Uploads" value={d.content.total} sub={`${d.content.byStatus.approved} live · ${d.content.byStatus.pending} pending`} />
              <Tile label="Subjects" value={d.subjects} sub={`across ${d.subjectsBySemester.filter((s) => s.subjects.length).length} semesters`} />
              <Tile label="Upcoming exams" value={d.exams.upcoming} sub={`${d.exams.thisWeek} this week`} />
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

            {/* subjects per semester */}
            <Panel title="Subjects by semester" sub="Every subject the CRs added, and what was uploaded under it (all statuses; “live” = approved)">
              <SubjectsBySemester semesters={d.subjectsBySemester} noSemester={d.noSemester} />
            </Panel>

            {/* uploads */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Uploads" sub={`${d.content.total} total from ${d.content.uploaders} student${d.content.uploaders === 1 ? "" : "s"} · oldest waiting ${d.content.oldestPendingHours ? `${d.content.oldestPendingHours} h` : "—"}`}>
                <StatusBar
                  parts={[
                    { label: "Approved", n: d.content.byStatus.approved, color: STATUS.good },
                    { label: "Pending", n: d.content.byStatus.pending, color: STATUS.warning },
                    { label: "Rejected", n: d.content.byStatus.rejected, color: STATUS.critical },
                    { label: "Reported", n: d.content.byStatus.reported, color: STATUS.serious },
                    { label: "Needs revision", n: d.content.byStatus.revision, color: STATUS.neutral },
                  ]}
                />
                <div className="mt-4 space-y-3">
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">What was shared</div>
                    <Chips items={KINDS.filter((k) => k.key === "link" || d.content.byKind[k.key]).map((k) => [k.label, d.content.byKind[k.key] || 0])} />
                    {d.content.byKind.link > 0 && (
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        Links: {Object.entries(d.content.linkHosts).map(([h, n]) => `${h} ${n}`).join(" · ")}
                      </p>
                    )}
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Type</div>
                    <Chips items={TYPES.map((t) => [t.label, d.content.byType[t.key] || 0])} />
                  </div>
                  <div>
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">How uploads went live</div>
                    <Chips
                      items={[
                        ["CR approved", d.content.approvedBy.moderator],
                        ["5 Helpful votes", d.content.approvedBy.community],
                        ["Trusted uploader", d.content.approvedBy.trusted],
                      ]}
                    />
                  </div>
                  <p className="text-xs text-zinc-500">
                    {d.content.helpful} Helpful vote{d.content.helpful === 1 ? "" : "s"} given · {d.content.reports} report{d.content.reports === 1 ? "" : "s"} filed
                  </p>
                </div>
              </Panel>

              <Panel title="Top uploaders" sub="Most uploads, with how many went live and XP earned">
                <RankList
                  empty="No uploads yet."
                  rows={d.content.topUploaders.map((u, i) => ({
                    key: i,
                    label: `${u.name}${u.role === "admin" ? " (CR)" : ""}`,
                    value: u.uploads,
                    valueLabel: `${u.uploads} upload${u.uploads === 1 ? "" : "s"}`,
                    sub: `${u.live} live · ${u.xp} XP`,
                  }))}
                />
              </Panel>
            </div>

            <div className="grid gap-5 lg:grid-cols-2">
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
            </div>

            {/* students */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Students" sub={`${className} · ${d.users.crs} CR${d.users.crs === 1 ? "" : "s"}`} className="lg:col-span-2">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Stat label="Signed up" value={d.users.students} note={`${d.users.students - d.users.crs} students + ${d.users.crs} CRs`} />
                  <Stat label="Active today" value={d.users.activeToday} note={`${pct(d.users.activeToday, d.users.students)}% of the class`} />
                  <Stat label="Active 30 days" value={d.users.active30} note={`${d.users.quiet30} haven't signed in`} />
                  <Stat label="Picked a name" value={d.users.displayNames} note={`${d.users.hiddenFromLeaderboard} hide it on the leaderboard`} />
                </dl>
                <div className="mt-4 h-44">
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
                <p className="mt-1 text-xs text-zinc-500">Students signed up · last 60 days</p>
              </Panel>

              <Panel title="Leaderboard" sub={`${d.leaderboard.xpTotal} XP earned in total${d.leaderboard.flagged ? ` · ${d.leaderboard.flagged} flagged` : ""}`}>
                <RankList
                  empty="Nobody has XP yet."
                  rows={d.leaderboard.top.map((t, i) => ({
                    key: i,
                    label: `${t.name}${t.flagged ? " · flagged" : ""}`,
                    value: t.score,
                    valueLabel: `${t.score} XP`,
                    sub: `${t.contributions} approved upload${t.contributions === 1 ? "" : "s"}`,
                  }))}
                />
              </Panel>
            </div>

            <Panel title="All students" sub={`Everyone in ${className}, with their uploads, forum activity and XP`}>
              <StudentRoster roster={d.users.roster || []} />
            </Panel>

            {/* forum */}
            <div className="grid gap-5 lg:grid-cols-3">
              <Panel title="Forum" sub={`${d.forum.people} student${d.forum.people === 1 ? "" : "s"} have posted or replied`} className="lg:col-span-2">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                  <Stat label="Questions" value={d.forum.discussions} />
                  <Stat label="Replies" value={d.forum.comments} note={`${d.forum.avgReplies} per question`} />
                  <Stat label="Unanswered" value={d.forum.unanswered} note={`${pct(d.forum.unanswered, d.forum.discussions)}% of questions`} />
                  <Stat label="This week" value={forumWeeks.at(-1)?.posts || 0} note={`${forumWeeks.at(-1)?.comments || 0} replies`} />
                </dl>
                <div className="mb-2 mt-4 flex gap-4 text-xs text-zinc-300">
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES.posts }} /> Questions</span>
                  <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 rounded" style={{ background: SERIES.comments }} /> Replies</span>
                </div>
                <div className="h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={forumWeeks} margin={{ left: -20, right: 8, top: 8 }}>
                      <CartesianGrid stroke={GRID} vertical={false} />
                      <XAxis dataKey="week" tickFormatter={shortDay} tick={AXIS} axisLine={false} tickLine={false} minTickGap={16} />
                      <YAxis allowDecimals={false} tick={AXIS} axisLine={false} tickLine={false} />
                      <Tooltip content={<Tip fmt={(w) => `Week of ${shortDay(w)}`} />} cursor={{ stroke: "rgba(255,255,255,0.25)" }} />
                      <Line type="monotone" dataKey="posts" name="Questions" stroke={SERIES.posts} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: SERIES.posts }} />
                      <Line type="monotone" dataKey="comments" name="Replies" stroke={SERIES.comments} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: SERIES.comments }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {d.forum.topTags.length > 0 && (
                  <div className="mt-4">
                    <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">Popular tags</div>
                    <Chips items={d.forum.topTags.map((t) => [`#${t.tag}`, t.n])} />
                  </div>
                )}
              </Panel>

              <Panel title="Busiest threads" sub="Most replies">
                <RankList
                  empty="No questions yet."
                  rows={d.forum.topThreads.map((t) => ({
                    key: t._id,
                    label: t.title,
                    value: t.replies,
                    valueLabel: `${t.replies}`,
                    sub: `by ${t.author} · ${shortDate(t.createdAt)}`,
                  }))}
                />
              </Panel>
            </div>

            {/* exams + announcements */}
            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Exams" sub={`${d.exams.upcoming} upcoming · ${d.exams.past} past · ${d.exams.total} posted in total`}>
                {Object.keys(d.exams.byType).length > 0 && (
                  <div className="mb-3">
                    <Chips items={Object.entries(d.exams.byType)} />
                  </div>
                )}
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
                            {examWhen(e.date)}
                            {e.maxMarks ? ` · ${e.maxMarks} marks` : ""}
                            {e.venue ? ` · ${e.venue}` : ""}
                          </div>
                        </div>
                        <span className="shrink-0 text-xs text-zinc-300">{relative(e.date)}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>

              <Panel title="Announcements" sub={`${d.announcements.total} sent · ${d.announcements.last30} in the last 30 days · ${d.announcements.highPriority} high priority`}>
                <p className="mb-3 text-sm text-zinc-300">
                  On average <span className="font-semibold text-white">{d.announcements.avgReadPct}%</span> of the class reads each announcement.
                </p>
                {d.announcements.latest.length === 0 ? (
                  <p className="text-sm text-zinc-400">No announcements yet.</p>
                ) : (
                  <ul className="space-y-2.5">
                    {d.announcements.latest.map((a) => (
                      <li key={a._id} className="text-sm">
                        <div className="flex items-start gap-2">
                          <span className="min-w-0 flex-1 text-zinc-200">
                            {a.priority && <span className="mr-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: STATUS.critical }}>High</span>}
                            {a.message}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-zinc-300">{a.readPct}% read</span>
                        </div>
                        <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/[0.06]">
                          <div className="h-full rounded-full" style={{ width: `${a.readPct}%`, background: ACCENT }} />
                        </div>
                        <div className="mt-0.5 text-[11px] text-zinc-500">
                          {a.createdBy && `${a.createdBy} · `}
                          {shortDate(a.createdAt)}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>

            <Panel
              title="Feedback inbox"
              sub={`Issues, ideas and comments sent from the app · ${d.feedback.total} in total · ${d.feedback.new} new · ${d.feedback.byStatus?.resolved || 0} resolved`}
              right={
                d.feedback.total > 0 && (
                  <Chips
                    items={[
                      ["Issues", d.feedback.byKind?.Issue || 0],
                      ["Ideas", d.feedback.byKind?.Improvement || 0],
                      ["Comments", d.feedback.byKind?.Comment || 0],
                    ]}
                  />
                )
              }
            >
              <FeedbackInbox />
            </Panel>

            <div className="grid gap-5 lg:grid-cols-2">
              <Panel title="Security" sub="Sign-ins and passwords">
                <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
                  <Stat label="Failed sign-ins" value={d.security.failed7} note="7 days" />
                  <Stat label="Lockouts" value={d.security.locks30} note="30 days" />
                  <Stat label="Password resets" value={d.security.resets30} note="30 days" />
                  <Stat label="Locked now" value={d.security.lockedNow} note="accounts" />
                  <Stat label="Must change password" value={d.security.mustChange} note="after a CR reset" />
                </dl>
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
