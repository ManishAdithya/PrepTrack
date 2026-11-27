import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { Search, CornerDownLeft, FileText, Presentation, FileQuestion, ArrowRight } from "lucide-react";
import API from "../api";

const typeIcon = { note: FileText, ppt: Presentation, pyq: FileQuestion };

// Ctrl/Cmd + K launcher: jump to any page, run an action, or open a study material
export default function CommandPalette({ open, setOpen, links = [], actions = [], searchMaterials = false }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [materials, setMaterials] = useState([]);
  const [active, setActive] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 30);
    if (searchMaterials && materials.length === 0) {
      API.get("/upload")
        .then((res) => setMaterials(res.data || []))
        .catch(() => {});
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    const match = (s) => !q || String(s).toLowerCase().includes(q);
    const pages = links.filter((l) => match(l.label)).map((l) => ({ ...l, group: "Pages", run: () => navigate(l.to) }));
    const acts = actions.filter((a) => match(a.label)).map((a) => ({ ...a, group: "Actions" }));
    const mats = q
      ? materials
          .filter((m) => match(m.title) || match(m.type))
          .slice(0, 6)
          .map((m) => ({
            label: m.title,
            hint: `${m.type?.toUpperCase()} · ${m.branch}`,
            icon: typeIcon[m.type] || FileText,
            group: "Study materials",
            run: () => window.open(m.fileUrl, "_blank", "noopener"),
          }))
      : [];
    return [...pages, ...acts, ...mats];
  }, [query, links, actions, materials, navigate]);

  useEffect(() => setActive(0), [query]);

  const runAt = (i) => {
    const r = results[i];
    if (!r) return;
    setOpen(false);
    r.run();
  };

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runAt(active);
    }
  };

  let lastGroup = null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[65] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <motion.div
            className="glass-strong relative w-full max-w-xl overflow-hidden !rounded-2xl"
            initial={{ opacity: 0, y: -12, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 380, damping: 30 }}
          >
            <div className="flex items-center gap-3 border-b border-white/10 px-4">
              <Search size={18} className="text-slate-400" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={searchMaterials ? "Search notes, PYQs, pages…" : "Search pages and actions…"}
                className="h-14 flex-1 bg-transparent text-base text-white placeholder:text-slate-500 outline-none"
              />
              <kbd className="rounded-md border border-white/10 bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-400">ESC</kbd>
            </div>

            <div className="max-h-[50vh] overflow-y-auto p-2">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-slate-400">No matches for “{query}”.</div>
              )}
              {results.map((r, i) => {
                const header = r.group !== lastGroup ? r.group : null;
                lastGroup = r.group;
                const Icon = r.icon || ArrowRight;
                return (
                  <React.Fragment key={`${r.group}-${r.label}-${i}`}>
                    {header && (
                      <div className="px-3 pb-1 pt-3 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
                        {header}
                      </div>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={() => runAt(i)}
                      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                        active === i ? "bg-violet-500/15 text-white" : "text-slate-300"
                      }`}
                    >
                      <span
                        className={`grid h-8 w-8 place-items-center rounded-lg ${
                          active === i ? "bg-violet-500/25 text-violet-200" : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <Icon size={16} />
                      </span>
                      <span className="flex-1 truncate">{r.label}</span>
                      {r.hint && <span className="text-xs text-slate-500">{r.hint}</span>}
                      {active === i && <CornerDownLeft size={14} className="text-slate-400" />}
                    </button>
                  </React.Fragment>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
