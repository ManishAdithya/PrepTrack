import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BookOpen,
  MessagesSquare,
  TrendingUp,
  Trophy,
  ChevronRight,
  Bell,
  Sparkles,
  Clock,
  Gauge,
  Target,
  Timer,
  Lightbulb,
  CalendarClock,
  Flame,
  Crown,
  ArrowUpRight,
} from "lucide-react";
import API from "../api";
import { useUser } from "../context/UserContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useFocus } from "../context/FocusContext.jsx";
import Card from "../components/ui/Card.jsx";
import ProgressRing from "../components/ui/ProgressRing.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import Countdown from "../components/Countdown.jsx";
import { FocusFace } from "../components/FocusTimer.jsx";
import { container, item } from "../components/ui/motion.js";
import { greeting, tipOfTheDay } from "../utils/gamification.js";
import { confidenceOf, daysUntil, isNew, shortDate, timeAgo, typeOf } from "../utils/ui.js";

const quickActions = [
  { icon: BookOpen, label: "Browse Materials", hint: "Notes, slides & PYQs", route: "/resources", gradient: "from-cyan-400 to-blue-600" },
  { icon: MessagesSquare, label: "Join Discussion", hint: "Ask your batchmates", route: "/discussions", gradient: "from-pink-400 to-fuchsia-600" },
  { icon: TrendingUp, label: "Track Progress", hint: "Results & readiness", route: "/progress", gradient: "from-emerald-400 to-teal-600" },
  { icon: Trophy, label: "Leaderboard", hint: "See who's on top", route: "/leaderboard", gradient: "from-amber-300 to-orange-600" },
];

