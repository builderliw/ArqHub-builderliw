/* ArqHub service worker — push notifications + app badge.
   Não usa cache (sem offline). Apenas push + click + badge. */

self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    try {
      const names = await caches.keys();
      const staleAppCaches = names.filter((name) => {
        const isWorkbox = /(^|-)precache-v\d+-|(^|-)runtime-|(^|-)googleAnalytics-/.test(name);
        return isWorkbox && name.endsWith(self.registration.scope);
      });
      await Promise.allSettled(staleAppCaches.map((name) => caches.delete(name)));
    } catch (_) { /* ignore */ }
    await self.clients.claim();
  })());
});

self.addEventListener("push", (event) => {
  let data = {};
  try { data = event.data ? event.data.json() : {}; } catch (e) { data = {}; }

  const title = data.title || "ArqHub";
  const options = {
    body: data.body || "",
    icon: data.icon || "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    tag: data.tag || "arqhub",
    renotify: true,
    data: { url: data.url || "/app/cliente/documentos" },
  };

  const badgeCount = typeof data.badge === "number" ? data.badge : 1;

  event.waitUntil((async () => {
    await self.registration.showNotification(title, options);
    try {
      if ("setAppBadge" in self.navigator) {
        await self.navigator.setAppBadge(badgeCount);
      }
    } catch (_) { /* ignore */ }
  })());
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const targetUrl = (event.notification.data && event.notification.data.url) || "/app/cliente/documentos";
  event.waitUntil((async () => {
    try {
      if ("clearAppBadge" in self.navigator) await self.navigator.clearAppBadge();
    } catch (_) {}
    const allClients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of allClients) {
      if (client.url.includes(targetUrl) && "focus" in client) {
        return client.focus();
      }
    }
    for (const client of allClients) {
      if ("navigate" in client && "focus" in client) {
        await client.navigate(targetUrl);
        return client.focus();
      }
    }
    if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
  })());
});

self.addEventListener("message", (event) => {
  if (event.data === "CLEAR_BADGE") {
    try { self.navigator.clearAppBadge && self.navigator.clearAppBadge(); } catch (_) {}
  }
});
