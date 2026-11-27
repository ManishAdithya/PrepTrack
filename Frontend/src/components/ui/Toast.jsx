import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, AlertTriangle, Info, Sparkles, X } from "lucide-react";

const ToastCtx = createContext(() => {});

const styles = {
  success: { icon: CheckCircle2, ring: "border-emerald-400/30", text: "text-emerald-300", bar: "bg-emerald-400" },
  error: { icon: AlertTriangle, ring: "border-rose-400/30", text: "text-rose-300", bar: "bg-rose-400" },
  info: { icon: Info, ring: "border-cyan-400/30", text: "text-cyan-300", bar: "bg-cyan-400" },
  reward: { icon: Sparkles, ring: "border-amber-300/40", text: "text-amber-300", bar: "bg-amber-300" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((t) => t.filter((x) => x.id !== id)), []);

  const toast = useCallback(
    ({ title, description = "", type = "success", duration = 3500 }) => {
      const id = Math.random().toString(36).slice(2);
      setToasts((t) => [...t.slice(-3), { id, title, description, type, duration }]);
      setTimeout(() => dismiss(id), duration);
    },
    [dismiss]
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed bottom-24 right-4 z-[70] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-2 md:bottom-6 md:right-6">
        <AnimatePresence initial={false}>
          {toasts.map((t) => {
            const s = styles[t.type] || styles.info;
            const Icon = s.icon;
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, x: 60, scale: 0.95 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                exit={{ opacity: 0, x: 60, scale: 0.95 }}
                transition={{ type: "spring", stiffness: 380, damping: 30 }}
                className={`glass-strong pointer-events-auto overflow-hidden !rounded-2xl border ${s.ring} p-4`}
              >
                <div className="flex items-start gap-3">
                  <Icon size={20} className={`${s.text} mt-0.5 shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-white">{t.title}</div>
                    {t.description && <div className="mt-0.5 text-sm text-slate-400">{t.description}</div>}
                  </div>
                  <button
                    onClick={() => dismiss(t.id)}
                    className="text-slate-500 transition hover:text-white"
                    aria-label="Dismiss"
                  >
                    <X size={16} />
                  </button>
                </div>
                <motion.div
                  className={`absolute bottom-0 left-0 h-0.5 ${s.bar}`}
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: t.duration / 1000, ease: "linear" }}
                />
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastCtx.Provider>
  );
}

export function useToast() {
  return useContext(ToastCtx);
}
