const CACHE_NAME = "aidat-v2";

const STATIC_CACHE = [
  "/",
  "/index.html",
  "/icon-192.png",
  "/manifest.json"
];

// INSTALL
self.addEventListener("install", (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_CACHE))
  );
});

// ACTIVATE
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // ❌ API ASLA CACHE'LENMEZ
  if (url.pathname.startsWith("/aidat") || url.pathname.startsWith("/users")) {
    return;
  }

  // ✅ SADECE STATİK DOSYALAR
  event.respondWith(
    caches.match(event.request).then((res) => res || fetch(event.request))
  );
});

// PUSH
self.addEventListener("push", (event) => {
  const data = event.data?.json() || {};
  self.registration.showNotification(data.title || "Aidat Bildirimi", {
    body: data.body || "Yeni aidat eklendi",
    icon: "/icon-192.png",
    badge: "/icon-192.png"
  });
});
