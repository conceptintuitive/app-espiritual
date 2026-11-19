// Service worker do Intuitive Concept — só aviso (push) e clique no aviso.
// Sem cache de propósito: o site continua 100% online, sem risco de servir
// página velha. Registrado pelo /seu-dia.

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('push', (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { title: 'Seu Dia', body: event.data ? event.data.text() : '' };
  }
  const title = data.title || 'Seu Dia';
  event.waitUntil(self.registration.showNotification(title, {
    body: data.body || '',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    tag: 'seu-dia',
    renotify: true,
    data: { url: data.url || '/seu-dia' },
  }));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = new URL(event.notification.data?.url || '/seu-dia', self.location.origin).href;
  event.waitUntil((async () => {
    const abertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    for (const c of abertas) {
      if (c.url.startsWith(self.location.origin) && 'focus' in c) {
        await c.navigate(url).catch(() => {});
        return c.focus();
      }
    }
    return self.clients.openWindow(url);
  })());
});
