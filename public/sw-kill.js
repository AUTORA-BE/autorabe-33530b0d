/**
 * One-shot kill-switch service worker.
 * Purges all caches and unregisters itself, then forces clients to reload.
 * Used to recover from stale PWA caches across releases.
 */
self.addEventListener("install", (e) => e.waitUntil(self.skipWaiting()));

self.addEventListener("activate", (e) =>
  e.waitUntil(
    (async () => {
      try {
        await self.clients.claim();
        const names = await caches.keys();
        await Promise.all(names.map((n) => caches.delete(n)));
        const clients = await self.clients.matchAll({
          type: "window",
          includeUncontrolled: true,
        });
        await Promise.all(
          clients.map((c) => {
            const url = new URL(c.url);
            url.searchParams.set("sw-cleanup", Date.now().toString());
            return c.navigate(url.toString()).catch(() => undefined);
          })
        );
        await self.registration.unregister();
      } catch (err) {
        // Fail silent: we still want to unregister even if something blew up.
        try {
          await self.registration.unregister();
        } catch {
          /* noop */
        }
      }
    })()
  )
);
