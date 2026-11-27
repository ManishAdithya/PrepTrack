import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, CartesianGrid } from "recharts";
import {
  LayoutDashboard,
  FileCheck2,
  Users,
  Clock,
  Ban,
  ArrowRight,
  FolderOpenDot,
  Megaphone,
  Shield,
  Activity,
} from "lucide-react";
import API from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container } from "../../components/ui/motion.js";
import { greeting } from "../../utils/gamification.js";
import { eventStyles, timeAgo } from "../../utils/ui.js";

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="glass-strong !rounded-xl px-3 py-2 text-xs">
      <div className="font-semibold text-white">{p.payload._id || p.name}</div>
      <div className="font-display text-base font-bold text-cyan-200">{p.value} uploads</div>
    </div>
  );
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ data }, logRes] = await Promise.all([
          API.get("/admin/stats"),
          API.get("/security-logs").catch(() => ({ data: [] })),
        ]);
        setStats(data);
        setLogs(logRes.data.slice(0, 6));
      } catch (err) {
        console.error("Error fetching admin stats:", err);
        setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-96" />
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-32" />)}</div>
        <Skeleton className="h-80" />
      </div>
    );
  if (error) return <EmptyState icon={LayoutDashboard} title="Dashboard unavailable" text={error} />;

  const approved = stats.totalVerified || 0;
  const pending = stats.pending || 0;
  const rejected = stats.rejected || 0;
  const total = stats.approvalRate ? Math.round((approved * 100) / stats.approvalRate) : approved + pending + rejected;
  const other = Math.max(0, total - approved - pending - rejected);
  const pie = [
    { name: "Approved", value: approved, color: "#34d399" },
    { name: "Pending", value: pending, color: "#fbbf24" },
    { name: "Rejected", value: rejected, color: "#fb7185" },
    { name: "Revision / reported", value: other, color: "#38bdf8" },
  ].filter((p) => p.value > 0);

  const tiles = [
    { label: "Verified uploads", value: approved, icon: FileCheck2, g: "from-emerald-400 to-teal-600" },
    { label: "Active uploaders", value: stats.activeUploaders, icon: Users, g: "from-cyan-400 to-blue-600" },
    { label: "Pending approvals", value: pending, icon: Clock, g: "from-amber-300 to-orange-600", link: "/admin/content", cta: "Review now" },
    { label: "Blocked users", value: stats.blocked, icon: Ban, g: "from-rose-400 to-pink-600" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        icon={LayoutDashboard}
        eyebrow={greeting()}
        title={`Welcome, ${user?.name?.split(" ").slice(0, 2).join(" ") || "Admin"}`}
        subtitle="Here's what's happening across PrepTrack today."
        gradient="from-cyan-400 to-violet-600"
      />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5" glow="rgba(34,211,238,0.12)">
            <div className="flex items-start justify-between">
              <div className="text-sm text-slate-400">{t.label}</div>
              <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${t.g} shadow-lg`}>
                <t.icon size={18} className="text-white" />
              </div>
            </div>
            <div className="mt-2 font-display text-4xl font-bold text-white">
              <AnimatedNumber value={t.value || 0} />
            </div>
            {t.link ? (
              <Link to={t.link} className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-amber-200 hover:text-amber-100">
                {t.cta} <ArrowRight size={12} />
              </Link>
            ) : (
              <div className="mt-1 text-xs text-slate-500">All time</div>
            )}
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr,1fr]">
        <Card className="p-6">
          <h2 className="section-title mb-4">Uploads by academic branch</h2>
          {stats.branchData.length === 0 ? (
            <EmptyState icon={FolderOpenDot} title="No uploads yet" />
          ) : (
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.branchData} margin={{ left: -20, right: 8, top: 10 }}>
                  <defs>
                    <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#22d3ee" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                  <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis dataKey="_id" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
                  <Bar dataKey="count" fill="url(#barFill)" radius={[10, 10, 0, 0]} maxBarSize={56} animationDuration={1200} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>

        <Card className="p-6">
          <h2 className="section-title mb-2">Content approval status</h2>
          <div className="relative h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pie} dataKey="value" innerRadius={62} outerRadius={88} paddingAngle={3} stroke="none" animationDuration={1200}>
                  {pie.map((p) => (
                    <Cell key={p.name} fill={p.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) =>
                    active && payload?.length ? (
                      <div className="glass-strong !rounded-xl px-3 py-2 text-xs text-white">
                        {payload[0].name}: <b>{payload[0].value}</b>
                      </div>
                    ) : null
                  }
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <div className="font-display text-3xl font-bold text-white">
                  <AnimatedNumber value={stats.approvalRate || 0} suffix="%" />
                </div>
                <div className="text-xs text-slate-400">approved</div>
              </div>
            </div>
          </div>
          <div className="mt-2 space-y-2 text-sm">
            {pie.map((p) => (
              <div key={p.name} className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full" style={{ background: p.color }} />
                <span className="text-slate-300">{p.name}</span>
                <span className="ml-auto font-semibold text-white">{p.value}</span>
                <span className="w-12 text-right text-slate-500">{total ? Math.round((p.value / total) * 100) : 0}%</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,1.4fr]">
        <Card className="p-6">
          <h2 className="section-title mb-4">Quick actions</h2>
          <div className="space-y-2">
            {[
              { to: "/admin/content", icon: FolderOpenDot, label: "Review pending content", hint: `${pending} waiting`, g: "from-amber-300 to-orange-600" },
              { to: "/admin/announcements", icon: Megaphone, label: "Publish an announcement", hint: "Reach every student", g: "from-violet-500 to-fuchsia-600" },
              { to: "/admin/security", icon: Shield, label: "Check security logs", hint: "Logins & admin actions", g: "from-cyan-400 to-blue-600" },
            ].map((a) => (
              <Link key={a.to} to={a.to} className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/15">
                <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${a.g}`}>
                  <a.icon size={19} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-white">{a.label}</div>
                  <div className="text-xs text-slate-400">{a.hint}</div>
                </div>
                <ArrowRight size={16} className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="section-title">
              <Activity size={18} className="text-cyan-300" /> Recent activity
            </h2>
            <Link to="/admin/security" className="text-xs font-semibold text-cyan-300 hover:text-cyan-200">View all</Link>
          </div>
          {logs.length === 0 ? (
            <p className="text-sm text-slate-400">No recent events.</p>
          ) : (
            <div className="relative space-y-4 before:absolute before:bottom-2 before:left-[15px] before:top-2 before:w-px before:bg-white/10">
              {logs.map((l, i) => {
                const st = eventStyles[l.eventType] || eventStyles["Admin Action"];
                return (
                  <motion.div key={l._id || i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 + i * 0.06 }} className="relative flex items-start gap-3">
                    <span className={`relative z-10 grid h-8 w-8 shrink-0 place-items-center rounded-full border ${st.chip}`}>
                      <st.icon size={14} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-sm text-slate-200">
                        <span className="font-semibold text-white">{l.userId?.name || "Unknown user"}</span> · {l.eventType}
                      </div>
                      <div className="text-xs text-slate-500">
                        {l.details} · {timeAgo(l.createdAt)}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </motion.div>
  );
}
