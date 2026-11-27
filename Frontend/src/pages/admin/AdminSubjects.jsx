import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Plus, Pencil, Trash2, Check, X, BookOpen } from "lucide-react";
import API from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Segmented from "../../components/ui/Segmented.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container, item } from "../../components/ui/motion.js";
import { SEMESTERS, currentSemester } from "../../utils/exams.js";

// CRs set up the subjects of each semester (S1–S7). Students file their uploads under these.
export default function AdminSubjects() {
  const { user } = useAuth();
  const toast = useToast();
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [semester, setSemester] = useState(currentSemester(user?.batch));

  // add form (inline)
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [adding, setAdding] = useState(false);

  // rename (inline) + remove (confirm)
  const [editId, setEditId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editCode, setEditCode] = useState("");
  const [removeTarget, setRemoveTarget] = useState(null);

  useEffect(() => {
    API.get("/subjects")
      .then(({ data }) => setSubjects(data))
      .catch(() => setError("Couldn't load subjects."))
      .finally(() => setLoading(false));
  }, []);

  const list = subjects.filter((s) => s.semester === semester).sort((a, b) => a.name.localeCompare(b.name));
  const countFor = (n) => subjects.filter((s) => s.semester === n).length;

  const add = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setAdding(true);
    try {
      const { data } = await API.post("/subjects", { name, code, semester });
      setSubjects((prev) => [...prev, data]);
      setName("");
      setCode("");
      toast({ title: `Added to S${semester}`, description: data.name });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't add the subject" });
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async (s) => {
    try {
      const { data } = await API.put(`/subjects/${s._id}`, { name: editName, code: editCode });
      setSubjects((prev) => prev.map((x) => (x._id === s._id ? { ...x, ...data } : x)));
      setEditId(null);
      toast({ title: "Subject renamed" });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't rename it" });
    }
  };

  const remove = async () => {
    const s = removeTarget;
    setRemoveTarget(null);
    try {
      const { data } = await API.delete(`/subjects/${s._id}${s.uploads ? "?force=1" : ""}`);
      setSubjects((prev) => prev.filter((x) => x._id !== s._id));
      toast({
        type: "info",
        title: `${s.name} removed`,
        description: data.movedUploads ? `${data.movedUploads} file(s) moved to "Unsorted" in S${s.semester}.` : undefined,
      });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't remove it" });
    }
  };

  if (loading)
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-64" />
      </div>
    );
  if (error) return <EmptyState icon={BookOpen} title="Subjects unavailable" text={error} />;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      <PageHeader title="Subjects" subtitle="Add each semester's subjects. Students file their notes, slides and PYQs under them." />

      <motion.div variants={item}>
        <Segmented
          value={semester}
          onChange={(n) => {
            setSemester(n);
            setEditId(null);
          }}
          className="w-full sm:w-auto"
          options={SEMESTERS.map((n) => ({ value: n, label: `S${n}`, count: countFor(n) || undefined }))}
        />
      </motion.div>

      {/* add */}
      <motion.form variants={item} onSubmit={add} className="flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-ink-800 p-4 sm:flex-row">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder={`New S${semester} subject, e.g. Control Systems`} className="input flex-1" maxLength={80} aria-label="Subject name" />
        <input value={code} onChange={(e) => setCode(e.target.value)} placeholder="Code (optional)" className="input sm:w-40" maxLength={20} aria-label="Course code" />
        <button type="submit" disabled={adding || !name.trim()} className="btn-primary">
          <Plus size={16} /> Add
        </button>
      </motion.form>

      <motion.section variants={item}>
        <h2 className="mb-3 font-display text-base font-bold text-white">
          S{semester} · {list.length} subject{list.length === 1 ? "" : "s"}
        </h2>
        <Card variants={null} className="p-0">
          {list.length === 0 ? (
            <p className="p-5 text-sm text-zinc-400">No subjects in S{semester} yet — add the first one above.</p>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {list.map((s) => (
                <li key={s._id} className="flex items-center gap-3 p-4 sm:px-5">
                  {editId === s._id ? (
                    <>
                      <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row">
                        <input value={editName} onChange={(e) => setEditName(e.target.value)} className="input !py-2 flex-1" aria-label="Subject name" autoFocus />
                        <input value={editCode} onChange={(e) => setEditCode(e.target.value)} className="input !py-2 sm:w-36" placeholder="Code" aria-label="Course code" />
                      </div>
                      <button onClick={() => saveEdit(s)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white text-black" aria-label="Save">
                        <Check size={16} />
                      </button>
                      <button onClick={() => setEditId(null)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/10 text-zinc-300" aria-label="Cancel">
                        <X size={16} />
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-semibold text-white">{s.name}</div>
                        <div className="text-xs text-zinc-500">
                          {s.code ? `${s.code} · ` : ""}
                          {s.uploads || 0} file{s.uploads === 1 ? "" : "s"}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditId(s._id);
                          setEditName(s.name);
                          setEditCode(s.code || "");
                        }}
                        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white"
                        aria-label={`Rename ${s.name}`}
                      >
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => setRemoveTarget(s)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300" aria-label={`Remove ${s.name}`}>
                        <Trash2 size={15} />
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
      </motion.section>

      <Modal
        open={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        width="max-w-md"
        title={`Remove ${removeTarget?.name}?`}
        subtitle={
          removeTarget?.uploads
            ? `It has ${removeTarget.uploads} file(s). They won't be deleted — they move to "Unsorted" in S${removeTarget.semester}.`
            : "Students won't be able to upload to it any more."
        }
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setRemoveTarget(null)} className="btn-ghost">Keep</button>
          <button onClick={remove} className="btn-danger">
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
