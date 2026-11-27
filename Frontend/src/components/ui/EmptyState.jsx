import React from "react";

export default function EmptyState({ icon: Icon, title, text, action }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-white/10 px-6 py-12 text-center">
      {Icon && (
        <div className="mb-4 grid h-14 w-14 animate-float place-items-center rounded-2xl bg-white/[0.05] text-violet-300">
          <Icon size={26} />
        </div>
      )}
      <div className="font-display text-lg font-semibold text-white">{title}</div>
      {text && <p className="mt-1 max-w-sm text-sm text-slate-400">{text}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
