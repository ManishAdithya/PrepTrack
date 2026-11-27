import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ChevronRight, Upload, Megaphone, ArrowUpRight } from "lucide-react";
import API from "../api";
import { useUser } from "../context/UserContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import Card from "../components/ui/Card.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import ExamCountdown, { UpcomingExams, useCountdownChoice } from "../components/ExamCountdown.jsx";
import { daysLeft } from "../utils/exams.js";
import { container, item } from "../components/ui/motion.js";
import { greeting } from "../utils/gamification.js";
import { isNew, shortDate, timeAgo, typeOf } from "../utils/ui.js";

// One number with a label; the whole cell is a link
// `to` starting with # scrolls within the page (a plain anchor); anything else is an app route
function Glance({ to, label, value, sub, subClass = "text-zinc-500" }) {
  const Tag = to.startsWith("#") ? "a" : Link;
  return (
    <Tag {...(to.startsWith("#") ? { href: to } : { to })} className="group min-w-0 flex-1 p-4 transition hover:bg-white/[0.03] sm:p-5">
      <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
        {label}
      </div>
      <div className="mt-1 truncate font-display text-2xl font-bold text-white sm:text-3xl">{value}</div>
      <div className={`truncate text-xs ${subClass}`}>{sub}</div>
    </Tag>
  );
}

