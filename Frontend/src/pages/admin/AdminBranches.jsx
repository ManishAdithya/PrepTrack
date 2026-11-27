import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GitBranch, Plus, Search, Trash2, CalendarDays } from "lucide-react";
import API from "../../api";
import { useToast } from "../../components/ui/Toast.jsx";
import Card from "../../components/ui/Card.jsx";
import PageHeader from "../../components/ui/PageHeader.jsx";
import Modal from "../../components/ui/Modal.jsx";
import EmptyState from "../../components/ui/EmptyState.jsx";
import { SkeletonGrid } from "../../components/ui/Skeleton.jsx";
import { container } from "../../components/ui/motion.js";

const gradients = ["bg-white/[0.06]"];

export default function AdminBranches() {
  const toast = useToast();
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [newBranch, setNewBranch] = useState({ branchName: "", branchCode: "" });
  const [confirm, setConfirm] = useState(null);

  // Fetch branches
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const { data } = await API.get("/branch");
        setBranches(data);
      } catch (err) {
        console.error("Error fetching branches:", err);
        setError("Failed to load branches");
      } finally {
        setLoading(false);
      }
    };
    fetchBranches();
  }, []);

  const handleAddBranch = async (e) => {
    e.preventDefault();
    if (!newBranch.branchName.trim() || !newBranch.branchCode.trim()) return;
    try {
      const { data } = await API.post("/branch/add", newBranch);
      setBranches([...branches, data]);
      setNewBranch({ branchName: "", branchCode: "" });
      toast({ title: "Branch added successfully", description: `${data.branchName} (${data.branchCode})` });
    } catch (err) {
      console.error("Error adding branch:", err);
      toast({ type: "error", title: "Couldn't add branch" });
    }
  };

  const handleDelete = async (b) => {
    try {
      await API.delete(`/branch/${b._id}`);
      setBranches(branches.filter((x) => x._id !== b._id));
      toast({ type: "info", title: "Branch removed", description: b.branchName });
    } catch (err) {
      console.error("Error deleting branch:", err);
      toast({ type: "error", title: "Couldn't delete branch" });
    } finally {
      setConfirm(null);
    }
  };

  const filteredBranches = branches.filter((b) => b.branchName.toLowerCase().includes(search.toLowerCase()) || b.branchCode?.toLowerCase().includes(search.toLowerCase()));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <PageHeader icon={GitBranch} eyebrow="Structure" title="Academic Branches" subtitle="Branches decide which materials and announcements students see." />

      <Card className="p-5" spotlight={false}>
        <form onSubmit={handleAddBranch} className="grid grid-cols-1 gap-3 md:grid-cols-[1fr,180px,auto]">
          <input placeholder="Branch name, e.g. Computer Science & Engineering" value={newBranch.branchName} onChange={(e) => setNewBranch({ ...newBranch, branchName: e.target.value })} className="input" />
          <input placeholder="Code, e.g. CSE" value={newBranch.branchCode} onChange={(e) => setNewBranch({ ...newBranch, branchCode: e.target.value.toUpperCase() })} className="input font-mono uppercase" maxLength={8} />
          <button type="submit" className="btn-primary" disabled={!newBranch.branchName.trim() || !newBranch.branchCode.trim()}>
            <Plus size={16} /> Add branch
          </button>
        </form>
      </Card>

      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
        <input placeholder="Search for a branch…" value={search} onChange={(e) => setSearch(e.target.value)} className="input pl-10" />
      </div>

      {loading ? (
        <SkeletonGrid count={6} className="h-36" />
      ) : error ? (
        <EmptyState icon={GitBranch} title="Couldn't load branches" text={error} />
      ) : filteredBranches.length === 0 ? (
        <EmptyState icon={GitBranch} title="No branches found" text="Add one above to get started." />
      ) : (
        <motion.div layout className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          <AnimatePresence mode="popLayout">
            {filteredBranches.map((b, i) => (
              <motion.div
                key={b._id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                whileHover={{ y: -4 }}
                className="glass group p-5"
              >
                <div className="flex items-start justify-between">
                  <div className={`grid h-14 min-w-14 place-items-center rounded-2xl px-2 ${gradients[i % gradients.length]} font-mono text-sm font-bold text-white shadow-lg`}>
                    {b.branchCode}
                  </div>
                  <button onClick={() => setConfirm(b)} className="rounded-lg p-2 text-zinc-500 opacity-0 transition hover:bg-rose-500/10 hover:text-rose-300 group-hover:opacity-100 focus:opacity-100" aria-label={`Delete ${b.branchName}`}>
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="mt-4 font-display text-lg font-semibold text-white">{b.branchName}</div>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-zinc-500">
                  <CalendarDays size={12} /> Created {new Date(b.createdAt || b.created).toLocaleDateString()}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}

      <Modal open={!!confirm} onClose={() => setConfirm(null)} title={`Delete ${confirm?.branchName}?`} subtitle="Students in this branch keep their accounts, but the branch disappears from lists." width="max-w-md">
        <div className="flex justify-end gap-2">
          <button onClick={() => setConfirm(null)} className="btn-ghost">Cancel</button>
          <button onClick={() => handleDelete(confirm)} className="btn-danger"><Trash2 size={15} /> Delete</button>
        </div>
      </Modal>
    </motion.div>
  );
}
