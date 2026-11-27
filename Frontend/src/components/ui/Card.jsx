import React, { useRef } from "react";
import { motion } from "framer-motion";
import { item } from "./motion.js";

// Glass card with a soft glow that follows the cursor.
// Pass variants={null} when the card sits inside a wrapper that runs its own animation.
export default function Card({
  className = "",
  glow = "rgba(139,92,246,0.14)",
  spotlight = true,
  variants = item,
  children,
  ...rest
}) {
  const ref = useRef(null);

  const onMove = (e) => {
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty("--mx", `${e.clientX - r.left}px`);
    el.style.setProperty("--my", `${e.clientY - r.top}px`);
  };

  return (
    <motion.div
      ref={ref}
      variants={variants || undefined}
      onMouseMove={spotlight ? onMove : undefined}
      className={`glass group isolate overflow-hidden ${className}`}
      {...rest}
    >
      {spotlight && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 -z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
          style={{
            background: `radial-gradient(420px circle at var(--mx, 50%) var(--my, 50%), ${glow}, transparent 45%)`,
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
