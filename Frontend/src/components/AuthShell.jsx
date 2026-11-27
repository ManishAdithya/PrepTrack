import React from "react";
import { BookOpen, CalendarClock, MessagesSquare, Trophy } from "lucide-react";
import { Brand } from "./NavSidebar.jsx";
import AuroraBackground from "./AuroraBackground.jsx";

const features = [
  { icon: BookOpen, text: "Notes, slides and PYQs from your class" },
  { icon: CalendarClock, text: "Exam dates with a live countdown" },
  { icon: MessagesSquare, text: "Ask doubts in your class forum" },
  { icon: Trophy, text: "Earn XP for sharing, climb the ranks" },
];

// Frame for the login and signup pages: a bold statement on desktop, just the form on phones
export default function AuthShell({ children }) {
  return (
    <div className="relative min-h-screen text-zinc-100">
      <AuroraBackground />
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-12 px-4 py-8 lg:grid-cols-2 lg:px-8">
        <div className="hidden lg:block">
          <Brand subtitle="EEE · Amrita" />
          <h1 className="mt-12 text-6xl font-bold uppercase leading-[0.95] tracking-tight text-white">
            Prepare.
            <br />
            Track.
            <br />
            <span className="text-accent">Score.</span>
          </h1>
          <ul className="mt-10 space-y-3">
            {features.map((f) => (
              <li key={f.text} className="flex items-center gap-3 text-zinc-400">
                <f.icon size={17} className="text-accent" />
                {f.text}
              </li>
            ))}
          </ul>
        </div>

        <div className="mx-auto w-full max-w-md">
          <div className="mb-8 flex justify-center lg:hidden">
            <Brand subtitle="EEE · Amrita" />
          </div>
          <div className="rounded-2xl border border-white/[0.08] bg-ink-800 p-6 sm:p-8">{children}</div>
          <div className="mt-6 text-center text-xs text-zinc-600">PrepTrack · by students, for students</div>
        </div>
      </div>
    </div>
  );
}
