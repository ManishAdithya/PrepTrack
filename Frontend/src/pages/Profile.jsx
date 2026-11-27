import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Crown, Flame, Lock, Award, CalendarDays, Save, RotateCcw, Mail, Hash, GraduationCap, ShieldCheck } from "lucide-react";
import { useRules } from "../utils/rules.js";
import API from "../api";
import { useUser } from "../context/UserContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import AnimatedNumber from "../components/ui/AnimatedNumber.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import AccountSettings from "../components/AccountSettings.jsx";
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
  const colors = ["bg-white/[0.05]", "bg-accent/30", "bg-accent/55", "bg-accent/75", "bg-accent"];
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
      <div className="mt-3 flex items-center justify-between text-xs text-zinc-500">
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
  const toast = useToast();
  const rules = useRules();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("personal");
  const [formData, setFormData] = useState({});
  const [extra, setExtra] = useState({ posts: 0 });

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

        const disc = await API.get("/discussions").catch(() => ({ data: [] }));
        setExtra({ posts: disc.data.filter((d) => d.author === data.name).length });
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
    streak: game.streak.best,
    posts: extra.posts,
  });
  const earned = badges.filter((b) => b.earned).length;

  const field = (key, label, placeholder = "", type = "text", readOnly = false) => (
    <div>
      <label className="label flex items-center gap-1">
        {label} {readOnly && <Lock size={10} className="text-zinc-500" />}
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
        <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <motion.div variants={pop}>
            <Avatar name={profile.name} size={72} className="ring-2 ring-accent ring-offset-4 ring-offset-ink-800" />
          </motion.div>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-white sm:text-3xl">{profile.name}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-zinc-400">
              <span className="flex items-center gap-1"><Hash size={13} />{profile.rollNumber || "No roll number"}</span>
              <span className="chip">{profile.branch || "—"}</span>
              {profile.year && <span className="chip"><GraduationCap size={12} />{profile.year}</span>}
              <span className="chip !border-accent/30 !bg-accent/10 !text-accent">
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
          { icon: Sparkles, label: "Total XP", value: game.xp, g: "bg-white/[0.06]" },
          { icon: Crown, label: "Leaderboard rank", value: game.rank || 0, prefix: "#", g: "bg-white/[0.06]" },
          { icon: Flame, label: "Best streak", value: game.streak.best, suffix: " days", g: "bg-white/[0.06]" },
          { icon: Award, label: "Uploads", value: game.contributions, g: "bg-white/[0.06]" },
        ].map((s) => (
          <Card key={s.label} className="p-5">
            <div className={`grid h-10 w-10 place-items-center rounded-xl ${s.g} shadow-lg`}>
              <s.icon size={18} className="text-white" />
            </div>
            <div className="mt-3 font-display text-2xl font-bold text-white">
              {s.prefix}
              {s.value ? <AnimatedNumber value={s.value} suffix={s.suffix} /> : "—"}
            </div>
            <div className="text-xs text-zinc-400">{s.label}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr,1fr]">
        <div className="space-y-6">
          {/* Badges */}
          <Card className="p-6">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="section-title">
                <Award size={18} className="text-accent" /> Achievements
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
 b.earned ? ` ${b.color} shadow-lg` : "bg-white/[0.04]"
                    }`}
                  >
                    {b.earned ? <b.icon size={24} className="text-white" /> : <Lock size={20} className="text-zinc-600" />}
                    {b.earned && <div className={`absolute inset-0 -z-10 rounded-2xl ${b.color} opacity-50 blur-lg`} />}
                  </div>
                  <div className={`mt-3 text-sm font-semibold ${b.earned ? "text-white" : "text-zinc-500"}`}>{b.label}</div>
                  <div className="mt-0.5 text-[11px] leading-tight text-zinc-500">{b.desc}</div>
                </motion.div>
              ))}
            </div>
          </Card>

          {/* Heatmap */}
          <Card className="p-6">
            <h2 className="section-title mb-4">
              <CalendarDays size={18} className="text-accent" /> Study activity
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

      {/* Account: leaderboard privacy, password, CR portal, log out */}
      <AccountSettings onChange={(changes) => setProfile((p) => ({ ...p, ...changes }))} />
    </motion.div>
  );
}
