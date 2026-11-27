import React, { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, Sparkles, CheckCheck } from "lucide-react";
import API from "../api";

const timeAgo = (d) => {
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

export default function NotificationBell() {
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    API.get("/notification")
      .then((res) => setItems(res.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    const close = (e) => !ref.current?.contains(e.target) && setOpen(false);
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, [open]);

  const unread = items.filter((n) => !n.read).length;

  const markRead = (n) => {
    if (n.read) return;
    setItems((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    API.post(`/notification/${n.id}/read`).catch(() => {});
  };

  const markAll = () => items.filter((n) => !n.read).forEach(markRead);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-300 transition hover:bg-white/10 hover:text-white"
        aria-label="Announcements"
      >
        <Bell size={18} className={unread ? "origin-top animate-[wiggle_1s_ease-in-out_2]" : ""} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white shadow-lg">
            {unread}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.98 }}
            transition={{ duration: 0.16 }}
            className="glass-strong absolute right-0 top-12 z-50 w-[22rem] max-w-[calc(100vw-2rem)] overflow-hidden !rounded-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div className="font-display font-semibold text-white">Announcements</div>
              {unread > 0 && (
                <button onClick={markAll} className="flex items-center gap-1 text-xs text-accent hover:text-accent">
                  <CheckCheck size={14} /> Mark all read
                </button>
              )}
            </div>
            <div className="max-h-96 overflow-y-auto p-2">
              {items.length === 0 && <div className="px-3 py-8 text-center text-sm text-zinc-400">You're all caught up ✨</div>}
              {items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => markRead(n)}
                  className={`flex w-full gap-3 rounded-xl px-3 py-3 text-left transition hover:bg-white/5 ${n.read ? "opacity-60" : ""}`}
                >
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
 n.read ? "bg-transparent" : n.priority ? "bg-rose-400 shadow-[0_0_10px] shadow-rose-400" : "bg-accent"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start gap-1.5 text-sm text-zinc-200">
                      {n.priority && <Sparkles size={14} className="mt-0.5 shrink-0 text-rose-300" />}
                      {n.message}
                    </span>
                    <span className="mt-1 block text-xs text-zinc-500">
                      {timeAgo(n.createdAt)} · {n.audience}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
