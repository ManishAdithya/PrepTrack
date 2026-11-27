// PrepTrack service worker — only here so the app can be installed.
// It caches nothing: every page and API call goes to the network, so whatever is deployed
// shows up the next time the app is opened.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));
self.addEventListener("fetch", () => {
  /* network only — let the browser handle every request normally */
});
