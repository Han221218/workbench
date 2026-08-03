// 李喆涵的工作台 - Service Worker
// 实现离线缓存，让 App 在没有网络时也能打开

const CACHE_NAME = 'lzh-workbench-v1';
const CORE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-192-maskable.png',
  './icon-512-maskable.png',
  './apple-touch-icon.png'
];

// 安装：缓存核心资源
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(CORE_ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// 激活：清理旧缓存
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// 请求拦截：导航请求网络优先（保证更新），其他请求缓存优先
self.addEventListener('fetch', event => {
  const req = event.request;

  // 只处理 GET 请求
  if (req.method !== 'GET') return;

  // 导航请求（打开页面）：网络优先，失败回退缓存
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then(res => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then(c => c.put('./index.html', copy));
          return res;
        })
        .catch(() => caches.match('./index.html').then(r => r || caches.match('./')))
    );
    return;
  }

  // 其他资源：缓存优先，回退网络
  event.respondWith(
    caches.match(req)
      .then(cached => cached || fetch(req).catch(() => cached))
  );
});
