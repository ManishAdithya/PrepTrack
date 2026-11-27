import React, { useId } from "react";
import { motion } from "framer-motion";
import AnimatedNumber from "./AnimatedNumber.jsx";

export default function ProgressRing({
  value = 0,
  size = 180,
  stroke = 14,
  label = "",
  from = "#a78bfa",
  to = "#22d3ee",
  children,
}) {
  const id = useId();
  const pct = Math.max(0, Math.min(100, Number(value) || 0));
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={from} />
            <stop offset="100%" stopColor={to} />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={stroke}
          fill="none"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={`url(#${id})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: circumference * (1 - pct / 100) }}
          transition={{ duration: 1.4, ease: [0.16, 1, 0.3, 1] }}
          style={{ filter: `drop-shadow(0 0 10px ${from}66)` }}
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center text-center">
        {children || (
          <div>
            <AnimatedNumber
              value={pct}
              suffix="%"
              className="font-display text-4xl font-bold text-white"
            />
            {label && <div className="mt-0.5 text-xs text-slate-400">{label}</div>}
          </div>
        )}
      </div>
    </div>
  );
}
