import React from "react";
import { motion } from "framer-motion";
import { Flame, Sparkles, CalendarClock, Trophy, BookOpen, MessagesSquare, TrendingUp } from "lucide-react";
import AuroraBackground from "./AuroraBackground.jsx";
import { Brand } from "./NavSidebar.jsx";

function FloatCard({ className, delay = 0, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay, type: "spring", stiffness: 160, damping: 18 }}
      className={`absolute ${className}`}
    >
      <div className="glass-strong animate-float !rounded-2xl px-4 py-3" style={{ animationDelay: `${delay * 2}s` }}>
        {children}
      </div>
    </motion.div>
  );
}

const features = [
  { icon: BookOpen, text: "Notes, slides & PYQs for your branch" },
  { icon: TrendingUp, text: "Track results and exam readiness" },
  { icon: MessagesSquare, text: "Discuss doubts with your batch" },
  { icon: Trophy, text: "Earn XP, level up, top the leaderboard" },
];

// Split-screen frame for the login and signup pages
export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen overflow-hidden text-slate-100">
      <AuroraBackground />
      <div className="mx-auto grid min-h-screen max-w-7xl items-center gap-10 px-4 py-10 lg:grid-cols-2 lg:px-8">
        {/* Showcase */}
        <div className="relative hidden lg:block">
          <Brand subtitle="Prep smarter" />
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-10 text-5xl font-bold leading-[1.1] text-white xl:text-6xl"
          >
            Prepare for exams.
            <br />
            <span className="animate-gradient-x bg-gradient-to-r from-violet-300 via-fuchsia-300 to-cyan-300 bg-[length:200%_auto] bg-clip-text text-transparent">
              Track every win.
            </span>
          </motion.h1>
          <motion.ul initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08, delayChildren: 0.3 } } }} className="mt-8 space-y-3">
            {features.map((f) => (
              <motion.li
                key={f.text}
                variants={{ hidden: { opacity: 0, x: -16 }, show: { opacity: 1, x: 0 } }}
                className="flex items-center gap-3 text-slate-300"
              >
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/[0.06] text-violet-300">
                  <f.icon size={16} />
                </span>
                {f.text}
              </motion.li>
            ))}
          </motion.ul>

          <div className="relative mt-10 h-56">
            <FloatCard className="left-0 top-0" delay={0.5}>
              <div className="flex items-center gap-2 text-sm font-semibold text-orange-200">
                <Flame size={18} className="animate-flicker text-orange-400" /> 12-day streak
              </div>
            </FloatCard>
            <FloatCard className="left-44 top-16" delay={0.7}>
              <div className="text-[10px] uppercase tracking-widest text-slate-400">Level 5</div>
              <div className="flex items-center gap-1.5 font-display font-bold text-white">
                <Sparkles size={14} className="text-amber-300" /> Topper in Making
              </div>
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-white/10">
                <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-violet-400 to-cyan-300" />
              </div>
            </FloatCard>
            <FloatCard className="left-8 top-36" delay={0.9}>
              <div className="flex items-center gap-2 text-sm">
                <CalendarClock size={16} className="text-cyan-300" />
                <span className="text-slate-300">OS exam in</span>
                <span className="font-display font-bold text-white">4 days</span>
              </div>
            </FloatCard>
            <FloatCard className="left-80 top-0" delay={1.1}>
              <div className="flex items-center gap-2 text-sm font-semibold text-amber-200">
                <Trophy size={16} /> +15 XP for PYQs
              </div>
            </FloatCard>
          </div>
        </div>

        {/* Form */}
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="mx-auto w-full max-w-md"
        >
          <div className="mb-8 flex justify-center lg:hidden">
            <Brand subtitle="Prep smarter" />
          </div>
          <div className="glass-strong relative overflow-hidden p-7 sm:p-8">
            <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-fuchsia-500/20 blur-3xl" />
            <div className="relative">{children}</div>
          </div>
          <div className="mt-6 text-center text-xs text-slate-500">© 2025 PrepTrack · Team B8</div>
        </motion.div>
      </div>
    </div>
  );
}
