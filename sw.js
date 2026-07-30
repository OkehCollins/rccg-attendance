// ============================================================
// Champions Cathedral Media Team Portal — Service Worker
// ============================================================
// Bump this version string any time you change any file in the
// app (HTML, CSS, JS, icons). That forces every visitor's browser
// to fetch fresh copies instead of serving stale cached ones.
const CACHE_VERSION = "cc-media-shell-v5";

// The "app shell" — static files needed to boot the UI. Cached on
// install so the app can open even with no signal.
const APP_SHELL = [
  "/",
  "/index.html",
  "/pages/member.html",
  "/pages/admin.html",
  "/pages/platform.html",
  "/css/style.css",
  "/js/firebase-config.js",
  "/js/cloudinary-config.js",
  "/js/emailjs-config.js",
  "/js/icons.js",
  "/js/motion.js",
  "/js/devotionals.js",
  "/manifest.webmanifest",
  "/favicon.ico",
  "/assets/logo.png",
  "/assets/favicon-32.png",
  "/assets/favicon-192.png",
  "/assets/favicon-512.png",
  "/assets/apple-touch-icon.png"
];

// Hosts that must ALWAYS go to the live network — never served from
// cache and never cached. Auth, live data, and photo uploads all need
// to be current, or things like clock-in/clock-out would silently
// use stale data.
const NEVER_CACHE_HOSTS = [
  "firestore.googleapis.com",
  "identitytoolkit.googleapis.com",
  "securetoken.googleapis.com",
  "cloudinary.com",
  "res.cloudinary.com"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting(); // activate this new version as soon as it's installed
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim(); // take control of any already-open tabs immediately
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only ever handle GET requests — POST/PUT (excuse submissions, photo
  // uploads, etc.) always go straight to the network untouched.
  if (req.method !== "GET") return;

  // Live data / auth / uploads — never intercept, always fetch fresh.
  if (NEVER_CACHE_HOSTS.some((h) => url.hostname.includes(h))) return;

  // Everything else (this site's own files, the Firebase SDK loaded
  // from gstatic.com, Google Fonts) — stale-while-revalidate: answer
  // instantly from cache if we have it, and refresh the cache from the
  // network in the background for next time. Falls back to cache if
  // the network is unavailable (offline).
  event.respondWith(
    caches.match(req).then((cached) => {
      const networkFetch = fetch(req)
        .then((res) => {
          if (res && res.status === 200) {
            const clone = res.clone();
            caches.open(CACHE_VERSION).then((cache) => cache.put(req, clone));
          }
          return res;
        })
        .catch(() => cached);
      return cached || networkFetch;
    })
  );
});
