import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Crown, Flame, Timer, Lock, Award, CalendarDays, Save, RotateCcw, Mail, Hash, GraduationCap, ShieldCheck } from "lucide-react";
import { useRules } from "../utils/rules.js";
import API from "../api";
import { useUser } from "../context/UserContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useFocus } from "../context/FocusContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, pop } from "../components/ui/motion.js";
import { computeBadges, dayKey, getActivity } from "../utils/gamification.js";
import { celebrate } from "../utils/confetti.js";

function Heatmap() {
  const activity = useMemo(getActivity, []);
  const weeks = 15;
  const today = new Date();
  // start on the Sunday `weeks` weeks ago so columns line up as calendar weeks
  const start = new Date(today);
  start.setDate(today.getDate() - today.getDay() - (weeks - 1) * 7);

  const cells = [];
  for (let i = 0; i < weeks * 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const mins = activity[dayKey(d)] || 0;
    cells.push({ d, mins, future: d > today });
  }
  const level = (m) => (m === 0 ? 0 : m < 20 ? 1 : m < 50 ? 2 : m < 90 ? 3 : 4);
  const colors = ["bg-white/[0.05]", "bg-violet-500/30", "bg-violet-500/55", "bg-fuchsia-500/75", "bg-fuchsia-400"];
  const activeDays = cells.filter((c) => c.mins > 0).length;

  return (
    <div>
      <div className="grid grid-flow-col grid-rows-7 gap-1">
        {cells.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.4 }}
            animate={{ opacity: c.future ? 0.15 : 1, scale: 1 }}
            transition={{ delay: i * 0.004 }}
            title={`${c.d.toDateString()} · ${c.mins ? `${c.mins} min` : "no activity"}`}
            className={`aspect-square rounded-[4px] ${colors[level(c.mins)]} ${dayKey(c.d) === dayKey() ? "ring-1 ring-white/60" : ""}`}
          />
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>{activeDays} active days in the last {weeks} weeks</span>
        <span className="flex items-center gap-1">
          Less {colors.map((c) => <span key={c} className={`h-2.5 w-2.5 rounded-sm ${c}`} />)} More
        </span>
      </div>
    </div>
  );
}

