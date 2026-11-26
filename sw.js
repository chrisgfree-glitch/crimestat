/* CrimeStat service worker — caches the app shell only, never live data or geocode. */
const VERSION = "crimestat-shell-v3";
const SHELL = [
  "/",
  "/index.html",
  "/styles.css",
  "/app.js",
  "/site.webmanifest",
  "/privacy",
  "/records",
  "/favicon.ico",
  "/favicon-16.png",
  "/favicon-32.png",
  "/apple-touch-icon.png",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/icon-192-maskable.png",
  "/icons/icon-512-maskable.png",
  "/assets/logo.png",
  "/404.html",
];

function isLiveData(url) {
  return url.pathname.startsWith("/data/") || url.pathname.startsWith("/api/");
}

async function precache() {
  const cache = await caches.open(VERSION);
  await Promise.all(
    SHELL.map(async (path) => {
      try {
        const res = await fetch(path, { cache: "reload" });
        if (res.ok) await cache.put(path, res);
      } catch (_) {
        /* skip a missing shell file rather than failing the whole install */
      }
    })
  );
}

async function networkFirst(request) {
  try {
    const res = await fetch(request);
    if (res && res.ok) {
      const cache = await caches.open(VERSION);
      cache.put(request, res.clone());
    }
    return res;
  } catch (err) {
    const cached = await caches.match(request);
    if (cached) return cached;
    if (request.mode === "navigate") {
      const home = await caches.match("/") || await caches.match("/index.html");
      if (home) return home;
    }
    throw err;
  }
}

async function cacheFirst(request) {
  const cached = await caches.match(request);
  if (cached) return cached;
  const res = await fetch(request);
  if (res && res.ok) {
    const cache = await caches.open(VERSION);
    cache.put(request, res.clone());
  }
  return res;
}

self.addEventListener("install", (event) => {
  event.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== VERSION).map((key) => caches.delete(key)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (isLiveData(url)) return;

  // Network-first for everything so a new deploy always shows up; cache is only an offline fallback.
  event.respondWith(networkFirst(request));
});
