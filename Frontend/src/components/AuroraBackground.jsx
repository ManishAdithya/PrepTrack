import React from "react";

// Plain dark page background (the old moving colour blobs were removed for a calmer, professional look)
export default function AuroraBackground() {
  return <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-ink-950" />;
}