function StatTile({ icon: Icon, label, value, suffix = "", hint, gradient }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div className="text-sm text-slate-400">{label}</div>
        <div className={`grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
          <Icon size={17} className="text-white" />
        </div>
      </div>
      <div className="mt-2 font-display text-3xl font-bold text-white">
        {typeof value === "number" ? <AnimatedNumber value={value} suffix={suffix} /> : value}
      </div>
      <div className="mt-1 text-xs text-slate-500">{hint}</div>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const game = useGame();
  const focus = useFocus();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [progressData, setProgressData] = useState(null);
  const [prepSubjects, setPrepSubjects] = useState([]);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [matRes, noteRes, progRes, resRes] = await Promise.all([
          API.get("/upload"),
          API.get("/notification"),
          API.get("/progress"),
          API.get("/result").catch(() => ({ data: [] })),
        ]);

        setMaterials(matRes.data.slice(0, 4));
        setAnnouncements(noteRes.data.slice(0, 3));
        setProgressData(progRes.data);
        setPrepSubjects(progRes.data.prepSubjects || []);
        setResults(resRes.data || []);
      } catch (err) {
        console.error("Dashboard Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, []);

  const upcoming = [...prepSubjects]
    .filter((s) => s.examDate && new Date(s.examDate) > Date.now())
    .sort((a, b) => new Date(a.examDate) - new Date(b.examDate));
  const nextExam = upcoming[0];

  const avgScore = results.length
    ? Math.round(results.reduce((sum, r) => sum + (r.percentage || 0), 0) / results.length)
    : 0;

  const name = user?.name || authUser?.name || "Student";
  const firstName = name.split(" ")[0];
  const readiness = progressData?.progressPercent || 0;

  // the student plus the people right around them on the leaderboard
  const myIndex = game.rank ? game.rank - 1 : -1;
  const nearby = game.leaders.slice(0, 3);
  if (myIndex >= 3) nearby.push(game.leaders[myIndex]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ===== HERO ===== */}
      <Card className="overflow-hidden p-6 sm:p-8" spotlight={false}>
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-violet-600/30 via-fuchsia-600/10 to-cyan-500/20" />
        <div className="absolute -right-20 -top-24 -z-10 h-72 w-72 animate-float rounded-full bg-fuchsia-500/25 blur-3xl" />
        <div className="absolute -bottom-24 left-1/3 -z-10 h-60 w-60 rounded-full bg-cyan-400/20 blur-3xl" />

        <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs font-semibold text-white/90 backdrop-blur">
              <Sparkles size={13} className="text-amber-200" /> {greeting()}
            </div>
            <h1 className="text-4xl font-bold leading-tight text-white sm:text-5xl">
              Hey {firstName}, <span className="text-gradient">let's level up</span> today.
            </h1>
            <p className="mt-3 text-base text-slate-300">
              {game.streak.count > 1 ? (
                <>
                  You're on a <span className="font-semibold text-orange-300">{game.streak.count}-day streak</span> 🔥 — keep it alive.{" "}
                </>
              ) : (
                <>Showing up is half the battle — you're here. </>
              )}
              {game.ahead ? (
                <>
                  Just <span className="font-semibold text-violet-200">{game.ahead.score - game.xp + 1} XP</span> to overtake{" "}
                  <span className="font-semibold text-white">{game.ahead.name}</span>.
                </>
              ) : game.rank === 1 ? (
                <>You're <span className="font-semibold text-amber-200">#1 on the leaderboard</span>. Defend the crown! 👑</>
              ) : (
                <>Upload your first material to start earning XP.</>
              )}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button onClick={focus.running ? focus.pause : focus.start} className="btn-primary">
                <Timer size={16} /> {focus.running ? "Pause focus session" : "Start a focus session"}
              </button>
              <button onClick={() => navigate("/resources?upload=1")} className="btn-ghost">
                <ArrowUpRight size={16} /> Upload & earn XP
              </button>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <ProgressRing value={game.level.progress * 100} size={150} stroke={12} from="#fbbf24" to="#f472b6">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-widest text-slate-300">Level</div>
                <div className="font-display text-5xl font-bold text-white">{game.level.level}</div>
              </div>
            </ProgressRing>
            <div className="space-y-2">
              <div className="font-display text-lg font-bold text-white">{game.level.title}</div>
              <div className="flex flex-wrap gap-2">
                <span className="chip !border-amber-300/30 !bg-amber-300/10 !text-amber-100">
                  <Sparkles size={12} /> {game.xp} XP
                </span>
                {game.rank && (
                  <span className="chip !border-violet-300/30 !bg-violet-300/10 !text-violet-100">
                    <Crown size={12} /> Rank #{game.rank}
                  </span>
                )}
                <span className="chip !border-orange-300/30 !bg-orange-300/10 !text-orange-100">
                  <Flame size={12} /> {game.streak.count}d
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {game.level.nextTitle ? `${game.level.toNext} XP to "${game.level.nextTitle}"` : "Max level 👑"}
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== STATS ===== */}
      <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
        <StatTile icon={Gauge} label="Exam readiness" value={readiness} suffix="%" hint={`Confidence: ${progressData?.confidence || "Medium"}`} gradient="from-violet-500 to-fuchsia-600" />
        <StatTile icon={Target} label="Average score" value={avgScore} suffix="%" hint={`${results.length} results logged`} gradient="from-emerald-400 to-teal-600" />
        <StatTile
          icon={CalendarClock}
          label="Next exam in"
          value={nextExam ? Math.max(0, daysUntil(nextExam.examDate)) : "—"}
          suffix=" days"
          hint={nextExam ? nextExam.subject : "No exams scheduled"}
          gradient="from-amber-300 to-orange-600"
        />
        <StatTile icon={Timer} label="Focus today" value={focus.stats.minutesToday} suffix=" min" hint={`${focus.stats.sessionsToday} sessions completed`} gradient="from-cyan-400 to-blue-600" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr,380px]">
        {/* ===== LEFT COLUMN ===== */}
        <div className="min-w-0 space-y-6">
          {/* Next exam countdown */}
          <Card className="p-6" glow="rgba(251,191,36,0.12)">
            {loading ? (
              <Skeleton className="h-28" />
            ) : nextExam ? (
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-amber-200/80">
                    <Clock size={14} /> Next exam
                  </div>
                  <div className="mt-2 font-display text-2xl font-bold text-white">{nextExam.subject}</div>
                  <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-slate-400">
                    {new Date(nextExam.examDate).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
                    <span className={`chip ${confidenceOf(nextExam.confidence).chip}`}>{nextExam.confidence} confidence</span>
                  </div>
                  <Link to="/progress" className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-violet-300 hover:text-violet-200">
                    Plan your revision <ChevronRight size={16} />
                  </Link>
                </div>
                <Countdown date={nextExam.examDate} />
              </div>
            ) : (
              <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-display text-xl font-bold text-white">No upcoming exams yet</div>
                  <p className="text-sm text-slate-400">Add your exam dates to get a live countdown and smart reminders.</p>
                </div>
                <button onClick={() => navigate("/progress")} className="btn-primary">
                  <CalendarClock size={16} /> Add exam dates
                </button>
              </div>
            )}
          </Card>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {quickActions.map((a) => (
              <motion.button
                key={a.label}
                variants={item}
                whileHover={{ y: -4 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(a.route)}
                className="glass group p-5 text-left transition-colors hover:border-white/20"
              >
                <div className={`grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br ${a.gradient} shadow-lg transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110`}>
                  <a.icon size={20} className="text-white" />
                </div>
                <div className="mt-4 font-semibold text-white">{a.label}</div>
                <div className="text-xs text-slate-400">{a.hint}</div>
              </motion.button>
            ))}
          </div>

          {/* Recently added */}
          <Card className="p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="section-title">
                <BookOpen size={18} className="text-cyan-300" /> Fresh study materials
              </h2>
              <Link to="/resources" className="text-sm font-semibold text-violet-300 hover:text-violet-200">
                View all
              </Link>
            </div>
            {loading ? (
              <div className="grid gap-3 md:grid-cols-2">
                {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-20" />)}
              </div>
            ) : materials.length === 0 ? (
              <p className="text-sm text-slate-400">📂 No new materials yet — be the first to upload one!</p>
            ) : (
              <div className="grid gap-3 md:grid-cols-2">
                {materials.map((it) => {
                  const t = typeOf(it.type);
                  return (
                    <a
                      key={it._id}
                      href={it.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 transition hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.06]"
                    >
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br ${t.gradient}`}>
                        <t.icon size={20} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-white group-hover:text-violet-200">{it.title}</div>
                        <div className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                          <span>{t.label}</span>·<span>{shortDate(it.releaseDate)}</span>
                          {isNew(it.releaseDate) && <span className="rounded-full bg-fuchsia-500/20 px-1.5 text-[10px] font-bold text-fuchsia-200">NEW</span>}
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="text-slate-500 transition group-hover:text-white" />
                    </a>
                  );
                })}
              </div>
            )}
          </Card>

          {/* Announcements */}
          <Card className="p-6">
            <h2 className="section-title mb-4">
              <Bell size={18} className="text-amber-300" /> Latest announcements
            </h2>
            {loading ? (
              <div className="space-y-3">
                {[0, 1].map((i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : announcements.length === 0 ? (
              <p className="text-sm text-slate-400">📭 No announcements right now.</p>
            ) : (
              <div className="space-y-3">
                {announcements.map((n, i) => (
                  <div
                    key={n.id || i}
                    className={`relative overflow-hidden rounded-2xl border p-4 ${
                      n.priority ? "border-rose-400/25 bg-rose-500/[0.08]" : "border-white/[0.06] bg-white/[0.03]"
                    }`}
                  >
                    {n.priority && <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-b from-rose-400 to-fuchsia-500" />}
                    <div className="flex items-start gap-2 text-sm text-slate-200">
                      {n.priority && <Sparkles size={16} className="mt-0.5 shrink-0 text-rose-300" />}
                      {n.message}
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                      <Clock size={12} /> {timeAgo(n.createdAt)} · {n.audience}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* ===== RIGHT COLUMN ===== */}
        <div className="space-y-6">
          <Card className="p-6" glow="rgba(240,171,252,0.14)">
            <h3 className="section-title mb-5">
              <Timer size={18} className="text-fuchsia-300" /> Focus zone
            </h3>
            <FocusFace size={180} />
          </Card>

          <Card className="p-6">
            <h3 className="section-title mb-4">
              <Gauge size={18} className="text-emerald-300" /> Exam readiness
            </h3>
            <ProgressRing value={readiness} label={`${progressData?.confidence || "Medium"} confidence`} from="#34d399" to="#22d3ee" />
            {upcoming.length > 0 && (
              <div className="mt-6 space-y-2">
                {upcoming.slice(0, 3).map((x) => {
                  const d = daysUntil(x.examDate);
                  return (
                    <button
                      key={x._id}
                      onClick={() => navigate("/progress")}
                      className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-white/5"
                    >
                      <div className="grid h-11 w-12 place-items-center rounded-xl border border-white/10 bg-white/5 text-center leading-none">
                        <div>
                          <div className="font-display text-sm font-bold text-white">{shortDate(x.examDate).split(" ")[1]}</div>
                          <div className="text-[9px] uppercase text-slate-400">{shortDate(x.examDate).split(" ")[0]}</div>
                        </div>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{x.subject}</div>
                        <div className={`text-xs ${confidenceOf(x.confidence).text}`}>{x.confidence} confidence</div>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-[11px] font-bold ${d <= 5 ? "bg-rose-500/15 text-rose-200" : "bg-white/10 text-slate-300"}`}>
                        {d}d
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6" glow="rgba(34,211,238,0.12)">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="section-title">
                <Trophy size={18} className="text-amber-300" /> Climb the ranks
              </h3>
              <Link to="/leaderboard" className="text-xs font-semibold text-violet-300 hover:text-violet-200">
                Full board
              </Link>
            </div>
            <div className="space-y-2">
              {nearby.map((p) => {
                const r = game.leaders.indexOf(p) + 1;
                const isMe = p.name === name;
                return (
                  <div
                    key={p.name}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2 ${isMe ? "border border-violet-400/30 bg-violet-500/10" : ""}`}
                  >
                    <span className="w-5 text-center font-display text-sm font-bold text-slate-400">{["🥇", "🥈", "🥉"][r - 1] || r}</span>
                    <Avatar name={p.name} size={30} />
                    <span className="flex-1 truncate text-sm font-medium text-white">
                      {p.name} {isMe && <span className="text-xs text-violet-300">(you)</span>}
                    </span>
                    <span className="text-sm font-bold text-violet-200">{p.score}</span>
                  </div>
                );
              })}
              {nearby.length === 0 && <p className="text-sm text-slate-400">No rankings yet.</p>}
            </div>
          </Card>

          <Card className="p-6" glow="rgba(251,191,36,0.12)">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-amber-300 to-orange-500">
                <Lightbulb size={18} className="text-ink-950" />
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-widest text-amber-200/80">Tip of the day</div>
                <p className="mt-1 text-sm leading-relaxed text-slate-300">{tipOfTheDay()}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