function SectionHead({ title, to, linkLabel = "View all" }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="font-display text-base font-bold text-white">{title}</h2>
      {to && (
        <Link to={to} className="flex items-center text-sm font-semibold text-zinc-400 hover:text-white">
          {linkLabel} <ChevronRight size={16} />
        </Link>
      )}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useUser();
  const { user: authUser } = useAuth();
  const game = useGame();
  const navigate = useNavigate();

  const [materials, setMaterials] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([API.get("/upload"), API.get("/notification"), API.get("/exams").catch(() => ({ data: [] }))])
      .then(([m, n, ex]) => {
        setExams(ex.data);
        setMaterials(m.data.slice(0, 3));
        setAnnouncements(n.data);
      })
      .catch((err) => console.error("Dashboard Fetch Error:", err))
      .finally(() => setLoading(false));
  }, []);

  const name = user?.name || authUser?.name || "Student";
  const firstName = name.split(" ")[0];
  // countdown: the exam the student picked, or the next one
  const { current, choose, live } = useCountdownChoice(exams);
  const thisWeek = live.filter((e) => daysLeft(e.date) <= 7).length;
  const urgent = announcements.find((a) => a.priority && !a.read);
  const otherNews = announcements.filter((a) => a !== urgent).slice(0, 2);

  // the student plus the people right around them on the leaderboard
  const myIndex = game.rank ? game.rank - 1 : -1;
  const nearby = game.leaders.slice(Math.max(0, myIndex - 1), Math.max(0, myIndex - 1) + 3);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* ===== Greeting ===== */}
      <motion.div variants={item} className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <div className="text-sm text-zinc-500">{greeting()}</div>
          <h1 className="truncate text-2xl font-bold text-white sm:text-3xl">Hi {firstName}</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {game.ahead ? (
              <>
                <span className="font-semibold text-accent">{game.ahead.score - game.xp + 1} XP</span> to pass {game.ahead.name.split(" ")[0]}
              </>
            ) : game.rank === 1 ? (
              <>You're <span className="font-semibold text-accent">#1</span> in your class</>
            ) : (
              <>Upload your first material to start earning XP</>
            )}
          </p>
        </div>
      </motion.div>

      {/* ===== Urgent announcement (only when there is one) ===== */}
      {urgent && (
        <motion.div variants={item} initial="hidden" animate="show" className="flex gap-3 rounded-2xl border border-accent/40 bg-accent/[0.07] p-4">
          <Megaphone size={18} className="mt-0.5 shrink-0 text-accent" />
          <div className="min-w-0 text-sm">
            <div className="text-white">{urgent.message}</div>
            <div className="mt-1 text-xs text-zinc-500">
              {urgent.createdBy} · {timeAgo(urgent.createdAt)}
            </div>
          </div>
        </motion.div>
      )}

      {/* ===== Exam countdown (from the CR's schedule) ===== */}
      <motion.div variants={item}>
        {loading ? <Skeleton className="h-56" /> : <ExamCountdown exams={exams} current={current} choose={choose} />}
      </motion.div>

      {/* ===== At a glance ===== */}
      <Card variants={item} className="flex divide-x divide-white/[0.06] p-0">
        {loading ? (
          <div className="flex-1 p-5">
            <Skeleton className="h-16" />
          </div>
        ) : (
          <>
            <Glance to="#exams" label="Upcoming" value={String(live.length)} sub={live.length === 1 ? "exam" : "exams"} />
            <Glance
              to="#exams"
              label="This week"
              value={live.length ? String(thisWeek) : "—"}
              sub={thisWeek === 1 ? "exam" : "exams"}
              subClass={thisWeek ? "text-rose-400" : "text-zinc-500"}
            />
            <Glance to="/leaderboard" label="Rank" value={game.rank ? `#${game.rank}` : "—"} sub={`${game.xp} XP`} />
          </>
        )}
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr,320px]">
        <div className="min-w-0 space-y-6">
          {/* ===== Upcoming exams ===== */}
          {live.length > 0 && (
            <motion.section id="exams" variants={item} initial="hidden" animate="show" className="scroll-mt-20">
              <SectionHead title={`Upcoming exams · ${live.length}`} />
              <Card variants={null} className="p-0">
                <UpcomingExams exams={live} current={current} choose={choose} />
              </Card>
            </motion.section>
          )}

          {/* ===== New materials ===== */}
          <motion.section variants={item}>
            <SectionHead title="New materials" to="/resources" />
            <Card variants={null} className="divide-y divide-white/[0.06] p-0">
              {loading ? (
                <div className="p-4">
                  <Skeleton className="h-14" />
                </div>
              ) : materials.length === 0 ? (
                <button onClick={() => navigate("/resources?upload=1")} className="flex w-full items-center gap-3 p-4 text-left text-sm text-zinc-400 hover:text-white">
                  <Upload size={16} /> Nothing yet — be the first to upload
                </button>
              ) : (
                materials.map((m) => {
                  const t = typeOf(m.type);
                  return (
                    <a
                      key={m._id}
                      href={m.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group flex items-center gap-3 p-4 transition hover:bg-white/[0.03]"
                    >
                      <t.icon size={18} className="shrink-0 text-zinc-500" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{m.title}</div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-zinc-500">
                          {t.label} · {shortDate(m.releaseDate)}
                          {isNew(m.releaseDate) && <span className="font-bold text-accent">NEW</span>}
                        </div>
                      </div>
                      <ArrowUpRight size={16} className="shrink-0 text-zinc-600 group-hover:text-white" />
                    </a>
                  );
                })
              )}
            </Card>
          </motion.section>

          {/* ===== Announcements ===== */}
          {otherNews.length > 0 && (
            <motion.section variants={item} initial="hidden" animate="show">
              <SectionHead title="Announcements" />
              <Card variants={null} className="divide-y divide-white/[0.06] p-0">
                {otherNews.map((n) => (
                  <div key={n.id} className="p-4">
                    <div className="text-sm text-zinc-200">{n.message}</div>
                    <div className="mt-1 text-xs text-zinc-500">
                      {n.createdBy} · {timeAgo(n.createdAt)}
                    </div>
                  </div>
                ))}
              </Card>
            </motion.section>
          )}

        </div>

        {/* ===== Side column (desktop) ===== */}
        <div className="hidden space-y-6 lg:block">
          {nearby.length > 0 && (
            <section>
              <SectionHead title="Around you" to="/leaderboard" linkLabel="Ranks" />
              <Card variants={null} className="divide-y divide-white/[0.06] p-0">
                {nearby.map((p) => {
                  const r = game.leaders.indexOf(p) + 1;
                  const me = !!p.isMe;
                  return (
                    <div key={p.name} className={`flex items-center gap-3 px-4 py-3 ${me ? "bg-accent/[0.06]" : ""}`}>
                      <span className="w-6 font-display text-sm font-bold text-zinc-500">#{r}</span>
                      <Avatar name={p.name} size={28} />
                      <span className={`flex-1 truncate text-sm ${me ? "font-semibold text-accent" : "text-white"}`}>
                        {me ? "You" : p.name}
                      </span>
                      <span className="text-sm font-bold text-zinc-300">{p.score}</span>
                    </div>
                  );
                })}
              </Card>
            </section>
          )}
        </div>
      </div>
    </motion.div>
  );
}
