import React from "react";

// Slowly drifting colour blobs + a faint grid behind every page
export default function AuroraBackground({ tone = "violet" }) {
  const second = tone === "admin" ? "bg-cyan-500/20" : "bg-fuchsia-600/20";
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-ink-950">
      <div className="absolute -left-40 -top-40 h-[34rem] w-[34rem] animate-aurora rounded-full bg-violet-600/25 blur-[120px]" />
      <div className={`absolute -right-40 top-1/4 h-[30rem] w-[30rem] animate-aurora-slow rounded-full ${second} blur-[120px]`} />
      <div className="absolute -bottom-48 left-1/3 h-[32rem] w-[32rem] animate-aurora rounded-full bg-cyan-500/15 blur-[130px]" />
      <div className="bg-grid mask-fade absolute inset-0 opacity-60" />
    </div>
  );
}
