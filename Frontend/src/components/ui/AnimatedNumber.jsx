import React, { useEffect, useRef, useState } from "react";
import { animate } from "framer-motion";

// Counts up from the previous value to `value`
export default function AnimatedNumber({ value = 0, duration = 1.1, suffix = "", className = "" }) {
  const [display, setDisplay] = useState(0);
  const from = useRef(0);

  useEffect(() => {
    const target = Number(value) || 0;
    const controls = animate(from.current, target, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    from.current = target;
    return () => controls.stop();
  }, [value, duration]);

  return (
    <span className={`tabular-nums ${className}`}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}
