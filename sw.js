const CACHE_NAME = 'tasbi7-offline-v2';

// فایلە سەرەکییەکان کە دەبێت خەزن ببن
const urlsToCache = [
  './',
  './index.html',
  'https://cdn.tailwindcss.com',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js'
];

// هەنگاوی یەکەم: خەزنکردنی فایلەکان لە کاتی کردنەوەی ئەپەکە
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('فایلەکان بۆ ئۆفلاین خەزن کران');
        return cache.addAll(urlsToCache);
      })
  );
});

// پاککردنەوەی کاشە کۆنەکان ئەگەر ڤێرژنەکە گۆڕا
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
});

// هەنگاوی سەرەکی: کاتێک ئینتەرنێت دەپچڕێت، داتا لە کاشەوە دەهێنێت
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // ئەگەر فایلی داواکراو لەناو مۆبایلەکە هەبوو، ئەوە بیهێنە (ئۆفلاین کار دەکات)
        if (response) {
          return response;
        }
        
        // ئەگەر نەبوو، لە ئینتەرنێتەوە دایبەزێنە و خەزنی بکە بۆ جاری داهاتوو
        return fetch(event.request).then(networkResponse => {
          // دڵنیابوونەوە لەوەی کە فایلەکە دروستە
          if(!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
             // ئەگەر لە CDNەوە بوو، هەوڵدەدات خەزنی بکات
             if (networkResponse.type === 'opaque') {
                 const responseToCache = networkResponse.clone();
                 caches.open(CACHE_NAME).then(cache => {
                     cache.put(event.request, responseToCache);
                 });
             }
             return networkResponse;
          }

          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });

          return networkResponse;
        });
      })
  );
});