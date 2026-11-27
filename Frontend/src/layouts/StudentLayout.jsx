import React, { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Timer, Upload, MessageSquarePlus, LogOut } from "lucide-react";
import Sidebar, { studentSections } from "../components/Sidebar.jsx";
import Topbar from "../components/Topbar.jsx";
import MobileNav from "../components/MobileNav.jsx";
import CommandPalette from "../components/CommandPalette.jsx";
import AuroraBackground from "../components/AuroraBackground.jsx";
import { FocusProvider, useFocus } from "../context/FocusContext.jsx";
import { GameProvider } from "../context/GameContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

const allLinks = studentSections.flatMap((s) => s.links);
const mobileLinks = allLinks.slice(0, 5).map((l) => ({ ...l, short: l.label.split(" ")[0] }));

function Shell() {
  const location = useLocation();
  const navigate = useNavigate();
  const focus = useFocus();
  const { logout } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);

  const actions = useMemo(
    () => [
      { label: focus.running ? "Pause focus timer" : "Start a 25-min focus session", icon: Timer, run: focus.running ? focus.pause : focus.start },
      { label: "Upload study material", icon: Upload, run: () => navigate("/resources?upload=1") },
      { label: "Start a discussion", icon: MessageSquarePlus, run: () => navigate("/discussions?new=1") },
      { label: "Log out", icon: LogOut, run: logout },
    ],
    [focus.running, focus.pause, focus.start, navigate, logout]
  );

  return (
    <div className="relative min-h-screen text-slate-100">
      <AuroraBackground />
      <div className="flex">
        <Sidebar />
        <main className="min-w-0 flex-1">
          <Topbar onOpenSearch={() => setSearchOpen(true)} />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto max-w-[1400px] p-4 pb-28 md:p-8 md:pb-12"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileNav links={mobileLinks} />
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} links={allLinks} actions={actions} searchMaterials />
    </div>
  );
}

export default function StudentLayout() {
  return (
    <GameProvider>
      <FocusProvider>
        <Shell />
      </FocusProvider>
    </GameProvider>
  );
}
