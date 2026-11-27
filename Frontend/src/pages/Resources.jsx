import React, { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Upload, ArrowUpRight, Search, UploadCloud, FileCheck2, ThumbsUp, Flag, ShieldCheck, Hourglass, ChevronRight, ArrowLeft, Trash2, FolderOpen, BookOpen, Link2 } from "lucide-react";
import API from "../api";
import { useAuth } from "../context/AuthContext.jsx";
import { useGame } from "../context/GameContext.jsx";
import { useToast } from "../components/ui/Toast.jsx";
import Card from "../components/ui/Card.jsx";
import PageHeader from "../components/ui/PageHeader.jsx";
import Segmented from "../components/ui/Segmented.jsx";
import Modal from "../components/ui/Modal.jsx";
import EmptyState from "../components/ui/EmptyState.jsx";
import Skeleton from "../components/ui/Skeleton.jsx";
import { container, item } from "../components/ui/motion.js";
import { celebrate } from "../utils/confetti.js";
import { isNew, materialTypes, shortDate, typeOf } from "../utils/ui.js";
import { useRules } from "../utils/rules.js";
import { SEMESTERS, currentSemester } from "../utils/exams.js";

const XP = { note: 10, ppt: 8, pyq: 15, other: 5 };
const REPORT_REASONS = ["Wrong subject", "Unreadable / low quality", "Duplicate", "Copyrighted or paid material", "Inappropriate content"];
const SEM_KEY = "pt_notes_semester";
const UNSORTED = "unsorted";

const readSem = () => {
  try {
    return Number(localStorage.getItem(SEM_KEY)) || null;
  } catch {
    return null;
  }
};

