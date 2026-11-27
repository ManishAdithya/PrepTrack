import React from "react";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import Avatar from "../ui/Avatar.jsx";
import { Brand } from "../NavSidebar.jsx";
import { DemoBadge, SearchButton } from "../Topbar.jsx";

export default function AdminTopbar({ title = "Admin Dashboard", onOpenSearch }) {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-ink-950/60 backdrop-blur-2xl">
      <div className="flex h-16 items-center gap-3 px-4 md:px-8">
        <div className="md:hidden">
          <Brand subtitle="" />
        </div>
        <div className="hidden min-w-0 items-center gap-2 text-sm md:flex">
          <span className="text-zinc-500">Admin</span>
          <span className="text-zinc-600">/</span>
          <span className="truncate font-semibold text-white">{title}</span>
        </div>
        <div className="mx-auto hidden w-full max-w-sm lg:block">
          <SearchButton onOpen={onOpenSearch} label="Jump to a page…" />
        </div>
        <div className="ml-auto flex items-center gap-3">
          <DemoBadge />
          <span className="hidden items-center gap-1.5 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs font-semibold text-accent sm:inline-flex">
            <ShieldCheck size={14} /> Administrator
          </span>
          <Avatar name={user?.name || user?.email || "Admin"} size={36} />
        </div>
      </div>
    </header>
  );
}
