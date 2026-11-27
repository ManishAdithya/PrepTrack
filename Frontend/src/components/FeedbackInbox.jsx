import React, { useEffect, useState } from "react";
import { Bug, Lightbulb, MessageCircle, Check, CheckCheck, RotateCcw } from "lucide-react";
import API from "../api";
import Segmented from "./ui/Segmented.jsx";
import { timeAgo } from "../utils/ui.js";

const KIND = {
  Issue: { icon: Bug, color: "#d03b3b", label: "Issue" },
  Improvement: { icon: Lightbulb, color: "#fab219", label: "Improvement" },
  Comment: { icon: MessageCircle, color: "#3987e5", label: "Comment" },
};

// "Chrome on Android", "Safari on iPhone"… from the user-agent string
function device(ua = "") {
  const os = /android/i.test(ua) ? "Android" : /iphone|ipad/i.test(ua) ? "iPhone" : /windows/i.test(ua) ? "Windows" : /mac os/i.test(ua) ? "Mac" : /linux/i.test(ua) ? "Linux" : "";
  const br = /edg\//i.test(ua) ? "Edge" : /chrome\//i.test(ua) ? "Chrome" : /firefox\//i.test(ua) ? "Firefox" : /safari\//i.test(ua) ? "Safari" : "";
  return [br, os].filter(Boolean).join(" on ") || "Unknown device";
}

// Owner dashboard: everything students and CRs sent through "Feedback"
export default function FeedbackInbox() {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState("open");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    API.get("/owner/feedback")
      .then(({ data }) => setItems(data))
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, []);

  const setStatus = async (id, status) => {
    setItems((prev) => prev.map((x) => (x._id === id ? { ...x, status } : x)));
    try {
      await API.put(`/owner/feedback/${id}`, { status });
    } catch {
      /* stays as shown; refresh corrects it */
    }
  };

  const open = items.filter((x) => x.status !== "resolved");
  const shown = filter === "open" ? open : filter === "resolved" ? items.filter((x) => x.status === "resolved") : items;

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <Segmented
          size="sm"
          value={filter}
          onChange={setFilter}
          options={[
            { value: "open", label: "Open", count: open.length },
            { value: "resolved", label: "Resolved" },
            { value: "all", label: "All", count: items.length },
          ]}
        />
      </div>

      {loading ? (
        <p className="text-sm text-zinc-500">Loading…</p>
      ) : shown.length === 0 ? (
        <p className="text-sm text-zinc-400">{filter === "open" ? "Nothing open — all caught up." : "Nothing here yet."}</p>
      ) : (
        <ul className="space-y-2">
          {shown.map((f) => {
            const K = KIND[f.kind] || KIND.Comment;
            return (
              <li key={f._id} className={`rounded-xl border p-3 sm:p-4 ${f.status === "new" ? "border-white/15 bg-ink-900" : "border-white/[0.06] bg-ink-900/60"}`}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className="flex items-center gap-1 font-bold uppercase tracking-wider" style={{ color: K.color }}>
                    <K.icon size={13} /> {K.label}
                  </span>
                  {f.status === "new" && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-bold text-black">NEW</span>}
                  {f.status === "resolved" && <span className="text-emerald-400">✓ resolved</span>}
                  <span className="ml-auto text-zinc-500">{timeAgo(f.createdAt)}</span>
                </div>
                <p className="mt-2 whitespace-pre-line text-sm text-zinc-100">{f.message}</p>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-1 text-xs text-zinc-500 sm:grid-cols-2">
                  <div>
                    <dt className="inline">From: </dt>
                    <dd className="inline text-zinc-300">
                      {f.name}
                      {f.displayName && f.displayName !== f.name ? ` ("${f.displayName}")` : ""} · {f.role === "admin" ? "CR" : "student"}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Roll / class: </dt>
                    <dd className="inline font-mono text-zinc-300">
                      {f.rollNumber} · {f.branch} {f.batch}
                    </dd>
                  </div>
                  {f.email && (
                    <div>
                      <dt className="inline">Email: </dt>
                      <dd className="inline text-zinc-300">{f.email}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="inline">Device: </dt>
                    <dd className="inline text-zinc-300">
                      {device(f.userAgent)}
                      {f.page ? ` · from ${f.page}` : ""}
                    </dd>
                  </div>
                  <div>
                    <dt className="inline">Sent: </dt>
                    <dd className="inline text-zinc-300">{new Date(f.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</dd>
                  </div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-2">
                  {f.status === "new" && (
                    <button onClick={() => setStatus(f._id, "seen")} className="btn-ghost !min-h-[32px] !px-3 !py-1 text-xs">
                      <Check size={13} /> Mark seen
                    </button>
                  )}
                  {f.status !== "resolved" ? (
                    <button onClick={() => setStatus(f._id, "resolved")} className="btn-ghost !min-h-[32px] !px-3 !py-1 text-xs">
                      <CheckCheck size={13} /> Resolved
                    </button>
                  ) : (
                    <button onClick={() => setStatus(f._id, "seen")} className="btn-ghost !min-h-[32px] !px-3 !py-1 text-xs">
                      <RotateCcw size={13} /> Reopen
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
