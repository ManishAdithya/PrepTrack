import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { BarChart3, MessageSquareWarning, ChevronDown, GraduationCap, KeyRound, LogOut, ShieldCheck, User } from "lucide-react";
import { useAuth } from "../context/AuthContext.jsx";
import Avatar from "./ui/Avatar.jsx";
import InstallApp from "./InstallApp.jsx";

// Avatar button + menu, in the top bar of both portals (also on phones, where there is no sidebar).
// CRs are students too, so they can switch between their student view and the CR portal here.
export default function AccountMenu() {
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const inAdmin = pathname.startsWith("/admin");
  const isCR = user?.role === "admin";

  // close on outside tap / Escape / navigation
  useEffect(() => {
    if (!open) return;
    const onDown = (e) => ref.current && !ref.current.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);
  useEffect(() => setOpen(false), [pathname]);

  const item = "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-zinc-200 hover:bg-white/[0.06]";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-xl p-1 transition hover:bg-white/5 md:pr-2"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
      >
        <Avatar name={user?.name || "Student"} size={32} />
        <div className="hidden text-left leading-tight md:block">
          <div className="text-sm font-semibold text-white">{user?.name || "User"}</div>
          <div className="text-xs text-zinc-500">
            {isCR ? "CR · " : ""}
            {user?.rollNumber || user?.branch || ""}
          </div>
        </div>
        <ChevronDown size={14} className="hidden text-zinc-500 md:block" />
      </button>

      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-60 rounded-xl border border-white/10 bg-ink-800 p-1.5 shadow-2xl shadow-black/60">
          <div className="border-b border-white/[0.06] px-3 pb-2.5 pt-1.5">
            <div className="truncate text-sm font-semibold text-white">{user?.name}</div>
            <div className="truncate text-xs text-zinc-500">{user?.rollNumber}</div>
          </div>
          <div className="py-1">
            <Link to="/profile" className={item} role="menuitem">
              <User size={16} className="text-zinc-500" /> My profile
            </Link>
            {isCR &&
              (inAdmin ? (
                <Link to="/" className={item} role="menuitem">
                  <GraduationCap size={16} className="text-zinc-500" /> Switch to student view
                </Link>
              ) : (
                <Link to="/admin" className={item} role="menuitem">
                  <ShieldCheck size={16} className="text-accent" /> Open CR portal
                </Link>
              ))}
            {user?.isOwner && (
              <Link to="/owner" className={item} role="menuitem">
                <BarChart3 size={16} className="text-accent" /> Owner dashboard
              </Link>
            )}
            <InstallApp className={item} />
            <Link to={inAdmin ? "/admin/feedback" : "/feedback"} className={item} role="menuitem">
              <MessageSquareWarning size={16} className="text-zinc-500" /> Send feedback
            </Link>
            <Link to="/change-password" className={item} role="menuitem">
              <KeyRound size={16} className="text-zinc-500" /> Change password
            </Link>
          </div>
          <div className="border-t border-white/[0.06] pt-1">
            <button onClick={logout} className={`${item} text-rose-300 hover:bg-rose-500/10`} role="menuitem">
              <LogOut size={16} /> Log out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
