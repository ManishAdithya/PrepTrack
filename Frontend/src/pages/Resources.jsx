import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Upload, ArrowUpRight, BookOpen, Search, UploadCloud, CalendarClock, Sparkles, FileCheck2, Layers, ThumbsUp, Flag, ShieldCheck, Hourglass } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Modal from "../components/ui/Modal.jsx";
import Avatar from "../components/ui/Avatar.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import { SkeletonGrid } from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { celebrate } from "../utils/confetti.js";
import { isNew, materialTypes, shortDate, typeOf } from "../utils/ui.js";
import { useRules } from "../utils/rules.js";

const XP = { note: 10, ppt: 8, pyq: 15 };
const REPORT_REASONS = ["Wrong subject or branch", "Unreadable / low quality", "Duplicate", "Copyrighted or paid material", "Inappropriate content"];

export default function Resources() {
  const { user } = useAuth();
  const game = useGame();
  const toast = useToast();
  const [params, setParams] = useSearchParams();

  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("new");

  // Upload form states
  const [showUpload, setShowUpload] = useState(params.get("upload") === "1");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("note");
  const [file, setFile] = useState(null);
  const [examDate, setExamDate] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  // Community moderation
  const rules = useRules();
  const trusted = game.xp >= rules.trustedXp;
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");

  // Fetch materials (filtered by branch + release date)
  useEffect(() => {
    const fetchMaterials = async () => {
      try {
        const { data } = await API.get("/upload"); // backend already filters by branch
        setMaterials(data.filter((m) => m.status !== "rejected")); // ❌ hide rejected
      } catch (err) {
        console.error("Error fetching resources:", err);
        setError("Failed to load resources");
      } finally {
        setLoading(false);
      }
    };
    fetchMaterials();
  }, []);

  const closeUpload = () => {
    setShowUpload(false);
    if (params.get("upload")) setParams({}, { replace: true });
  };

  // Handle file upload
  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      toast({ type: "error", title: "Pick a file first", description: "Drop a PDF or PPT into the box." });
      return;
    }

    setUploading(true);
    try {
      let data;
      if (rules.uploads === "blob") {
        // Hosted on Vercel: the browser uploads the file straight to Vercel Blob,
        // then sends the backend just its URL (so large PDFs work)
        const { upload, uploadPresigned } = await import("@vercel/blob/client");
        const send = rules.blobFlow === "presigned" ? uploadPresigned : upload;
        const me = user.batch ? user : (await API.get("/auth/me")).data;
        const safeName = file.name.replace(/[^\w.-]+/g, "_");
        // a timestamp keeps names unique, since uploads never overwrite each other
        const blob = await send(`materials/${me.branch}-${me.batch}/${Date.now()}-${safeName}`, file, {
          access: "public",
          handleUploadUrl: `${API.defaults.baseURL}/upload/blob-token`,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          multipart: file.size > 8 * 1024 * 1024,
        });
        ({ data } = await API.post("/upload", { title, type, examDate: examDate || undefined, fileUrl: blob.url }));
      } else {
        // Local development: send the file to the backend, which saves it on disk
        const formData = new FormData();
        formData.append("title", title);
        formData.append("type", type);
        if (examDate) formData.append("examDate", examDate);
        formData.append("file", file);
        ({ data } = await API.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        }));
      }

      // Add only if not rejected
      if (data.material.status !== "rejected") {
        setMaterials((prev) => [data.material, ...prev]);
      }

      setTitle("");
      setType("note");
      setExamDate("");
      setFile(null);
      closeUpload();

      celebrate();
      if (data.autoApproved) {
        toast({ type: "reward", title: `Published! +${XP[type]} XP`, description: "Trusted uploader — it's live for your batch right away." });
        game.refresh();
      } else {
        toast({
          type: "success",
          title: "Uploaded — pending approval",
          description: `You'll get +${XP[type]} XP once a moderator approves it or ${rules.approveUpvotes} classmates upvote it.`,
          duration: 5000,
        });
      }
    } catch (err) {
      console.error("Upload failed:", err);
      toast({ type: "error", title: "Upload failed", description: err.response?.data?.message || err.message || "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const toggleUpvote = async (m) => {
    try {
      const { data } = await API.post(`/upload/${m._id}/upvote`);
      setMaterials((prev) =>
        prev.map((x) => (x._id === m._id ? { ...x, upvoted: data.upvoted, upvoteCount: data.upvoteCount, status: data.status, approvedBy: data.communityApproved ? "community" : x.approvedBy } : x))
      );
      if (data.communityApproved) {
        celebrate({ particleCount: 60 });
        toast({ type: "reward", title: "Your vote made it official!", description: `"${m.title}" is now approved by classmates.` });
      }
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't record your vote" });
    }
  };

  const submitReport = async () => {
    if (!reportReason) return;
    try {
      const { data } = await API.post(`/upload/${reportTarget._id}/report`, { reason: reportReason });
      setMaterials((prev) =>
        data.status === "reported"
          ? prev.filter((x) => x._id !== reportTarget._id)
          : prev.map((x) => (x._id === reportTarget._id ? { ...x, reported: true } : x))
      );
      toast({ type: "info", title: "Thanks for reporting", description: "Moderators will take a look." });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't send report" });
    } finally {
      setReportTarget(null);
      setReportReason("");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) {
      setFile(f);
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
    }
  };

  const counts = useMemo(() => {
    const c = { all: materials.length, note: 0, ppt: 0, pyq: 0 };
    materials.forEach((m) => {
      if (c[m.type] != null) c[m.type]++;
    });
    return c;
  }, [materials]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return materials
      .filter((m) => filter === "all" || m.type === filter)
      .filter((m) => !q || m.title?.toLowerCase().includes(q) || m.uploadedBy?.toLowerCase().includes(q))
      .sort((a, b) =>
        sort === "az" ? a.title.localeCompare(b.title) : new Date(b.releaseDate) - new Date(a.releaseDate)
      );
  }, [materials, filter, query, sort]);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Study Materials"
        subtitle="Notes, slides and PYQs shared by your class."
        actions={
          <button onClick={() => setShowUpload(true)} className="btn-primary w-full sm:w-auto">
            <Upload size={16} /> Upload
          </button>
        }
      />

      {/* Controls */}
      <motion.div variants={item} className="space-y-3 lg:flex lg:items-center lg:gap-3 lg:space-y-0">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or uploader" className="input pl-10" />
        </div>
        <div className="flex items-center justify-between gap-2">
          <Segmented
            value={filter}
            onChange={setFilter}
            size="sm"
            className="min-w-0"
            options={[
              { value: "all", label: "All", count: counts.all },
              ...Object.entries(materialTypes).map(([value, t]) => ({ value, label: t.label, count: counts[value] })),
            ]}
          />
          <Segmented value={sort} onChange={setSort} size="sm" className="shrink-0" options={[{ value: "new", label: "New" }, { value: "az", label: "A–Z" }]} />
        </div>
      </motion.div>

      {/* Materials */}
      {loading ? (
        <SkeletonGrid count={4} className="h-20" />
      ) : error ? (
        <EmptyState icon={BookOpen} title="Couldn't load materials" text={error} />
      ) : visible.length === 0 ? (
        <EmptyState
          icon={BookOpen}
          title={materials.length ? "Nothing matches that search" : "No resources available yet"}
          text={materials.length ? "Try a different keyword or filter." : "Be the first to share notes with your batch — and earn XP for it."}
          action={
            <button onClick={() => setShowUpload(true)} className="btn-primary">
              <Upload size={16} /> Upload material
            </button>
          }
        />
      ) : (
        <Card variants={null} className="p-0">
          <ul className="divide-y divide-white/[0.06]">
            {visible.map((m) => {
              const t = typeOf(m.type);
              const mine = m.uploadedBy === user?.name;
              const toGo = Math.max(0, rules.approveUpvotes - (m.upvoteCount || 0));
              return (
                <li key={m._id} className="p-4 sm:px-5">
                  <div className="flex gap-3">
                    <t.icon size={18} className="mt-0.5 shrink-0 text-zinc-500" />
                    <div className="min-w-0 flex-1">
                      <a
                        href={m.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="line-clamp-2 text-[15px] font-semibold leading-snug text-white hover:text-accent"
                      >
                        {m.title}
                      </a>
                      <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
                        <span>{t.label}</span>·<span className="truncate">{m.uploadedBy || "Anonymous"}</span>·
                        <span>{shortDate(m.releaseDate)}</span>
                        {isNew(m.releaseDate) && <span className="font-bold text-accent">NEW</span>}
                      </div>
                      {m.status === "pending" && (
                        <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                          <Hourglass size={11} /> Pending · {toGo} more upvote{toGo === 1 ? "" : "s"} to go live
                        </div>
                      )}
                      {m.status === "revision" && <div className="mt-1 text-xs text-rose-300">Needs revision</div>}
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-1 pl-[30px]">
                    {mine ? (
                      <span className="flex items-center gap-1.5 text-xs text-zinc-500">
                        <ThumbsUp size={13} /> {m.upvoteCount || 0} · your upload
                      </span>
                    ) : (
                      <>
                        <button
                          onClick={() => toggleUpvote(m)}
                          className={`flex h-9 items-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold transition ${
                            m.upvoted ? "bg-accent text-black" : "border border-white/10 text-zinc-300 hover:border-white/25"
                          }`}
                          aria-pressed={!!m.upvoted}
                        >
                          <ThumbsUp size={14} /> {m.upvoteCount || 0}
                          <span className="font-normal">{m.upvoted ? "Upvoted" : "Helpful"}</span>
                        </button>
                        <button
                          onClick={() => !m.reported && setReportTarget(m)}
                          disabled={m.reported}
                          className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs text-zinc-500 transition hover:text-rose-300 disabled:pointer-events-none"
                        >
                          <Flag size={12} /> {m.reported ? "Reported" : "Report"}
                        </button>
                      </>
                    )}
                    <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-ghost ml-auto !min-h-[36px] !px-3 !py-1.5 text-xs">
                      Open <ArrowUpRight size={14} />
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
        </Card>
      )}

      {/* Upload modal */}
      <Modal open={showUpload} onClose={closeUpload} title="Share a study material" subtitle="Every approved upload helps your batch and earns you XP.">
        <form onSubmit={handleUpload} className="space-y-5">
          <div
            className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${
 trusted ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-100" : "border-white/10 bg-white/[0.03] text-zinc-300"
            }`}
          >
            <ShieldCheck size={14} className={`mt-0.5 shrink-0 ${trusted ? "text-emerald-300" : "text-zinc-400"}`} />
            {trusted ? (
              <span>You're a <b>trusted uploader</b> — your uploads go live instantly and earn XP right away.</span>
            ) : (
              <span>
                Your upload goes live once a moderator approves it or <b>{rules.approveUpvotes} classmates</b> upvote it. Reach{" "}
                <b>{rules.trustedXp} XP</b> to publish instantly ({Math.max(0, rules.trustedXp - game.xp)} XP to go).
              </span>
            )}
          </div>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-8 text-center transition ${
 dragging
 ? "scale-[1.01] border-accent bg-accent/10"
                : file
                ? "border-emerald-400/40 bg-emerald-400/5"
                : "border-white/15 hover:border-accent/50 hover:bg-white/[0.03]"
            }`}
          >
            {file ? (
              <>
                <FileCheck2 size={30} className="text-emerald-300" />
                <div className="mt-2 max-w-full truncate font-semibold text-white">{file.name}</div>
                <div className="text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB · click to change</div>
              </>
            ) : (
              <>
                <UploadCloud size={30} className={dragging ? "text-accent" : "text-zinc-400"} />
                <div className="mt-2 font-semibold text-white">Drop your file here</div>
                <div className="text-xs text-zinc-400">or click to browse · PDF, PPT, images</div>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files[0];
                setFile(f);
                if (f && !title) setTitle(f.name.replace(/\.[^.]+$/, ""));
              }}
            />
          </div>

          <div>
            <label className="label">Title</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., OS Unit 3 – Memory Management" className="input" required />
          </div>

          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(materialTypes).map(([value, t]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-2xl border p-3 text-left transition ${
 type === value ? "border-accent/60 bg-accent/15 shadow-glow" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"
                  }`}
                >
                  <div className={`grid h-8 w-8 place-items-center rounded-lg ${t.gradient}`}>
                    <t.icon size={16} className="text-white" />
                  </div>
                  <div className="mt-2 text-sm font-semibold text-white">{t.label}</div>
                  <div className="flex items-center gap-1 text-[11px] font-semibold text-accent">
                    <Sparkles size={10} /> +{XP[value]} XP
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="label">Exam date (optional)</label>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input" />
            <p className="mt-2 flex items-start gap-1.5 text-xs text-zinc-400">
              <CalendarClock size={13} className="mt-0.5 shrink-0" />
              {type === "pyq" ? "PYQs unlock for students 2 days before the exam." : "Notes and slides unlock 7 days before the exam."} Leave empty to release now.
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={closeUpload} className="btn-ghost">
              Cancel
            </button>
            <button type="submit" disabled={uploading} className="btn-primary min-w-32">
              {uploading ? "Uploading…" : (<><Upload size={16} /> Upload</>)}
            </button>
          </div>
        </form>
      </Modal>

      {/* Report modal */}
      <Modal
        open={!!reportTarget}
        onClose={() => setReportTarget(null)}
        title="Report this material"
        subtitle={`After ${rules.hideReports} reports it's hidden until a moderator reviews it.`}
        width="max-w-md"
      >
        <div className="mb-4 truncate rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">{reportTarget?.title}</div>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReportReason(r)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
 reportReason === r ? "border-rose-400/40 bg-rose-500/10 text-white" : "border-white/10 bg-white/[0.03] text-zinc-300 hover:bg-white/[0.06]"
              }`}
            >
              <span className={`h-3.5 w-3.5 rounded-full border-2 ${reportReason === r ? "border-rose-300 bg-rose-400" : "border-zinc-500"}`} />
              {r}
            </button>
          ))}
        </div>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={() => setReportTarget(null)} className="btn-ghost">Cancel</button>
          <button onClick={submitReport} disabled={!reportReason} className="btn-danger">
            <Flag size={15} /> Send report
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
