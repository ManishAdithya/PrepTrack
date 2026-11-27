import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { FolderOpenDot, Search, CheckCircle2, XCircle, RotateCcw, ExternalLink, Inbox, ThumbsUp, Flag, Trash2 } from "lucide-react";
import API from "../../api";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Segmented from "../../components/ui/Segmented.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container } from "../../components/ui/motion.js";
import { statusStyles, timeAgo, typeOf } from "../../utils/ui.js";

const FILTERS = ["Pending", "Reported", "Revision", "Approved", "Rejected", "All"];

export default function AdminContent() {
  const toast = useToast();
  const [materials, setMaterials] = useState([]);
  const [selected, setSelected] = useState(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [filter, setFilter] = useState("Pending");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Fetch all uploaded materials (admin)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data } = await API.get("/upload/all");
        setMaterials(data);
      } catch (err) {
        console.error("Error fetching materials:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const counts = useMemo(() => {
    const c = { All: materials.length };
    FILTERS.slice(0, -1).forEach((f) => (c[f] = materials.filter((m) => m.status === f.toLowerCase()).length));
    return c;
  }, [materials]);

  // Filter visible materials by status + search
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials
      .filter((m) => (filter === "All" ? true : m.status === filter.toLowerCase()))
      .filter((m) => !q || [m.title, m.uploadedBy, m._id, m.branch].some((v) => String(v || "").toLowerCase().includes(q)));
  }, [materials, filter, query]);

  const select = (m) => {
    setSelected(m);
    setReviewNotes(m?.reviewNotes || "");
  };

  // Remove an upload completely (any status, any time)
  const handleRemove = async () => {
    if (!selected || !window.confirm(`Remove "${selected.title}" for everyone? The file is deleted and any XP it earned is taken back.`)) return;
    setSaving(true);
    try {
      await API.delete(`/upload/${selected._id}`);
      const next = filtered.find((m) => m._id !== selected._id && m.status === selected.status);
      setMaterials((prev) => prev.filter((m) => m._id !== selected._id));
      toast({ type: "info", title: "Upload removed", description: selected.title });
      select(next || null);
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't remove it" });
    } finally {
      setSaving(false);
    }
  };

  // Handle status update (Approve/Reject/Revision)
  const handleUpdateStatus = async (status) => {
    if (!selected) return;
    setSaving(true);
    try {
      await API.put(`/upload/${selected._id}/status`, { status, reviewNotes });
      const next = filtered.find((m) => m._id !== selected._id && m.status === selected.status);
      setMaterials((prev) =>
        prev.map((m) =>
          m._id === selected._id
            ? { ...m, status, reviewNotes, ...(status === "approved" ? { approvedBy: "moderator", reports: [] } : {}) }
            : m
        )
      );
      toast({
        type: status === "approved" ? "success" : status === "rejected" ? "error" : "info",
        title: `Marked as ${statusStyles[status].label.toLowerCase()}`,
        description: selected.title,
      });
      select(next || null);
    } catch (err) {
      console.error("Error updating status:", err);
      toast({ type: "error", title: "Couldn't update status" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        icon={FolderOpenDot}
        eyebrow="Moderation"
        title="Content Review"
        subtitle="Approve study materials before they reach students."
       
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <Segmented value={filter} onChange={setFilter} size="sm" options={FILTERS.map((f) => ({ value: f, label: f, count: counts[f] }))} />
        <div className="relative flex-1 lg:max-w-sm lg:ml-auto">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="input pl-10" placeholder="Search by title, student name, or ID" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr,400px]">
        {/* Material list */}
        <Card className="p-2" spotlight={false}>
          {loading ? (
            <div className="space-y-2 p-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-16" />)}</div>
          ) : filtered.length === 0 ? (
            <EmptyState icon={Inbox} title={filter === "Pending" ? "Inbox zero! 🎉" : "Nothing here"} text={filter === "Pending" ? "No submissions are waiting for review." : "No materials match this filter."} />
          ) : (
            <div className="space-y-1">
              <AnimatePresence initial={false}>
                {filtered.map((r) => {
                  const t = typeOf(r.type);
                  const st = statusStyles[r.status];
                  const active = selected?._id === r._id;
                  return (
                    <motion.button
                      key={r._id}
                      layout
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20, height: 0 }}
                      onClick={() => select(r)}
                      className={`flex w-full items-center gap-4 rounded-2xl px-4 py-3 text-left transition ${
 active ? "border border-accent/30 bg-accent/10" : "border border-transparent hover:bg-white/[0.04]"
                      }`}
                    >
                      <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${t.gradient}`}>
                        <t.icon size={18} className="text-white" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-semibold text-white">{r.title}</div>
                        <div className="truncate text-xs text-zinc-400">
                          {r.uploadedBy || "Unknown User"} · {r.branch || "N/A"} · {timeAgo(r.createdAt || r.uploadedAt)}
                        </div>
                      </div>
                      {r.reports?.length > 0 && (
                        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-accent" title="Reports">
                          <Flag size={12} /> {r.reports.length}
                        </span>
                      )}
                      <span className="flex shrink-0 items-center gap-1 text-xs text-zinc-500" title="Upvotes">
                        <ThumbsUp size={12} /> {r.upvoteCount || 0}
                      </span>
                      {st && <span className={`chip hidden shrink-0 sm:inline-flex ${st.chip}`}>{st.label}</span>}
                    </motion.button>
                  );
                })}
              </AnimatePresence>
            </div>
          )}
        </Card>

        {/* Review panel */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="p-6" spotlight={false}>
            <AnimatePresence mode="wait">
              {selected ? (
                <motion.div key={selected._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.18 }}>
                  {(() => {
                    const t = typeOf(selected.type);
                    return (
                      <a
                        href={selected.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={`group relative grid h-44 place-items-center overflow-hidden rounded-2xl ${t.gradient}`}
                      >
                        <div className="bg-grid absolute inset-0 opacity-30" />
                        <div className="relative text-center text-white">
                          <t.icon size={40} className="mx-auto transition group-hover:scale-110" />
                          <div className="mt-2 flex items-center gap-1.5 text-sm font-semibold">
                            {selected.isLink ? "Open link" : "Open document"} <ExternalLink size={14} />
                          </div>
                        </div>
                      </a>
                    );
                  })()}

                  <div className="mt-5 font-display text-xl font-bold text-white">{selected.title}</div>
                  <div className="mt-3 flex items-center gap-3">
                    <Avatar name={selected.uploadedBy || "?"} size={32} />
                    <div className="text-sm">
                      <div className="font-medium text-zinc-200">{selected.uploadedBy || "Unknown User"}</div>
                      <div className="text-xs text-zinc-500">
                        {selected.branch} · {typeOf(selected.type).label} · {timeAgo(selected.createdAt || selected.uploadedAt)}
                      </div>
                    </div>
                    {statusStyles[selected.status] && <span className={`chip ml-auto ${statusStyles[selected.status].chip}`}>{statusStyles[selected.status].label}</span>}
                  </div>

                  <div className="mt-4 flex items-center gap-2 text-xs text-zinc-400">
                    <ThumbsUp size={13} /> {selected.upvoteCount || 0} classmates found this helpful
                  </div>

                  {selected.reports?.length > 0 && (
                    <div className="mt-4 rounded-2xl border border-accent/25 bg-accent/[0.07] p-3">
                      <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-accent">
                        <Flag size={12} /> Reported {selected.reports.length} time{selected.reports.length === 1 ? "" : "s"}
                      </div>
                      <ul className="space-y-1 text-xs text-zinc-300">
                        {selected.reports.map((rep, i) => (
                          <li key={i} className="flex justify-between gap-2">
                            <span>• {rep.reason}</span>
                            <span className="shrink-0 text-zinc-500">{timeAgo(rep.createdAt)}</span>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-[11px] text-zinc-500">Approving clears the reports and puts it back online.</p>
                    </div>
                  )}

                  <div className="mt-5">
                    <label className="label">Review notes (private)</label>
                    <textarea value={reviewNotes} onChange={(e) => setReviewNotes(e.target.value)} placeholder="Add feedback for the student…" className="input h-24 resize-none" />
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <button disabled={saving} onClick={() => handleUpdateStatus("approved")} className="btn !px-2 border border-emerald-400/30 bg-emerald-500/15 text-emerald-100 hover:bg-emerald-500/25">
                      <CheckCircle2 size={16} /> Approve
                    </button>
                    <button disabled={saving} onClick={() => handleUpdateStatus("revision")} className="btn !px-2 border border-accent/30 bg-accent/15 text-accent hover:bg-accent/25">
                      <RotateCcw size={16} /> Revise
                    </button>
                    <button disabled={saving} onClick={() => handleUpdateStatus("rejected")} className="btn !px-2 border border-rose-400/30 bg-rose-500/15 text-rose-100 hover:bg-rose-500/25">
                      <XCircle size={16} /> Reject
                    </button>
                  </div>
                  <button disabled={saving} onClick={handleRemove} className="btn-danger mt-2 w-full">
                    <Trash2 size={15} /> Remove upload
                  </button>
                </motion.div>
              ) : (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-16 text-center">
                  <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-white/[0.05] text-accent">
                    <FolderOpenDot size={26} />
                  </div>
                  <div className="mt-4 font-display font-semibold text-white">Select a submission</div>
                  <p className="mt-1 text-sm text-zinc-400">Pick an item on the left to preview and review it.</p>
                </motion.div>
              )}
            </AnimatePresence>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
