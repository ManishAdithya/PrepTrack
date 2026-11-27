import React from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Brand } from "../NavSidebar.jsx";
import { DemoBadge, SearchButton } from "../Topbar.jsx";
import AccountMenu from "../AccountMenu.jsx";

export default function AdminTopbar({ title = "CR portal", onOpenSearch }) {
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/95">
      <div className="flex h-14 items-center gap-2 px-4 md:h-16 md:gap-3 md:px-8">
        <div className="flex items-center gap-2 md:hidden">
          <Brand compact />
          <span className="rounded-md bg-accent px-1.5 py-0.5 text-[10px] font-bold uppercase text-black">CR</span>
        </div>
        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          <span className="text-zinc-500">CR portal</span>
          <span className="text-zinc-600">/</span>
          <span className="truncate font-semibold text-white">{title}</span>
        </div>
        <div className="mx-auto hidden w-full max-w-sm lg:block">
          <SearchButton onOpen={onOpenSearch} label="Jump to a page…" />
        </div>
        <div className="ml-auto flex items-center gap-1.5 md:gap-2">
          <DemoBadge />
          {/* a CR is a student too */}
          <Link to="/" className="btn-ghost !min-h-[36px] !px-3 !py-1.5 text-xs">
            <GraduationCap size={15} /> <span className="hidden sm:inline">Student view</span>
            <span className="sm:hidden">Student</span>
          </Link>
          <AccountMenu />
        </div>
      </div>
    </header>
  );
}
