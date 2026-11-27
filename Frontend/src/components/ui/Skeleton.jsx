import React from "react";

export default function Skeleton({ className = "" }) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-white/[0.05] before:absolute before:inset-0 before:-translate-x-full before:animate-shimmer /[0.08] ${className}`}
    />
  );
}

export function SkeletonGrid({ count = 6, className = "h-40" }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Skeleton key={i} className={className} />
      ))}
    </div>
  );
}
