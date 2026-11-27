import React, { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import AdminSidebar, { adminSections } from "../components/admin/AdminSidebar.jsx";
import AdminTopbar from "../components/admin/AdminTopbar.jsx";
import MobileNav from "../components/MobileNav.jsx";
import CommandPalette from "../components/CommandPalette.jsx";
import AuroraBackground from "../components/AuroraBackground.jsx";

const allLinks = adminSections.flatMap((s) => s.links);
const mobileLinks = allLinks.slice(0, 5).map((l) => ({ ...l, short: l.short || l.label.split(" ")[0] }));

export default function AdminLayout() {
  const location = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const title = allLinks.find((l) => l.to === location.pathname)?.label || "Admin";

  return (
    <div className="relative min-h-screen text-zinc-100">
      <AuroraBackground />
      <div className="flex">
        <AdminSidebar />
        <main className="min-w-0 flex-1 overflow-x-clip">
          <AdminTopbar title={title} onOpenSearch={() => setSearchOpen(true)} />
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            className="mx-auto max-w-6xl px-4 pt-5 pb-safe md:px-8 md:pt-8 md:pb-12"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
      <MobileNav links={mobileLinks} />
      <CommandPalette open={searchOpen} setOpen={setSearchOpen} links={allLinks} />
    </div>
  );
}