export default function Profile() {
  const { setUser } = useUser();
  const game = useGame();
  const focus = useFocus();
  const toast = useToast();
  const rules = useRules();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("personal");
  const [formData, setFormData] = useState({});
  const [extra, setExtra] = useState({ results: 0, posts: 0, readiness: 0 });

  const resetForm = (data) =>
    setFormData({
      name: data.name || "",
      email: data.email || "",
      phone: data.phone || "",
      rollNumber: data.rollNumber || "",
      branch: data.branch || "",
      year: data.year || "",
    });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data } = await API.get("/auth/me");
        setProfile(data);
        resetForm(data);

        const [res, disc, prog] = await Promise.all([
          API.get("/result").catch(() => ({ data: [] })),
          API.get("/discussions").catch(() => ({ data: [] })),
          API.get("/progress").catch(() => ({ data: {} })),
        ]);
        setExtra({
          results: res.data.length,
          posts: disc.data.filter((d) => d.author === data.name).length,
          readiness: prog.data.progressPercent || 0,
        });
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleSave = async () => {
    try {
      const { data } = await API.put("/auth/profile", formData);
      setProfile(data);
      setUser(data);
      celebrate({ particleCount: 50 });
      toast({ title: "Profile updated successfully" });
    } catch (err) {
      console.error("Error updating profile:", err);
      toast({ type: "error", title: "Couldn't save your profile" });
    }
  };

  if (loading || !profile)
    return (
      <div className="space-y-6">
        <Skeleton className="h-56" />
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );

  const badges = computeBadges({
    contributions: game.contributions,
    rank: game.rank,
    resultsCount: extra.results,
    streak: game.streak.best,
    focusMinutes: focus.stats.totalMinutes,
    posts: extra.posts,
    readiness: extra.readiness,
  });
  const earned = badges.filter((b) => b.earned).length;

  const field = (key, label, placeholder = "", type = "text", readOnly = false) => (
    <div>
      <label className="label flex items-center gap-1">
        {label} {readOnly && <Lock size={10} className="text-slate-500" />}
      </label>
      <input
        type={type}
        value={formData[key]}
        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
        placeholder={placeholder}
        readOnly={readOnly}
        title={readOnly ? "Set from your roll number at signup" : undefined}
        className={`input ${readOnly ? "cursor-not-allowed opacity-60" : ""}`}
      />
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Banner */}
      <Card className="p-0" spotlight={false}>
        <div className="relative h-36 overflow-hidden rounded-t-3xl bg-gradient-to-r from-violet-600 via-fuchsia-600 to-cyan-500 sm:h-44">
          <div className="bg-grid absolute inset-0 opacity-30" />
          <div className="absolute -right-10 -top-16 h-56 w-56 animate-float rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-cyan-300/30 blur-2xl" />
        </div>
        <div className="flex flex-col gap-4 px-6 pb-6 sm:flex-row sm:items-end">
          <motion.div variants={pop} className="-mt-14 rounded-full p-1.5 sm:-mt-16" style={{ background: "conic-gradient(from 180deg, #a78bfa, #f0abfc, #22d3ee, #a78bfa)" }}>
            <Avatar name={profile.name} size={112} className="ring-4 ring-ink-900" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-white">{profile.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-slate-400">
              <span className="flex items-center gap-1"><Hash size={13} />{profile.rollNumber || "No roll number"}</span>
              <span className="chip">{profile.branch || "—"}</span>
              {profile.year && <span className="chip"><GraduationCap size={12} />{profile.year}</span>}
              <span className="chip !border-amber-300/30 !bg-amber-300/10 !text-amber-100">
                <Sparkles size={12} /> Lv {game.level.level} · {game.level.title}
              </span>
              {game.xp >= rules.trustedXp && (
                <span className="chip !border-emerald-400/30 !bg-emerald-400/10 !text-emerald-200" title="Your uploads go live instantly">
                  <ShieldCheck size={12} /> Trusted uploader
                </span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { icon: Sparkles, label: "Total XP", value: game.xp, g: "from-amber-300 to-orange-500" },
          { icon: Crown, label: "Leaderboard rank", value: game.rank || 0, prefix: "#", g: "from-violet-500 to-fuchsia-600" },
          { icon: Flame, label: "Best streak", value: game.streak.best, suffix: " days", g: "from-orange-400 to-rose-600" },
          { icon: Timer, label: "Focus time", value: focus.stats.totalMinutes, suffix: " min", g: "from-cyan-400 to-blue-600" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br ${s.g} shadow-lg`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-white">
              {s.prefix}
              {s.value ? <AnimatedNumber value={s.value} suffix={s.suffix} /> : "—"}
            </div>
            <div className="text-xs text-slate-400">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,1fr]">
        <div className="space-y-6">
          {/* Badges */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">
                <Award size={18} className="text-amber-300" /> Achievements
              </h2>
              <span className="chip">{earned}/{badges.length} unlocked</span>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {badges.map((b, i) => (
                <motion.div
                  key={b.id}
                  initial={{ opacity: 0, scale: 0.6, rotate: -8 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15 + i * 0.06, type: "spring", stiffness: 260, damping: 16 }}
                  whileHover={b.earned ? { y: -4, rotate: 3 } : {}}
                  className={`group relative flex flex-col items-center rounded-2xl border p-4 text-center ${
                    b.earned ? "border-white/10 bg-white/[0.04]" : "border-dashed border-white/[0.08]"
                  }`}
                  title={b.desc}
                >
                  <div
                    className={`relative grid h-14 w-14 place-items-center rounded-2xl ${
                      b.earned ? `bg-gradient-to-br ${b.color} shadow-lg` : "bg-white/[0.04]"
                    }`}
                  >
                    {b.earned ? <b.icon size={24} className="text-white" /> : <Lock size={20} className="text-slate-600" />}
                    {b.earned && <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${b.color} opacity-50 blur-lg`} />}
                  </div>
                  <div className={`mt-3 text-sm font-semibold ${b.earned ? "text-white" : "text-slate-500"}`}>{b.label}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-slate-500">{b.desc}</div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Heatmap */}
          <Card className="p-6">
            <h2 className="section-title mb-4">
              <CalendarDays size={18} className="text-fuchsia-300" /> Study activity
            </h2>
            <Heatmap />
          </Card>
        </div>

        {/* Edit form */}
        <Card className="p-6" spotlight={false}>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <h2 className="section-title">Edit details</h2>
            <Segmented
              size="sm"
              value={tab}
              onChange={setTab}
              options={[
                { value: "personal", label: "Personal", icon: Mail },
                { value: "academic", label: "Academic", icon: GraduationCap },
              ]}
            />
          </div>

          <motion.div key={tab} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="grid gap-4 md:grid-cols-2">
            {tab === "personal" ? (
              <>
                {field("name", "Full name")}
                {field("email", "Contact email", "", "email")}
                <div className="md:col-span-2">{field("phone", "Phone number", "Add phone number", "tel")}</div>
              </>
            ) : (
              <>
                {field("rollNumber", "Roll number", "", "text", true)}
                {field("branch", "Branch", "", "text", true)}
                {field("year", "Current year", "E.g., 2nd Year")}
              </>
            )}
          </motion.div>

          <div className="mt-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-slate-400">Overall progress</span>
              <span className="font-semibold text-white">{extra.readiness}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-300"
                initial={{ width: 0 }}
                animate={{ width: `${extra.readiness}%` }}
                transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
              />
            </div>
            <div className="mt-1.5 text-xs text-slate-500">of {profile.branch || "your"} goals completed</div>
          </div>

          <div className="mt-6 flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => resetForm(profile)}>
              <RotateCcw size={15} /> Reset
            </button>
            <button className="btn-primary" onClick={handleSave}>
              <Save size={15} /> Save changes
            </button>
          </div>
        </Card>
      </div>
    </motion.div>
  );
}
