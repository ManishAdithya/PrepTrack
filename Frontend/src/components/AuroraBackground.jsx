import React from "react";

// Page background: a thin white grid on near-black, brightest at the top centre and fading out
// towards the edges, so it adds texture without getting in the way of the content.
export default function AuroraBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-ink-950">
      <div className="bg-grid absolute inset-0" />
      <div
        className="absolute inset-0"
        style={{ background: "radial-gradient(ellipse 120% 85% at 50% 0%, transparent 35%, #09090b 92%)" }}
      />
    </div>
  );
}
