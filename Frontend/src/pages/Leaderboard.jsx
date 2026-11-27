import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Crown, Sparkles, Upload, FileText, Presentation, FileQuestion, TrendingUp, Medal } from "lucide-react";
import API from "../api";
import { useUser } from "../context/UserContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { levelFor } from "../utils/gamification.js";
import { useRules } from "../utils/rules.js";

const podium = [
  { place: 2, height: "h-28", ring: "ring-slate-300/60", glow: "shadow-[0_0_40px_-6px_rgba(203,213,225,0.6)]", bar: "from-slate-300/30 to-slate-400/5", label: "🥈" },
  { place: 1, height: "h-40", ring: "ring-amber-300/80", glow: "shadow-[0_0_60px_-4px_rgba(251,191,36,0.75)]", bar: "from-amber-300/40 to-amber-500/5", label: "🥇" },
  { place: 3, height: "h-20", ring: "ring-orange-400/60", glow: "shadow-[0_0_40px_-6px_rgba(251,146,60,0.6)]", bar: "from-orange-400/30 to-orange-600/5", label: "🥉" },
];

export default function Leaderboard() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [scope, setScope] = useState("all");
  const rules = useRules();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data } = await API.get("/leaderboard");
        setLeaders(data.sort((a, b) => b.score - a.score));
      } catch {
        setError("Failed to load leaderboard.");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const myName = user?.name || authUser?.name;
  const myBranch = user?.branch || authUser?.branch;

  const list = useMemo(() => (scope === "branch" ? leaders.filter((l) => l.branch === myBranch) : leaders), [leaders, scope, myBranch]);
  const top = list[0]?.score || 1;
  const meIdx = list.findIndex((l) => l.name === myName);
  const me = list[meIdx];
  const ahead = meIdx > 0 ? list[meIdx - 1] : null;

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-72" />
        <Skeleton className="h-72" />
        <Skeleton className="h-96" />
      </div>
    );
  if (error) return <EmptyState icon={Trophy} title="Leaderboard unavailable" text={error} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        icon={Trophy}
        eyebrow="Hall of fame"
        title="Leaderboard"
        subtitle="Celebrating the most active contributors of PrepTrack."
        gradient="from-amber-300 to-orange-600"
        actions={
          <Segmented
            value={scope}
            onChange={setScope}
            options={[
              { value: "all", label: "Everyone" },
              { value: "branch", label: myBranch || "My branch" },
            ]}
          />
        }
      />

      {/* Your standing */}
      {me && (
        <Card className="p-5" glow="rgba(167,139,250,0.18)">
          <div className="absolute inset-0 -z-10 bg-gradient-to-r from-violet-600/25 via-fuchsia-600/10 to-transparent" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex items-center gap-4">
              <div className="font-display text-5xl font-bold text-gradient">#{meIdx + 1}</div>
              <Avatar name={me.name} size={48} ring />
              <div>
                <div className="font-semibold text-white">Your standing</div>
                <div className="text-sm text-slate-400">
                  Level {levelFor(me.score).level} · {levelFor(me.score).title}
                </div>
              </div>
            </div>
            <div className="flex-1 sm:px-6">
              {ahead ? (
                <>
                  <div className="mb-1.5 flex justify-between text-xs text-slate-400">
                    <span>{me.score} XP</span>
                    <span>
                      <span className="font-semibold text-violet-200">{ahead.score - me.score + 1} XP</span> to pass {ahead.name}
                    </span>
                  </div>
                  <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-violet-400 via-fuchsia-400 to-amber-300"
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (me.score / ahead.score) * 100)}%` }}
                      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </>
              ) : (
                <div className="text-sm font-semibold text-amber-200">👑 You're at the top. Keep contributing to hold the crown!</div>
              )}
            </div>
            <Link to="/resources?upload=1" className="btn-primary shrink-0">
              <Upload size={16} /> Earn XP
            </Link>
          </div>
        </Card>
      )}

      {/* Podium */}
      {list.length > 0 && (
        <Card className="px-4 pb-0 pt-8 sm:px-10" spotlight={false}>
          <div className="absolute left-1/2 top-0 -z-10 h-64 w-64 -translate-x-1/2 rounded-full bg-amber-400/15 blur-3xl" />
          <div className="mx-auto grid max-w-3xl grid-cols-3 items-end gap-3 sm:gap-6">
            {podium.map((p, i) => {
              const person = list[p.place - 1];
              if (!person) return <div key={p.place} />;
              return (
                <div key={p.place} className="flex flex-col items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.8 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.25 + i * 0.12, type: "spring", stiffness: 220, damping: 18 }}
                    className="relative flex flex-col items-center"
                  >
                    {p.place === 1 && (
                      <motion.div animate={{ y: [0, -6, 0], rotate: [-6, 6, -6] }} transition={{ duration: 3, repeat: Infinity }} className="absolute -top-8">
                        <Crown size={30} className="fill-amber-300/30 text-amber-300 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]" />
                      </motion.div>
                    )}
                    <div className={`rounded-full ring-4 ${p.ring} ${p.glow}`}>
                      <Avatar name={person.name} size={p.place === 1 ? 84 : 64} />
                    </div>
                    <div className="mt-3 max-w-full truncate text-center text-sm font-semibold text-white sm:text-base">
                      {person.name} {person.name === myName && <span className="text-violet-300">(you)</span>}
                    </div>
                    <div className="text-xs text-slate-400">{person.branch}</div>
                    <div className="mt-1 flex items-center gap-1 font-display text-lg font-bold text-amber-200">
                      <Sparkles size={14} /> <AnimatedNumber value={person.score} />
                    </div>
                  </motion.div>
                  <motion.div
                    initial={{ scaleY: 0 }}
                    animate={{ scaleY: 1 }}
                    transition={{ delay: 0.15 + i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                    className={`mt-3 w-full origin-bottom rounded-t-2xl border border-b-0 border-white/10 bg-gradient-to-b ${p.bar} ${p.height} grid place-items-center`}
                  >
                    <span className="text-3xl sm:text-4xl">{p.label}</span>
                  </motion.div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,320px]">
        {/* Full ranking */}
        <Card className="p-2 sm:p-4" spotlight={false}>
          {list.length === 0 ? (
            <EmptyState icon={Medal} title="No rankings yet" text="Upload materials to appear on the leaderboard." />
          ) : (
            <div className="space-y-1">
              <div className="grid grid-cols-[3rem,1fr,5rem] gap-3 px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500 sm:grid-cols-[3rem,1fr,6rem,10rem,5rem]">
                <span>Rank</span>
                <span>Student</span>
                <span className="hidden sm:block">Uploads</span>
                <span className="hidden sm:block">Progress</span>
                <span className="text-right">XP</span>
              </div>
              {list.map((r, i) => {
                const isMe = r.name === myName;
                return (
                  <motion.div
                    key={r.name + i}
                    variants={item}
                    whileHover={{ x: 4 }}
                    className={`grid grid-cols-[3rem,1fr,5rem] items-center gap-3 rounded-2xl px-3 py-3 transition sm:grid-cols-[3rem,1fr,6rem,10rem,5rem] ${
                      isMe ? "border border-violet-400/30 bg-violet-500/10 shadow-glow" : "hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="font-display text-lg font-bold text-slate-300">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
                    <span className="flex min-w-0 items-center gap-3">
                      <Avatar name={r.name} size={36} />
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-white">
                          {r.name} {isMe && <span className="text-xs text-violet-300">(You)</span>}
                        </span>
                        <span className="text-xs text-slate-500">
                          {r.branch || "—"} · Lv {levelFor(r.score).level}
                        </span>
                      </span>
                    </span>
                    <span className="hidden text-sm text-slate-300 sm:block">{r.contributions ?? "—"}</span>
                    <span className="hidden sm:block">
                      <span className="block h-1.5 overflow-hidden rounded-full bg-white/10">
                        <motion.span
                          className="block h-full rounded-full bg-gradient-to-r from-violet-400 to-cyan-300"
                          initial={{ width: 0 }}
                          animate={{ width: `${((r.score || 0) / top) * 100}%` }}
                          transition={{ duration: 1, delay: 0.2 + i * 0.04 }}
                        />
                      </span>
                    </span>
                    <span className="text-right font-display font-bold text-violet-200">{r.score ?? 0}</span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        {/* How to earn */}
        <div className="space-y-4">
          <Card className="p-5">
            <div className="section-title mb-4 text-base">
              <TrendingUp size={16} className="text-emerald-300" /> How to earn XP
            </div>
            {[
              { icon: FileQuestion, label: "Upload PYQs", xp: 15, g: "from-fuchsia-400 to-violet-600" },
              { icon: FileText, label: "Upload notes", xp: 10, g: "from-cyan-400 to-blue-600" },
              { icon: Presentation, label: "Upload slides", xp: 8, g: "from-amber-300 to-orange-600" },
            ].map((x) => (
              <div key={x.label} className="flex items-center gap-3 rounded-xl px-2 py-2.5">
                <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${x.g}`}>
                  <x.icon size={16} className="text-white" />
                </div>
                <span className="flex-1 text-sm text-slate-200">{x.label}</span>
                <span className="rounded-full bg-amber-300/15 px-2.5 py-1 text-xs font-bold text-amber-200">+{x.xp} XP</span>
              </div>
            ))}
            <p className="mt-3 text-xs leading-relaxed text-slate-500">
              Points are added once an upload is approved — by a moderator or by {rules.approveUpvotes} classmates' upvotes. Reach{" "}
              <span className="font-semibold text-emerald-300">{rules.trustedXp} XP</span> to become a trusted uploader whose uploads go live instantly.
            </p>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
