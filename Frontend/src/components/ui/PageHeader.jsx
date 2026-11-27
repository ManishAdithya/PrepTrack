import React from "react";
import { motion } from "framer-motion";
import { item } from "./motion.js";

// Page title block. `icon` and `gradient` are accepted for older call sites but no longer drawn:
// a bold title and one line of context is enough.
export default function PageHeader({ eyebrow, title, subtitle, actions }) {
  return (
    <motion.div variants={item} className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-accent">{eyebrow}</div>
        )}
        <h1 className="text-2xl font-bold text-white sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-zinc-400 sm:text-base">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </motion.div>
  );
}
