import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Shield, Search, Activity, AlertTriangle, LogIn, Globe } from "lucide-react";
import API from "../../api";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Segmented from "../../components/ui/Segmented.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import AnimatedNumber from "../../components/ui/AnimatedNumber.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container, item } from "../../components/ui/motion.js";
import { eventStyles, timeAgo } from "../../utils/ui.js";

const EVENTS = ["All Events", "Login Success", "Login Failure", "Password Reset", "Admin Action"];
const RANGES = { "24h": 86400000, "7d": 7 * 86400000, all: Infinity };

export default function AdminSecurityLogs() {
  const [logs, setLogs] = useState([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All Events");
  const [range, setRange] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const { data } = await API.get("/security-logs");
        setLogs(data);
      } catch (err) {
        console.error("❌ Error fetching security logs:", err);
        setError("Failed to load logs");
      } finally {
        setLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter((log) => {
        const q = search.toLowerCase();
        const matchSearch = !q || log.userId?.email?.toLowerCase().includes(q) || log.userId?.name?.toLowerCase().includes(q) || log.ipAddress?.includes(q);
        const matchFilter = filter === "All Events" ? true : log.eventType === filter;
        const matchRange = Date.now() - new Date(log.createdAt) <= RANGES[range];
        return matchSearch && matchFilter && matchRange;
      }),
    [logs, search, filter, range]
  );

  const day = logs.filter((l) => Date.now() - new Date(l.createdAt) <= RANGES["24h"]);
  const tiles = [
    { label: "Total events", value: logs.length, icon: Activity, g: "bg-white/[0.06]" },
    { label: "Failed logins (24h)", value: day.filter((l) => l.eventType === "Login Failure").length, icon: AlertTriangle, g: "bg-white/[0.06]" },
    { label: "Successful logins (24h)", value: day.filter((l) => l.eventType === "Login Success").length, icon: LogIn, g: "bg-white/[0.06]" },
    { label: "Unique IPs", value: new Set(logs.map((l) => l.ipAddress)).size, icon: Globe, g: "bg-white/[0.06]" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader icon={Shield} eyebrow="Audit trail" title="Security Logs" subtitle="Every login, reset and admin action — in one place." />

      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {tiles.map((t) => (
          <Card key={t.label} className="p-5">
            <div className="flex items-start justify-between">
              <div className="text-sm text-zinc-400">{t.label}</div>
              <div className={`grid h-9 w-9 place-items-center rounded-xl ${t.g}`}>
                <t.icon size={16} className="text-white" />
              </div>
            </div>
            <div className="mt-2 font-display text-3xl font-bold text-white"><AnimatedNumber value={t.value} /></div>
          </Card>
        ))}
      </div>

      <Card className="p-0" spotlight={false}>
        <div className="flex flex-col gap-3 border-b border-white/[0.06] p-4 xl:flex-row xl:items-center">
          <Segmented size="sm" value={range} onChange={setRange} options={[{ value: "24h", label: "24 hours" }, { value: "7d", label: "7 days" }, { value: "all", label: "All time" }]} />
          <select className="input !w-auto !py-2" value={filter} onChange={(e) => setFilter(e.target.value)}>
            {EVENTS.map((e) => <option key={e}>{e}</option>)}
          </select>
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} className="input !py-2 pl-9" placeholder="Search by name, email or IP…" />
          </div>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-12" />)}</div>
          ) : error ? (
            <p className="p-6 text-sm text-rose-300">{error}</p>
          ) : filteredLogs.length === 0 ? (
            <div className="p-6"><EmptyState icon={Shield} title="No matching logs found" /></div>
          ) : (
            <table className="table-glass min-w-[760px]">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Event</th>
                  <th>User</th>
                  <th>IP address</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((r, i) => {
                  const st = eventStyles[r.eventType] || eventStyles["Admin Action"];
                  return (
                    <motion.tr key={r._id || i} variants={item}>
                      <td>
                        <div className="text-white">{timeAgo(r.createdAt)}</div>
                        <div className="text-xs text-zinc-500">{new Date(r.createdAt).toLocaleString()}</div>
                      </td>
                      <td>
                        <span className={`chip ${st.chip}`}>
                          <st.icon size={12} /> {r.eventType}
                        </span>
                      </td>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <Avatar name={r.userId?.name || "?"} size={28} />
                          <div>
                            <div className="text-zinc-200">{r.userId?.name || "Unknown"}</div>
                            <div className="text-xs text-zinc-500">{r.userId?.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="font-mono text-xs text-zinc-300">{r.ipAddress}</td>
                      <td className="text-zinc-400">{r.details}</td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
