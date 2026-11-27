import React from "react";
import { motion } from "framer-motion";
import { item } from "./motion.js";

export default function PageHeader({
  icon: Icon,
  eyebrow,
  title,
  subtitle,
  actions,
  gradient = "from-violet-500 to-fuchsia-500",
}) {
  return (
    <motion.div
      variants={item}
      className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
    >
      <div className="flex items-start gap-4">
        {Icon && (
          <div
            className={`relative grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon size={22} className="text-white" />
            <div className={`absolute inset-0 -z-10 rounded-2xl bg-gradient-to-br ${gradient} opacity-60 blur-xl`} />
          </div>
        )}
        <div>
          {eyebrow && (
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-violet-300/80">
              {eyebrow}
            </div>
          )}
          <h1 className="text-3xl font-bold text-white sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-1.5 text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
