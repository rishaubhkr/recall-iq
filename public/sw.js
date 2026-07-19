// RecallIQ Service Worker — Push Notifications
self.addEventListener("push", (event) => {
  const data = event.data?.json() ?? {};
  const title = data.title ?? "📚 RecallIQ Reminder";
  const body = data.body ?? "Your streak is at risk — study 5 cards to protect it!";
  const icon = data.icon ?? "/icons/icon-192x192.png";
  const url = data.url ?? "/study";

  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon,
      badge: "/icons/icon-72x72.png",
      tag: "recalliq-streak",       // Replaces previous notification of same tag
      renotify: true,
      data: { url },
      actions: [
        { action: "study", title: "Study Now ⚡" },
        { action: "dismiss", title: "Dismiss" },
      ],
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "dismiss") return;

  const url = event.notification.data?.url ?? "/study";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      const existing = windowClients.find((c) => c.url.includes(self.location.origin));
      if (existing) return existing.focus();
      return clients.openWindow(url);
    })
  );
});
