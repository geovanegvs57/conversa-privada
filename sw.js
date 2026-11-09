
const CACHE_NAME = "aura-v2";

const FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./logo-vg.png",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(FILES)
    )
  );

  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key.startsWith("aura-") && key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );

  self.clients.claim();
});

self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);

  // Não interceptar Firebase ou outros serviços externos.
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        return await caches.match("./index.html");
      })
    );
    return;
  }

  event.respondWith(
    fetch(request).then(response => {
      if (response.ok) {
        const copy = response.clone();

        caches.open(CACHE_NAME).then(cache => {
          cache.put(request, copy);
        });
      }

      return response;
    }).catch(async () => {
      return await caches.match(request);
    })
  );
});

