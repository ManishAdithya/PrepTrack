import React, { useState } from "react";
import { Info } from "lucide-react";
import Modal from "./ui/Modal.jsx";

// "How is this calculated?" — the same explanation everywhere readiness or confidence appears.
// Mirrors Backend/utils/readiness.js.
export default function ReadinessHelp({ label = "How is this calculated?", iconOnly = false }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpen(true);
        }}
        className={
          iconOnly
            ? "grid h-7 w-7 place-items-center rounded-full text-zinc-500 hover:bg-white/5 hover:text-white"
            : "inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-400 underline-offset-4 hover:text-white hover:underline"
        }
        aria-label="How readiness and confidence are calculated"
      >
        <Info size={iconOnly ? 15 : 13} />
        {!iconOnly && label}
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Readiness vs confidence" subtitle="Two different things — one measured, one felt.">
        <div className="space-y-5 text-sm leading-relaxed text-zinc-300">
          <section>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">Readiness — from your marks</h3>
            <ol className="list-decimal space-y-1.5 pl-5">
              <li>
                <b className="text-white">Each subject</b> = the average of every result you log for it. Newer results count more:
                latest ×1, the one before ×0.7, then ×0.49…
              </li>
              <li>
                <b className="text-white">Overall</b> = the average of your subjects, so one bad test lowers one subject — it doesn't
                wipe out everything else.
              </li>
            </ol>
            <div className="mt-3 rounded-xl border border-white/10 bg-ink-900 p-3 font-mono text-xs text-zinc-400">
              Power Systems: 40% (latest), 80%, 85%
              <br />= (40×1 + 80×0.7 + 85×0.49) ÷ (1 + 0.7 + 0.49) = <span className="text-accent">63%</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-emerald-300">Strong · 75%+</span>
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-2.5 py-1 text-zinc-200">On track · 60–74%</span>
              <span className="rounded-full border border-rose-400/25 bg-rose-400/10 px-2.5 py-1 text-rose-300">Needs work · below 60%</span>
            </div>
          </section>

          <section>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">Confidence — how you feel</h3>
            <p>
              For each subject in your exam plan you tap <b className="text-white">High</b>, <b className="text-white">Medium</b> or{" "}
              <b className="text-white">Low</b>. Nothing is calculated — it's your honest gut feeling.
            </p>
          </section>

          <section>
            <h3 className="mb-1.5 font-display text-base font-bold text-white">Why both? (the practical part)</h3>
            <p>PrepTrack compares them and warns you when they disagree:</p>
            <ul className="mt-1.5 list-disc space-y-1 pl-5">
              <li>
                <b className="text-rose-300">Overconfident</b> — you feel High but your marks are below 60%. Revise before it's too late.
              </li>
              <li>
                <b className="text-emerald-300">Underconfident</b> — you feel Low but you score 75%+. Spend that time on a weaker subject.
              </li>
            </ul>
            <p className="mt-2 text-zinc-500">
              Readiness is only as good as the results you log — add class tests and mock papers, not just finals.
            </p>
          </section>
        </div>
      </Modal>
    </>
  );
}