// Study materials, filed by semester (S1–S7) → subject (subjects are added by the CR).
export default function Resources() {
  const { user } = useAuth();
  const game = useGame();
  const toast = useToast();
  const rules = useRules();
  const [params, setParams] = useSearchParams();
  const isCR = user?.role === "admin";

  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // where the student is: a semester, and optionally one subject inside it
  const [semester, setSemester] = useState(() => readSem() || currentSemester(user?.batch));
  const [subjectId, setSubjectId] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [query, setQuery] = useState("");

  // upload form
  const [showUpload, setShowUpload] = useState(params.get("upload") === "1");
  const [upSem, setUpSem] = useState(semester);
  const [upSubject, setUpSubject] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState("note");
  const [file, setFile] = useState(null);
  const [mode, setMode] = useState("file"); // "file" or "link" (big files live on Google Drive etc.)
  const [link, setLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef(null);

  const trusted = game.xp >= rules.trustedXp;
  const [reportTarget, setReportTarget] = useState(null);
  const [reportReason, setReportReason] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    Promise.all([API.get("/upload"), API.get("/subjects")])
      .then(([m, s]) => {
        setMaterials(m.data.filter((x) => x.status !== "rejected"));
        setSubjects(s.data);
      })
      .catch(() => setError("Failed to load study materials"))
      .finally(() => setLoading(false));
  }, []);

  const pickSemester = (n) => {
    setSemester(n);
    setSubjectId(null);
    setTypeFilter("all");
    try {
      localStorage.setItem(SEM_KEY, String(n));
    } catch {
      /* storage blocked */
    }
  };

  const semSubjects = subjects.filter((s) => s.semester === semester);
  const countIn = (pred) => materials.filter(pred).length;
  const unsorted = materials.filter((m) => m.semester === semester && !m.subjectId);
  const currentSubject = subjects.find((s) => s._id === subjectId);

  // the list on screen: search across everything, or one subject, or the semester's unsorted files
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? materials.filter((m) => [m.title, m.uploadedBy, m.subject].some((v) => String(v || "").toLowerCase().includes(q)))
      : subjectId === UNSORTED
      ? materials.filter((m) => m.semester === semester && !m.subjectId)
      : materials.filter((m) => m.subjectId === subjectId);
    if (typeFilter !== "all") list = list.filter((m) => m.type === typeFilter);
    return [...list].sort((a, b) => new Date(b.releaseDate) - new Date(a.releaseDate));
  }, [materials, query, subjectId, semester, typeFilter]);

  const openUpload = () => {
    setUpSem(semester);
    setUpSubject(currentSubject?._id || "");
    setShowUpload(true);
  };
  const closeUpload = () => {
    setShowUpload(false);
    if (params.get("upload")) setParams({}, { replace: true });
  };
  useEffect(() => {
    if (params.get("upload") === "1") openUpload();
  }, [loading]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!upSubject) return toast({ type: "error", title: "Pick the subject first" });
    const pasted = link.trim();
    if (mode === "file" && !file) return toast({ type: "error", title: "Pick a file first" });
    if (mode === "link" && !/^https:\/\/[^\s/]+\.[^\s/]+/i.test(pasted)) {
      return toast({ type: "error", title: "Paste the full link", description: "It should start with https://" });
    }
    setUploading(true);
    try {
      let data;
      if (mode === "link") {
        ({ data } = await API.post("/upload", { title, type, subjectId: upSubject, link: pasted }));
      } else if (rules.uploads === "blob") {
        // Hosted on Vercel: the browser uploads straight to Vercel Blob, then sends the backend the URL
        const { upload, uploadPresigned } = await import("@vercel/blob/client");
        const send = rules.blobFlow === "presigned" ? uploadPresigned : upload;
        const me = user.batch ? user : (await API.get("/auth/me")).data;
        const safeName = file.name.replace(/[^\w.-]+/g, "_");
        const blob = await send(`materials/${me.branch}-${me.batch}/${Date.now()}-${safeName}`, file, {
          access: "public",
          handleUploadUrl: `${API.defaults.baseURL}/upload/blob-token`,
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          multipart: file.size > 8 * 1024 * 1024,
        });
        ({ data } = await API.post("/upload", { title, type, subjectId: upSubject, fileUrl: blob.url }));
      } else {
        // Local development: the backend saves the file on disk
        const formData = new FormData();
        formData.append("title", title);
        formData.append("type", type);
        formData.append("subjectId", upSubject);
        formData.append("file", file);
        ({ data } = await API.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } }));
      }

      setMaterials((prev) => [data.material, ...prev]);
      setSubjects((prev) => prev.map((s) => (s._id === upSubject ? { ...s, uploads: (s.uploads || 0) + 1 } : s)));
      // show the student where it went
      pickSemester(upSem);
      setSubjectId(upSubject);
      setQuery("");
      setTitle("");
      setFile(null);
      setLink("");
      setMode("file");
      closeUpload();

      celebrate();
      if (data.autoApproved) {
        toast({ type: "reward", title: `Published! +${XP[type]} XP`, description: "You're a trusted uploader — it's live right away." });
        game.refresh();
      } else {
        toast({
          title: "Uploaded — waiting for approval",
          description: `+${XP[type]} XP once a CR approves it or ${rules.approveUpvotes} classmates mark it Helpful.`,
          duration: 5000,
        });
      }
    } catch (err) {
      toast({ type: "error", title: "Upload failed", description: err.response?.data?.message || err.message || "Please try again." });
    } finally {
      setUploading(false);
    }
  };

  const toggleUpvote = async (m) => {
    try {
      const { data } = await API.post(`/upload/${m._id}/upvote`);
      setMaterials((prev) => prev.map((x) => (x._id === m._id ? { ...x, upvoted: data.upvoted, upvoteCount: data.upvoteCount, status: data.status } : x)));
      if (data.communityApproved) toast({ type: "reward", title: "Your vote made it official!", description: `"${m.title}" is now live.` });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't record your vote" });
    }
  };

  const submitReport = async () => {
    if (!reportReason) return;
    try {
      const { data } = await API.post(`/upload/${reportTarget._id}/report`, { reason: reportReason });
      setMaterials((prev) => (data.status === "reported" ? prev.filter((x) => x._id !== reportTarget._id) : prev.map((x) => (x._id === reportTarget._id ? { ...x, reported: true } : x))));
      toast({ type: "info", title: "Thanks for reporting", description: "A CR will take a look." });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't send report" });
    } finally {
      setReportTarget(null);
      setReportReason("");
    }
  };

  // CR: remove any upload at any time
  const removeUpload = async () => {
    const m = removeTarget;
    setRemoveTarget(null);
    try {
      await API.delete(`/upload/${m._id}`);
      setMaterials((prev) => prev.filter((x) => x._id !== m._id));
      setSubjects((prev) => prev.map((s) => (s._id === m.subjectId ? { ...s, uploads: Math.max(0, (s.uploads || 1) - 1) } : s)));
      toast({ type: "info", title: "Upload removed" });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't remove it" });
    }
  };

  const pickFile = (f) => {
    if (!f) return;
    if (f.size > rules.maxUploadMb * 1024 * 1024) {
      if (fileRef.current) fileRef.current.value = "";
      setMode("link");
      if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
      return toast({
        type: "error",
        title: `This file is ${(f.size / 1024 / 1024).toFixed(1)} MB. The limit is ${rules.maxUploadMb} MB.`,
        description: "Upload it to Google Drive and paste the link here instead.",
        duration: 6000,
      });
    }
    setFile(f);
    if (!title) setTitle(f.name.replace(/\.[^.]+$/, ""));
  };

  const upSubjects = subjects.filter((s) => s.semester === upSem);
  const searching = !!query.trim();
  const inList = searching || subjectId;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <PageHeader
        title="Study Materials"
        subtitle="Notes, slides, PYQs and more — by semester and subject."
        actions={
          <button onClick={openUpload} className="btn-primary w-full sm:w-auto">
            <Upload size={16} /> Upload
          </button>
        }
      />

      {/* search everything */}
      <motion.div variants={item} className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search all semesters: title, subject or uploader" className="input pl-10" />
      </motion.div>

      {/* semester tabs */}
      {!searching && (
        <motion.div variants={item}>
          <Segmented
            value={semester}
            onChange={pickSemester}
            className="w-full sm:w-auto"
            options={SEMESTERS.map((n) => ({
              value: n,
              label: `S${n}`,
              count: countIn((m) => m.semester === n) || undefined,
            }))}
          />
        </motion.div>
      )}

      {loading ? (
        <div className="space-y-3">
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
          <Skeleton className="h-16" />
        </div>
      ) : error ? (
        <EmptyState icon={BookOpen} title="Couldn't load materials" text={error} />
      ) : !inList ? (
        // ===== subjects of the semester =====
        <motion.section variants={item} initial="hidden" animate="show">
          <h2 className="mb-3 font-display text-base font-bold text-white">S{semester} subjects</h2>
          {semSubjects.length === 0 && unsorted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-ink-800/60 p-5 text-sm text-zinc-400">
              No subjects in S{semester} yet. {isCR ? "Add them in CR portal → Subjects." : "Your CR adds the subjects — then you can upload here."}
            </div>
          ) : (
            <Card variants={null} className="divide-y divide-white/[0.06] p-0">
              {semSubjects.map((s) => {
                const n = countIn((m) => m.subjectId === s._id);
                return (
                  <button key={s._id} onClick={() => setSubjectId(s._id)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.03] sm:px-5">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] font-display text-sm font-bold text-accent">
                      {s.name.slice(0, 2).toUpperCase()}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-white">{s.name}</div>
                      <div className="text-xs text-zinc-500">
                        {s.code ? `${s.code} · ` : ""}
                        {n} file{n === 1 ? "" : "s"}
                      </div>
                    </div>
                    <ChevronRight size={18} className="shrink-0 text-zinc-600" />
                  </button>
                );
              })}
              {unsorted.length > 0 && (
                <button onClick={() => setSubjectId(UNSORTED)} className="flex w-full items-center gap-3 p-4 text-left transition hover:bg-white/[0.03] sm:px-5">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/[0.05] text-zinc-400">
                    <FolderOpen size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-white">Unsorted</div>
                    <div className="text-xs text-zinc-500">{unsorted.length} file{unsorted.length === 1 ? "" : "s"} from removed subjects</div>
                  </div>
                  <ChevronRight size={18} className="shrink-0 text-zinc-600" />
                </button>
              )}
            </Card>
          )}
        </motion.section>
      ) : (
        // ===== files of one subject (or search results) =====
        <motion.section variants={item} initial="hidden" animate="show" className="space-y-3">
          {!searching && (
            <div className="flex items-center gap-2">
              <button onClick={() => setSubjectId(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white" aria-label="Back to subjects">
                <ArrowLeft size={18} />
              </button>
              <div className="min-w-0">
                <div className="text-xs text-zinc-500">S{semester}</div>
                <h2 className="truncate font-display text-lg font-bold text-white">{subjectId === UNSORTED ? "Unsorted" : currentSubject?.name}</h2>
              </div>
            </div>
          )}

          <Segmented
            size="sm"
            value={typeFilter}
            onChange={setTypeFilter}
            options={[{ value: "all", label: "All" }, ...Object.entries(materialTypes).map(([value, t]) => ({ value, label: t.label }))]}
          />

          {visible.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/15 bg-ink-800/60 p-5 text-sm text-zinc-400">
              {searching ? "Nothing matches that search." : "Nothing here yet — be the first to upload for this subject."}
              {!searching && subjectId !== UNSORTED && (
                <button onClick={openUpload} className="btn-primary mt-3 w-full sm:w-auto">
                  <Upload size={16} /> Upload to {currentSubject?.name}
                </button>
              )}
            </div>
          ) : (
            <Card variants={null} className="p-0">
              <ul className="divide-y divide-white/[0.06]">
                {visible.map((m) => {
                  const t = typeOf(m.type);
                  const mine = String(m.uploaderId) === String(user?.id) || m.uploadedBy === user?.name;
                  const toGo = Math.max(0, rules.approveUpvotes - (m.upvoteCount || 0));
                  return (
                    <li key={m._id} className="p-4 sm:px-5">
                      <div className="flex gap-3">
                        <t.icon size={18} className="mt-0.5 shrink-0 text-zinc-500" />
                        <div className="min-w-0 flex-1">
                          <a href={m.fileUrl} target="_blank" rel="noopener noreferrer" className="line-clamp-2 text-[15px] font-semibold leading-snug text-white hover:text-accent">
                            {m.title}
                          </a>
                          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 text-xs text-zinc-500">
                            <span>{t.label}</span>
                            {m.isLink && (
                              <span className="inline-flex items-center gap-0.5 rounded bg-white/[0.06] px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                                <Link2 size={10} /> Link
                              </span>
                            )}
                            ·<span className="truncate">{m.uploadedBy || "Anonymous"}</span>·<span>{shortDate(m.releaseDate)}</span>
                            {searching && m.semester && (
                              <>
                                · <span className="text-zinc-400">S{m.semester} {m.subject}</span>
                              </>
                            )}
                            {isNew(m.releaseDate) && <span className="font-bold text-accent">NEW</span>}
                          </div>
                          {m.status === "pending" && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-zinc-400">
                              <Hourglass size={11} /> Pending · {toGo} more Helpful vote{toGo === 1 ? "" : "s"} to go live
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
                              <span className="font-normal">{m.upvoted ? "Helpful ✓" : "Helpful"}</span>
                            </button>
                            {!isCR && (
                              <button
                                onClick={() => !m.reported && setReportTarget(m)}
                                disabled={m.reported}
                                className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs text-zinc-500 transition hover:text-rose-300 disabled:pointer-events-none"
                              >
                                <Flag size={12} /> {m.reported ? "Reported" : "Report"}
                              </button>
                            )}
                          </>
                        )}
                        {isCR && (
                          <button onClick={() => setRemoveTarget(m)} className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-xs text-rose-300 transition hover:bg-rose-500/10">
                            <Trash2 size={13} /> Remove
                          </button>
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
        </motion.section>
      )}

      {/* ===== Upload ===== */}
      <Modal open={showUpload} onClose={closeUpload} title="Upload a file" subtitle="Pick where it belongs, then add the file.">
        <form onSubmit={handleUpload} className="space-y-4">
          <div>
            <label className="label">Semester</label>
            <Segmented
              size="sm"
              value={upSem}
              onChange={(n) => {
                setUpSem(n);
                setUpSubject("");
              }}
              options={SEMESTERS.map((n) => ({ value: n, label: `S${n}` }))}
            />
          </div>

          <div>
            <label className="label" htmlFor="up-subject">Subject</label>
            {upSubjects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-white/15 p-3 text-sm text-zinc-400">
                No subjects in S{upSem} yet. {isCR ? "Add them in CR portal → Subjects." : "Ask your CR to add them."}
              </p>
            ) : (
              <select id="up-subject" value={upSubject} onChange={(e) => setUpSubject(e.target.value)} className="input" required>
                <option value="">Choose a subject…</option>
                {upSubjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                    {s.code ? ` (${s.code})` : ""}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="label">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {Object.entries(materialTypes).map(([value, t]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setType(value)}
                  className={`rounded-xl border px-2 py-2.5 text-center transition ${type === value ? "border-accent bg-accent text-black" : "border-white/10 text-zinc-300 hover:border-white/25"}`}
                >
                  <t.icon size={16} className="mx-auto" />
                  <div className="mt-1 text-xs font-semibold">{t.label}</div>
                  <div className={`text-[10px] ${type === value ? "text-black/70" : "text-zinc-500"}`}>+{XP[value]} XP</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl border border-white/10 p-1" role="tablist" aria-label="Upload a file or a link">
            {[
              ["file", UploadCloud, "File"],
              ["link", Link2, "Link"],
            ].map(([value, Icon, label]) => (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={mode === value}
                onClick={() => setMode(value)}
                className={`flex items-center justify-center gap-2 rounded-lg py-2 text-sm font-semibold transition ${mode === value ? "bg-white/10 text-white" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>

          {mode === "link" ? (
            <div className="space-y-2">
              <label className="label" htmlFor="up-link">Link</label>
              <input
                id="up-link"
                type="url"
                inputMode="url"
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://drive.google.com/…"
                className="input"
                autoComplete="off"
              />
              <p className="text-xs leading-relaxed text-zinc-500">
                For files over {rules.maxUploadMb} MB. Put it on Google Drive or OneDrive and set sharing to{" "}
                <span className="font-semibold text-zinc-300">Anyone with the link can view</span>, or classmates will see "Request access".
              </p>
            </div>
          ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              pickFile(e.dataTransfer.files?.[0]);
            }}
            onClick={() => fileRef.current?.click()}
            className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-4 py-6 text-center transition ${
              dragging ? "border-accent bg-accent/10" : file ? "border-emerald-400/40 bg-emerald-400/5" : "border-white/15 hover:border-white/30"
            }`}
          >
            {file ? (
              <>
                <FileCheck2 size={26} className="text-emerald-300" />
                <div className="mt-2 max-w-full truncate text-sm font-semibold text-white">{file.name}</div>
                <div className="text-xs text-zinc-400">{(file.size / 1024 / 1024).toFixed(2)} MB · tap to change</div>
              </>
            ) : (
              <>
                <UploadCloud size={26} className="text-zinc-400" />
                <div className="mt-2 text-sm font-semibold text-white">Tap to choose a file</div>
                <div className="text-xs text-zinc-500">PDF, PPT, Word or images · up to {rules.maxUploadMb} MB</div>
              </>
            )}
            <input ref={fileRef} type="file" className="hidden" accept=".pdf,.ppt,.pptx,.doc,.docx,.txt,image/*" onChange={(e) => pickFile(e.target.files[0])} />
          </div>
          )}

          <div>
            <label className="label" htmlFor="up-title">Title</label>
            <input id="up-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Unit 3 – Root locus" className="input" required />
          </div>

          <div className={`flex items-start gap-2 rounded-xl border px-3 py-2.5 text-xs ${trusted ? "border-emerald-400/25 bg-emerald-400/[0.07] text-emerald-100" : "border-white/10 bg-white/[0.03] text-zinc-400"}`}>
            <ShieldCheck size={14} className="mt-0.5 shrink-0" />
            {trusted ? (
              <span>You're a trusted uploader — it goes live right away.</span>
            ) : (
              <span>
                It goes live once a CR approves it or {rules.approveUpvotes} classmates mark it Helpful. At {rules.trustedXp} XP your uploads go live instantly.
              </span>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button type="button" onClick={closeUpload} className="btn-ghost">Cancel</button>
            <button type="submit" disabled={uploading || !upSubject} className="btn-primary min-w-28">
              {uploading ? "Uploading…" : (<><Upload size={16} /> Upload</>)}
            </button>
          </div>
        </form>
      </Modal>

      {/* ===== Report ===== */}
      <Modal open={!!reportTarget} onClose={() => setReportTarget(null)} title="Report this file" subtitle={`After ${rules.hideReports} reports it's hidden until a CR reviews it.`} width="max-w-md">
        <div className="mb-4 truncate rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">{reportTarget?.title}</div>
        <div className="space-y-2">
          {REPORT_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReportReason(r)}
              className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition ${
                reportReason === r ? "border-rose-400/40 bg-rose-500/10 text-white" : "border-white/10 text-zinc-300 hover:bg-white/[0.04]"
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

      {/* ===== CR: remove ===== */}
      <Modal open={!!removeTarget} onClose={() => setRemoveTarget(null)} title="Remove this upload?" subtitle="It disappears for everyone and the file is deleted. Any XP it earned is taken back." width="max-w-md">
        <div className="mb-4 truncate rounded-xl bg-white/[0.04] px-3 py-2 text-sm text-zinc-300">{removeTarget?.title}</div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setRemoveTarget(null)} className="btn-ghost">Keep</button>
          <button onClick={removeUpload} className="btn-danger">
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
