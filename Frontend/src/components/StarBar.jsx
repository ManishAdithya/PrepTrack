import React from "react";
import { Star, ArrowUpRight } from "lucide-react";

const REPO = "https://github.com/ManishAdithya/PrepTrack";

// Slim strip under the top bar on every student and CR page, asking for a GitHub star.
export default function StarBar() {
  return (
    <div className="border-b border-white/[0.06] bg-accent/[0.06]">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-1.5 text-xs text-zinc-300 md:px-8">
        <Star size={13} className="shrink-0 fill-accent text-accent" aria-hidden="true" />
        <p className="min-w-0 flex-1 leading-snug">
          If you love the idea and the website, please give my repo a star on GitHub:{" "}
          <a href={REPO} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 break-all font-semibold text-accent hover:underline">
            github.com/ManishAdithya/PrepTrack
            <ArrowUpRight size={12} className="shrink-0" aria-hidden="true" />
          </a>
        </p>
      </div>
    </div>
  );
}
