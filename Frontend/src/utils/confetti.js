import confetti from "canvas-confetti";

const COLORS = ["#a78bfa", "#f0abfc", "#22d3ee", "#a3e635", "#fbbf24"];

const reducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

export function celebrate(opts = {}) {
  if (reducedMotion()) return;
  confetti({ particleCount: 90, spread: 75, startVelocity: 38, origin: { y: 0.75 }, colors: COLORS, zIndex: 80, ...opts });
}

export function bigCelebrate() {
  if (reducedMotion()) return;
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 5, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors: COLORS, zIndex: 80 });
    confetti({ particleCount: 5, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors: COLORS, zIndex: 80 });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
}
