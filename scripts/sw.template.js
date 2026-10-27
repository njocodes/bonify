// Bonify service worker: keeps the app usable offline.
// - hashed build files (/_next/static/): cache first, they never change
// - pages and everything else on this origin: network first, last good copy as offline fallback
// - cover images from Spotify's CDN: cache first with a size cap
// __BUILD__ is replaced by scripts/make-sw.mjs, so every deployment gets its own caches.
// (Turbopack can reuse a file name for different content, so cached build files must never outlive their build.)
const VERSION = "bonify-__BUILD__";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

const ROUTES = ["/", "/dashboard/"];

// Pre-cache the start page and the dashboard with their build files; every other page is kept after its first visit.
// (Pre-caching everything re-downloads the whole app on each deployment.)
async function precache() {
  const pages = await caches.open(PAGES);
  const files = await caches.open(STATIC);
  const assets = new Set();
  await Promise.all(
    ROUTES.map(async (r) => {
      try {
        const res = await fetch(r);
        if (!res.ok) return;
        const html = await res.clone().text();
        for (const m of html.matchAll(/\/_next\/static\/[^"'\s\\)]+/g)) assets.add(m[0]);
        await pages.put(r, res);
      } catch {}
    }),
  );
  await Promise.all([...assets].map((a) => files.add(a).catch(() => {})));
  // The Web Worker and its chunks are only named inside the JS bundles (without the /_next/ prefix), so scan those too.
  const extra = new Set();
  await Promise.all(
    [...assets]
      .filter((a) => a.endsWith(".js"))
      .map(async (a) => {
        try {
          const js = await (await files.match(a)).text();
          for (const m of js.matchAll(/static\/chunks\/[\w.-]+\.js/g)) if (!assets.has("/_next/" + m[0])) extra.add("/_next/" + m[0]);
        } catch {}
      }),
  );
  await Promise.all([...extra].map((a) => files.add(a).catch(() => {})));
}

self.addEventListener("install", (e) => {
  e.waitUntil(precache().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    (async () => {
      for (const k of await caches.keys()) if (!k.startsWith(VERSION)) await caches.delete(k);
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(PAGES);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    const hit = await cache.match(req, { ignoreSearch: req.mode === "navigate" });
    if (hit) return hit;
    if (req.mode === "navigate") return (await cache.match("/dashboard/")) || (await cache.match("/")) || Response.error();
    return Response.error();
  }
}

async function cacheFirst(req, name, limit) {
  const cache = await caches.open(name);
  // The worker entry reads its chunk list from its own URL (#params). A response taken from the cache carries the
  // URL it was stored under and would drop that part, so it is handed out as a fresh Response without a URL.
  const entry = /turbopack-worker/.test(req.url);
  const found = await cache.match(req, { ignoreSearch: entry });
  const hit = found && entry ? new Response(found.body, { status: found.status, headers: found.headers }) : found;
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") {
    cache.put(req, res.clone());
    if (limit) {
      const keys = await cache.keys();
      if (keys.length > limit) await cache.delete(keys[0]);
    }
  }
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin === self.location.origin) {
    if (url.pathname.startsWith("/_next/static/")) return e.respondWith(cacheFirst(req, STATIC));
    return e.respondWith(networkFirst(req));
  }
});
