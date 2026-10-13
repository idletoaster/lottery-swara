const CACHE_NAME = 'swara-v1.9.15';
const ASSETS = [
    './',
    './index.html',
    './css/style.css?v=1.9.15',
    './js/astro-engine.js?v=1.9.15',
    './js/app.js?v=1.9.15',
    './manifest.json?v=1.9.15',
    'https://cdn.jsdelivr.net/npm/chart.js',
    'https://cdn.jsdelivr.net/npm/flatpickr/dist/flatpickr.min.css',
    'https://cdn.jsdelivr.net/npm/flatpickr'
];

self.addEventListener('install', e => {
    e.waitUntil(caches.open(CACHE_NAME).then(c => c.addAll(ASSETS)));
    self.skipWaiting();
});

self.addEventListener('activate', e => {
    e.waitUntil(
        caches.keys().then(keyList => {
            return Promise.all(keyList.map(key => {
                if (key !== CACHE_NAME) {
                    return caches.delete(key);
                }
            }));
        })
    );
    self.clients.claim();
});

self.addEventListener('fetch', e => {
    if (e.request.url.includes('jackpot_data.json') || e.request.url.includes('nominatim') || e.request.url.includes('open-meteo')) {
        e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
        return;
    }
    e.respondWith(caches.match(e.request).then(res => res || fetch(e.request)));
});