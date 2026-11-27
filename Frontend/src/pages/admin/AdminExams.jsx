import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { CalendarPlus, Pencil, Trash2, CalendarClock, ChevronDown } from "lucide-react";
import API from "../../api";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import Modal from "../../components/ui/Modal.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container, item } from "../../components/ui/motion.js";
import { EXAM_TYPES, examFacts, examWhen, relative, toLocalInput, typeChip } from "../../utils/exams.js";

const EMPTY = { subject: "", type: "Quiz", date: "", maxMarks: "", durationMinutes: "", venue: "", details: "" };

// CRs post the class's exam schedule here. Students see it as a countdown + upcoming list on their dashboard.
export default function AdminExams() {
  const toast = useToast();
  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [form, setForm] = useState(null); // null = closed; { ...fields, _id? }
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [showPast, setShowPast] = useState(false);

  const load = () =>
    API.get("/exams?all=1")
      .then(({ data }) => setExams(data))
      .catch(() => setError("Couldn't load the exam schedule."))
      .finally(() => setLoading(false));

  useEffect(() => {
    load();
  }, []);

  const now = Date.now();
  const upcoming = exams.filter((e) => new Date(e.date) >= now - 3 * 3600000);
  const past = exams.filter((e) => new Date(e.date) < now - 3 * 3600000).reverse();
  const subjects = useMemo(() => [...new Set(exams.map((e) => e.subject))].sort(), [exams]);

  const openNew = () => setForm({ ...EMPTY });
  const openEdit = (e) =>
    setForm({
      _id: e._id,
      subject: e.subject,
      type: e.type,
      date: toLocalInput(e.date),
      maxMarks: e.maxMarks ?? "",
      durationMinutes: e.durationMinutes ?? "",
      venue: e.venue || "",
      details: e.details || "",
    });
  const set = (k) => (ev) => setForm((f) => ({ ...f, [k]: ev.target.value }));

  const save = async (ev) => {
    ev.preventDefault();
    if (!form.date) return toast({ type: "error", title: "Pick the exam date and time" });
    setSaving(true);
    const body = { ...form, date: new Date(form.date).toISOString() };
    delete body._id;
    try {
      if (form._id) await API.put(`/exams/${form._id}`, body);
      else await API.post("/exams", body);
      toast({
        title: form._id ? "Exam updated" : "Exam posted",
        description: form._id ? undefined : "Everyone in the class gets an announcement and a countdown.",
      });
      setForm(null);
      await load();
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't save the exam" });
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    const e = confirmDelete;
    setConfirmDelete(null);
    try {
      await API.delete(`/exams/${e._id}`);
      setExams((list) => list.filter((x) => x._id !== e._id));
      toast({ type: "info", title: "Exam removed" });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't remove the exam" });
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-72" />
      </div>
    );
  if (error) return <EmptyState icon={CalendarClock} title="Exam schedule unavailable" text={error} />;

  const Row = ({ e, faded }) => (
    <li className={`flex items-start gap-3 p-4 sm:px-5 ${faded ? "opacity-60" : ""}`}>
      <div className="w-14 shrink-0 text-center leading-tight">
        <div className="font-display text-xl font-bold text-white">{new Date(e.date).getDate()}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          {new Date(e.date).toLocaleDateString("en-IN", { month: "short" })}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-semibold text-white">{e.subject}</span>
          <span className={`rounded-full border px-2 py-0.5 text-[11px] font-semibold ${typeChip(e.type)}`}>{e.type}</span>
          {!faded && <span className="text-xs text-zinc-500">{relative(e.date)}</span>}
        </div>
        <div className="mt-0.5 text-xs text-zinc-400">
          {examWhen(e.date)}
          {examFacts(e) && <> · {examFacts(e)}</>}
        </div>
        {e.details && <p className="mt-1.5 line-clamp-2 whitespace-pre-line text-xs text-zinc-500">{e.details}</p>}
      </div>
      <div className="flex shrink-0 gap-1">
        <button onClick={() => openEdit(e)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-400 hover:bg-white/5 hover:text-white" aria-label={`Edit ${e.subject}`}>
          <Pencil size={15} />
        </button>
        <button onClick={() => setConfirmDelete(e)} className="grid h-9 w-9 place-items-center rounded-lg text-zinc-500 hover:bg-rose-500/10 hover:text-rose-300" aria-label={`Delete ${e.subject}`}>
          <Trash2 size={15} />
        </button>
      </div>
    </li>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Exams"
        subtitle="Post the class's exam schedule. Students get a live countdown and the full list."
        actions={
          <button onClick={openNew} className="btn-primary w-full sm:w-auto">
            <CalendarPlus size={16} /> Add exam
          </button>
        }
      />

      <motion.section variants={item}>
        <h2 className="mb-3 font-display text-base font-bold text-white">Upcoming · {upcoming.length}</h2>
        <Card variants={null} className="p-0">
          {upcoming.length === 0 ? (
            <button onClick={openNew} className="flex w-full items-center gap-3 p-5 text-left text-sm text-zinc-400 hover:text-white">
              <CalendarPlus size={18} /> No upcoming exams — add the first one
            </button>
          ) : (
            <ul className="divide-y divide-white/[0.06]">
              {upcoming.map((e) => (
                <Row key={e._id} e={e} />
              ))}
            </ul>
          )}
        </Card>
      </motion.section>

      {past.length > 0 && (
        <motion.section variants={item}>
          <button onClick={() => setShowPast((s) => !s)} className="mb-3 flex items-center gap-1.5 font-display text-base font-bold text-zinc-400 hover:text-white">
            Past · {past.length} <ChevronDown size={16} className={`transition ${showPast ? "rotate-180" : ""}`} />
          </button>
          {showPast && (
            <Card variants={null} className="p-0">
              <ul className="divide-y divide-white/[0.06]">
                {past.map((e) => (
                  <Row key={e._id} e={e} faded />
                ))}
              </ul>
            </Card>
          )}
        </motion.section>
      )}

      {/* Add / edit */}
      <Modal
        open={!!form}
        onClose={() => setForm(null)}
        title={form?._id ? "Edit exam" : "Add an exam"}
        subtitle={form?._id ? "Changing the date notifies the class." : "The class gets an announcement and a countdown."}
      >
        {form && (
          <form onSubmit={save} className="space-y-4">
            <div>
              <label className="label" htmlFor="ex-subject">Subject</label>
              <input id="ex-subject" value={form.subject} onChange={set("subject")} list="ex-subjects" placeholder="e.g., Control Systems" className="input" required autoFocus />
              <datalist id="ex-subjects">
                {subjects.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="label">Type</label>
              <div className="flex flex-wrap gap-2">
                {EXAM_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={`rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
                      form.type === t ? "border-accent bg-accent text-black" : "border-white/10 text-zinc-300 hover:border-white/25"
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label" htmlFor="ex-date">Date and start time</label>
              <input id="ex-date" type="datetime-local" value={form.date} onChange={set("date")} className="input" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label" htmlFor="ex-marks">Marks</label>
                <input id="ex-marks" type="number" inputMode="numeric" min="1" value={form.maxMarks} onChange={set("maxMarks")} placeholder="e.g., 20" className="input" />
              </div>
              <div>
                <label className="label" htmlFor="ex-dur">Duration (min)</label>
                <input id="ex-dur" type="number" inputMode="numeric" min="1" value={form.durationMinutes} onChange={set("durationMinutes")} placeholder="e.g., 60" className="input" />
              </div>
            </div>

            <div>
              <label className="label" htmlFor="ex-venue">Venue</label>
              <input id="ex-venue" value={form.venue} onChange={set("venue")} placeholder="e.g., Room 204 / Online" className="input" maxLength={100} />
            </div>

            <div>
              <label className="label" htmlFor="ex-details">Syllabus / details</label>
              <textarea id="ex-details" value={form.details} onChange={set("details")} placeholder="Units 1–3, bring a calculator…" className="input h-24 resize-none" maxLength={1000} />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={() => setForm(null)} className="btn-ghost">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary">
                {saving ? "Saving…" : form._id ? "Save changes" : "Post exam"}
              </button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        open={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        width="max-w-md"
        title="Remove this exam?"
        subtitle={confirmDelete ? `${confirmDelete.subject} ${confirmDelete.type} · ${examWhen(confirmDelete.date)} disappears from everyone's countdown.` : ""}
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmDelete(null)} className="btn-ghost">Keep</button>
          <button onClick={remove} className="btn-danger">
            <Trash2 size={15} /> Remove
          </button>
        </div>
      </Modal>
    </motion.div>
  );
}
