import React, { useEffect, useState } from "react";
import { Download } from "lucide-react";

const isStandalone = () => window.matchMedia?.("(display-mode: standalone)").matches || window.navigator.standalone === true;
const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent);

// "Install app" item for the account menu. Chrome/Edge/Android get the browser's install dialog;
// iPhone shows how to add it (Safari has no install button).
export default function InstallApp({ className = "" }) {
  const [canInstall, setCanInstall] = useState(!!window.__installPrompt);
  const [showIOS, setShowIOS] = useState(false);

  useEffect(() => {
    const on = () => setCanInstall(true);
    const done = () => setCanInstall(false);
    window.addEventListener("pt-installable", on);
    window.addEventListener("appinstalled", done);
    return () => {
      window.removeEventListener("pt-installable", on);
      window.removeEventListener("appinstalled", done);
    };
  }, []);

  if (isStandalone()) return null; // already running as the installed app
  if (!canInstall && !isIOS()) return null;

  const install = async () => {
    if (window.__installPrompt) {
      window.__installPrompt.prompt();
      await window.__installPrompt.userChoice.catch(() => {});
      window.__installPrompt = null;
      setCanInstall(false);
    } else {
      setShowIOS((s) => !s);
    }
  };

  return (
    <>
      <button onClick={install} className={className} role="menuitem">
        <Download size={16} className="text-accent" /> Install app
      </button>
      {showIOS && (
        <p className="px-3 pb-2 text-xs text-zinc-400">
          In Safari, tap <b className="text-white">Share</b> → <b className="text-white">Add to Home Screen</b>.
        </p>
      )}
    </>
  );
}
