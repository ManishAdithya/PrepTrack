import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Trophy, Upload } from "lucide-react";
import API from "../api";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { levelFor } from "../utils/gamification.js";
import { useRules } from "../utils/rules.js";

const EARN = [
  ["PYQs", 15],
  ["Notes", 10],
  ["Slides", 8],
];

export default function Leaderboard() {
  const rules = useRules();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    API.get("/leaderboard")
      .then(({ data }) => setList(data.sort((a, b) => b.score - a.score)))
      .catch(() => setError("Failed to load leaderboard."))
      .finally(() => setLoading(false));
  }, []);

  const meIdx = list.findIndex((l) => l.isMe);
  const me = list[meIdx];
  const ahead = meIdx > 0 ? list[meIdx - 1] : null;

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-24" />
        <Skeleton className="h-96" />
      </div>
    );
  if (error) return <EmptyState icon={Trophy} title="Leaderboard unavailable" text={error} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Ranks"
        subtitle="Earn XP when your uploads are approved."
        actions={
          <Link to="/profile#privacy" className="text-xs font-semibold text-zinc-400 hover:text-white">
            Hide my name
          </Link>
        }
      />

      {/* Your position */}
      {me && (
        <Card variants={item} className="p-5">
          <div className="flex items-center gap-4">
            <div className="font-display text-4xl font-bold text-accent">#{meIdx + 1}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-white">{me.score} XP</span>
                <span className="truncate text-xs text-zinc-500">
                  Lv {levelFor(me.score).level} · {levelFor(me.score).title}
                </span>
              </div>
              {ahead ? (
                <>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-accent" style={{ width: `${Math.min(100, (me.score / ahead.score) * 100)}%` }} />
                  </div>
                  <div className="mt-1.5 text-xs text-zinc-400">
                    <span className="font-semibold text-white">{ahead.score - me.score + 1} XP</span> to pass {ahead.name}
                  </div>
                </>
              ) : (
                <div className="mt-1 text-xs text-zinc-400">You're top of the class.</div>
              )}
            </div>
          </div>
          <Link to="/resources?upload=1" className="btn-primary mt-4 w-full sm:w-auto">
            <Upload size={16} /> Upload to earn XP
          </Link>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr,280px]">
        {/* Ranking */}
        <Card variants={item} className="p-0">
          {list.length === 0 ? (
            <EmptyState icon={Trophy} title="No rankings yet" text="Upload materials to appear here." />
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {list.map((r, i) => {
                const isMe = !!r.isMe;
                return (
                  <li key={r.name + i} className={`flex items-center gap-3 px-4 py-3 sm:px-5 ${isMe ? "bg-accent/[0.06]" : ""}`}>
                    <span className={`w-7 font-display text-base font-bold ${i < 3 ? "text-accent" : "text-zinc-500"}`}>{i + 1}</span>
                    {r.hidden ? (
                      <div className="grid h-[34px] w-[34px] shrink-0 place-items-center rounded-full border border-dashed border-white/15 text-sm text-zinc-600">?</div>
                    ) : (
                      <Avatar name={r.name} size={34} />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className={`truncate text-sm font-semibold ${isMe ? "text-accent" : r.hidden ? "italic text-zinc-500" : "text-white"}`}>
                        {r.name}
                        {isMe && " (you)"}
                      </div>
                      <div className="text-xs text-zinc-500">
                        Lv {levelFor(r.score).level} · {r.contributions ?? 0} uploads
                      </div>
                    </div>
                    <span className="font-display text-base font-bold text-white">{r.score ?? 0}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>

        {/* How to earn */}
        <Card variants={item} className="h-fit p-5">
          <h2 className="font-display text-base font-bold text-white">How to earn XP</h2>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {EARN.map(([label, xp]) => (
              <div key={label} className="rounded-xl border border-white/[0.08] py-2.5">
                <div className="font-display text-lg font-bold text-accent">+{xp}</div>
                <div className="text-[11px] text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-zinc-500">
            Counted once an upload is approved — by a CR or by {rules.approveUpvotes} classmates' upvotes. At{" "}
            <span className="font-semibold text-white">{rules.trustedXp} XP</span> your uploads go live instantly.
          </p>
        </Card>
      </div>
    </motion.div>
  );
}
