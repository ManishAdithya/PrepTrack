import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
    {/* Vercel Web Analytics: page views and visitors, no cookies */}
    <Analytics />
  </React.StrictMode>
);

// Installable app: register the (non-caching) service worker on the live site
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js").catch(() => {}));
}

// Keep the browser's "install app" offer so the account menu can show an Install button
window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event("pt-installable"));
});
