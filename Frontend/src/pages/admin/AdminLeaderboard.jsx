import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Search, Flag, ShieldAlert } from "lucide-react";
import API from "../../api";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container, item } from "../../components/ui/motion.js";

function Switch({ on, onClick, label }) {
  return (
    <button
      onClick={onClick}
      role="switch"
      aria-checked={on}
      aria-label={label}
      className={`relative h-6 w-11 rounded-full border transition ${on ? "border-rose-400/40 bg-rose-500/40" : "border-white/10 bg-white/10"}`}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={`absolute top-0.5 h-[18px] w-[18px] rounded-full shadow ${on ? "right-0.5 bg-rose-200" : "left-0.5 bg-zinc-300"}`}
      />
    </button>
  );
}

export default function AdminLeaderboard() {
  const toast = useToast();
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Fetch leaderboard data (admin)
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get("/leaderboard/admin");
        setRows(data);
      } catch (err) {
        console.error("Error fetching leaderboard:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  // Handle flag/unflag
  const handleFlagUser = async (student, flagged) => {
    try {
      await API.put("/leaderboard/flag", { studentId: student._id, flagged });
      setRows((prev) => prev.map((r) => (r.studentId._id === student._id ? { ...r, flagged } : r)));
      toast({
        type: flagged ? "error" : "success",
        title: flagged ? `${student.name} flagged for review` : `${student.name} unflagged`,
      });
    } catch (err) {
      console.error("Error flagging user:", err);
      toast({ type: "error", title: "Couldn't update flag status" });
    }
  };

  // Filter by search
  const filtered = rows.filter(
    (r) =>
      r.studentId?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.studentId?.email?.toLowerCase().includes(search.toLowerCase())
  );
  const flaggedCount = rows.filter((r) => r.flagged).length;
  const top = rows[0]?.score || 1;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        icon={BarChart3}
        eyebrow="Fair play"
        title="Leaderboard Moderation"
        subtitle="Monitor top contributors and flag suspicious activity."
       
        actions={
          flaggedCount > 0 && (
            <span className="chip !border-rose-400/30 !bg-rose-500/10 !text-rose-200">
              <ShieldAlert size={12} /> {flaggedCount} flagged
            </span>
          )
        }
      />

      <Card className="p-0" spotlight={false}>
        <div className="border-b border-white/[0.06] p-4">
          <div className="relative max-w-md">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input placeholder="Search by student name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
          </div>
        </div>

        {loading ? (
          <div className="space-y-2 p-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="p-6"><EmptyState icon={BarChart3} title="No users found" /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table-glass min-w-[720px]">
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Student</th>
                  <th>Branch</th>
                  <th>Total points</th>
                  <th>Uploads</th>
                  <th className="text-right">Flag</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r, i) => (
                  <motion.tr key={r._id} variants={item} className={r.flagged ? "!bg-rose-500/[0.07]" : ""}>
                    <td className="font-display text-base font-bold text-zinc-300">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.studentId?.name || "?"} size={36} />
                        <div>
                          <div className="flex items-center gap-1.5 font-semibold text-white">
                            {r.studentId?.name || "Unknown"} {r.flagged && <Flag size={12} className="fill-rose-400 text-rose-400" />}
                          </div>
                          <div className="text-xs text-zinc-500">{r.studentId?.email || ""}</div>
                        </div>
                      </div>
                    </td>
                    <td><span className="chip">{r.studentId?.branch || "N/A"}</span></td>
                    <td>
                      <div className="flex items-center gap-3">
                        <span className="w-10 font-display font-bold text-accent">{r.score}</span>
                        <span className="h-1.5 w-24 overflow-hidden rounded-full bg-white/10">
                          <motion.span
                            className="block h-full rounded-full bg-accent "
                            initial={{ width: 0 }}
                            animate={{ width: `${(r.score / top) * 100}%` }}
                            transition={{ duration: 0.9, delay: i * 0.04 }}
                          />
                        </span>
                      </div>
                    </td>
                    <td className="text-zinc-300">{r.contributions ?? r.uploads ?? 0}</td>
                    <td className="text-right">
                      <div className="flex justify-end">
                        <Switch on={!!r.flagged} onClick={() => handleFlagUser(r.studentId, !r.flagged)} label={`Flag ${r.studentId?.name}`} />
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
