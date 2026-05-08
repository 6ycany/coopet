// CooPet Service Worker — オフライン対応
const CACHE_NAME = 'coopet-v4';

// sw.js の場所を基準にベースパスを自動取得（GitHub Pages サブパス対応）
const BASE = self.location.pathname.replace(/sw\.js$/, '');

// キャッシュするファイル一覧
const PRECACHE_URLS = [
  BASE,
  BASE + 'index.html',
  BASE + 'manifest.json',
  BASE + 'icons/icon-192x192.png',
  BASE + 'icons/icon-512x512.png',
  BASE + 'bg/bg-room.png',
  BASE + 'bg/bg-garden.png',
  BASE + 'bg/bg-night.png',
  BASE + 'bg/bg-sky.png',
  BASE + 'furn/furn-board.png',
  BASE + 'furn/furn-igloo.png',
  BASE + 'furn/furn-table.png',
  BASE + 'furn/furn-plant.png',
  BASE + 'furn/furn-window.png',
  BASE + 'furn/furn-igloo_sm.png',
  BASE + 'furn/furn-rug.png',
  BASE + 'furn/furn-lamp.png',
  BASE + 'furn/furn-tower.png',
  BASE + 'furn/furn-frame.png',
  // Google Fonts は別途キャッシュ
  'https://fonts.googleapis.com/css2?family=Kaisei+Decol:wght@400;700&family=M+PLUS+Rounded+1c:wght@400;700;900&display=swap',
];

// ── インストール時：必要ファイルを事前キャッシュ ──
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // ネットワーク失敗しても install は続ける
      return Promise.allSettled(
        PRECACHE_URLS.map(url =>
          cache.add(url).catch(err => console.warn('Cache skip:', url, err))
        )
      );
    }).then(() => self.skipWaiting())
  );
});

// ── アクティベート時：古いキャッシュを削除 ──
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// ── Fetch 戦略 ──
// ゲームファイル → Cache First（オフライン優先）
// 外部リソース（Fonts等）→ Network First with Cache Fallback
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Googleフォントなど外部リソース: Network First
  if (!url.origin.includes(self.location.origin) || 
      url.href.includes('fonts.googleapis') ||
      url.href.includes('fonts.gstatic')) {
    event.respondWith(
      fetch(event.request)
        .then(res => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // 自ドメインのファイル: Cache First
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;
      return fetch(event.request).then(res => {
        const clone = res.clone();
        caches.open(CACHE_NAME).then(c => c.put(event.request, clone));
        return res;
      });
    }).catch(() => {
      // オフライン時のフォールバック
      return caches.match(BASE + 'index.html');
    })
  );
});

// ── Push通知（将来の共同育成通知用・現在は未使用） ──
self.addEventListener('push', event => {
  if (!event.data) return;
  const data = event.data.json();
  event.waitUntil(
    self.registration.showNotification(data.title || 'CooPet', {
      body: data.body || 'ペットからメッセージがあります！',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-72x72.png',
      tag: 'coopet-notification',
      renotify: true,
      data: { url: data.url || '/' }
    })
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
      if (clientList.length > 0) return clientList[0].focus();
      return clients.openWindow(BASE);
    })
  );
});
