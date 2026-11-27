import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, ShieldCheck, ShieldOff, KeyRound, UserMinus } from "lucide-react";
import API from "../../api";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../components/ui/Toast.jsx";
import Modal from "../../components/ui/Modal.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Avatar from "../../components/ui/Avatar.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import Skeleton from "../../components/ui/Skeleton.jsx";
import { container, item } from "../../components/ui/motion.js";

// The class list for CRs. On purpose it shows NO login activity or private student data —
// a CR can only reset a forgotten password and choose the class's CRs (max 2).
export default function AdminStudents() {
  const { user: me } = useAuth();
  const toast = useToast();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState("");
  const [confirmRole, setConfirmRole] = useState(null); // { student, role }
  const [confirmReset, setConfirmReset] = useState(null); // student
  const [tempPassword, setTempPassword] = useState(null); // { name, rollNumber, tempPassword }
  const [confirmRemove, setConfirmRemove] = useState(null); // student

  useEffect(() => {
    API.get("/users/all")
      .then(({ data }) => setStudents(data))
      .catch(() => setError("Unable to load the class list."))
      .finally(() => setLoading(false));
  }, []);

  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    return students
      .filter((s) => !q || [s.name, s.displayName, s.rollNumber].some((v) => String(v || "").toLowerCase().includes(q)))
      .sort((a, b) => String(a.rollNumber).localeCompare(String(b.rollNumber)));
  }, [students, query]);
  const crCount = students.filter((s) => s.role === "admin").length;

  const changeRole = async () => {
    const { student, role } = confirmRole;
    setConfirmRole(null);
    try {
      const { data } = await API.put(`/users/${student._id}/role`, { role });
      setStudents((prev) => prev.map((u) => (u._id === data._id ? { ...u, role: data.role } : u)));
      toast({
        title: role === "admin" ? `${data.name} is now a CR` : `${data.name} is no longer a CR`,
        description: role === "admin" ? "They need to log out and back in to see the CR portal." : undefined,
      });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't change role" });
    }
  };

  const resetPassword = async () => {
    const student = confirmReset;
    setConfirmReset(null);
    try {
      const { data } = await API.put(`/users/${student._id}/reset-password`);
      setTempPassword(data);
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't reset the password" });
    }
  };

  // remove a student from the class (their uploads and posts stay, shown as "Removed student")
  const removeStudent = async () => {
    const student = confirmRemove;
    setConfirmRemove(null);
    try {
      await API.delete(`/users/${student._id}`);
      setStudents((prev) => prev.filter((u) => u._id !== student._id));
      toast({ type: "info", title: `${student.name} was removed` });
    } catch (err) {
      toast({ type: "error", title: err.response?.data?.message || "Couldn't remove the student" });
    }
  };

  if (loading)
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-96" />
      </div>
    );
  if (error) return <EmptyState icon={Users} title="Couldn't load students" text={error} />;

  const isMe = (s) => s._id === me?.id || s.rollNumber === me?.rollNumber;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader
        title="Students"
        subtitle={`${students.length} in the class · ${crCount} of 2 CRs. Reset passwords, choose CRs or remove someone.`}
      />

      <motion.div variants={item} className="relative">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search name or roll number" className="input pl-10" />
      </motion.div>

      <Card variants={item} className="p-0">
        {list.length === 0 ? (
          <EmptyState icon={Users} title="No one matches that search" />
        ) : (
          <ul className="divide-y divide-white/[0.06]">
            {list.map((s) => (
              <li key={s._id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:px-5">
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <Avatar name={s.name} size={36} />
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-white">{s.name}</span>
                      {s.role === "admin" && (
                        <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">CR</span>
                      )}
                      {isMe(s) && <span className="text-xs text-zinc-500">(you)</span>}
                    </div>
                    <div className="text-xs text-zinc-500">
                      <span className="font-mono">{s.rollNumber}</span>
                      {s.displayName && s.displayName !== s.name && <> · shows as <span className="text-zinc-300">{s.displayName}</span></>}
                    </div>
                  </div>
                </div>

                {!isMe(s) && (
                  <div className="flex gap-2 pl-12 sm:pl-0">
                    <button onClick={() => setConfirmReset(s)} className="btn-ghost !min-h-[36px] !px-3 !py-1.5 text-xs">
                      <KeyRound size={14} /> Reset password
                    </button>
                    {s.role === "admin" ? (
                      <button onClick={() => setConfirmRole({ student: s, role: "student" })} className="btn-danger !min-h-[36px] !px-3 !py-1.5 text-xs">
                        <ShieldOff size={14} /> Remove CR
                      </button>
                    ) : (
                      <button
                        onClick={() => setConfirmRole({ student: s, role: "admin" })}
                        disabled={crCount >= 2}
                        title={crCount >= 2 ? "The class already has 2 CRs" : undefined}
                        className="btn-ghost !min-h-[36px] !px-3 !py-1.5 text-xs"
                      >
                        <ShieldCheck size={14} /> Make CR
                      </button>
                    )}
                    {s.role !== "admin" && (
                      <button onClick={() => setConfirmRemove(s)} className="btn-danger !min-h-[36px] !px-3 !py-1.5 text-xs" aria-label={`Remove ${s.name}`}>
                        <UserMinus size={14} /> Remove
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      {/* Remove a student */}
      <Modal
        open={!!confirmRemove}
        onClose={() => setConfirmRemove(null)}
        width="max-w-md"
        title={`Remove ${confirmRemove?.name} from the class?`}
        subtitle="Their account is deleted and they can't sign in any more. What they shared stays for the class, shown as 'Removed student'. This can't be undone."
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmRemove(null)} className="btn-ghost">Cancel</button>
          <button onClick={removeStudent} className="btn-danger">
            <UserMinus size={15} /> Remove
          </button>
        </div>
      </Modal>

      {/* Make / remove CR */}
      <Modal
        open={!!confirmRole}
        onClose={() => setConfirmRole(null)}
        width="max-w-md"
        title={confirmRole?.role === "admin" ? `Make ${confirmRole?.student.name} a CR?` : `Remove ${confirmRole?.student.name} as CR?`}
        subtitle={
          confirmRole?.role === "admin"
            ? "CRs approve or reject uploads, post announcements, reset passwords and choose CRs — only for this class. A class can have at most 2 CRs."
            : "They'll become a regular student again."
        }
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmRole(null)} className="btn-ghost">Cancel</button>
          <button onClick={changeRole} className={confirmRole?.role === "admin" ? "btn-primary" : "btn-danger"}>
            {confirmRole?.role === "admin" ? "Make CR" : "Remove"}
          </button>
        </div>
      </Modal>

      {/* Reset password */}
      <Modal
        open={!!confirmReset}
        onClose={() => setConfirmReset(null)}
        width="max-w-md"
        title={`Reset ${confirmReset?.name}'s password?`}
        subtitle="Their old password stops working. You'll get a temporary one to give them; they must choose a new password when they sign in."
      >
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirmReset(null)} className="btn-ghost">Cancel</button>
          <button onClick={resetPassword} className="btn-primary">
            <KeyRound size={15} /> Reset
          </button>
        </div>
      </Modal>

      <Modal open={!!tempPassword} onClose={() => setTempPassword(null)} title="Temporary password" subtitle="Shown only once. Give it only to this student." width="max-w-md">
        <div className="space-y-4">
          <div className="text-sm text-zinc-400">
            {tempPassword?.name} · <span className="font-mono">{tempPassword?.rollNumber}</span>
          </div>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-xl border border-accent/40 bg-ink-900 px-4 py-3 text-center font-mono text-2xl tracking-widest text-accent">
              {tempPassword?.tempPassword}
            </code>
            <button
              onClick={() => navigator.clipboard?.writeText(tempPassword.tempPassword).then(() => toast({ title: "Copied" }))}
              className="btn-ghost"
            >
              Copy
            </button>
          </div>
          <p className="text-xs text-zinc-500">They sign in with their roll number and this password, then pick a new one.</p>
          <div className="flex justify-end">
            <button onClick={() => setTempPassword(null)} className="btn-primary">Done</button>
          </div>
        </div>
      </Modal>
    </motion.div>
  );
}
