const CACHE_NAME = 'athar-kids-v1';
const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    'https://fonts.googleapis.com/css2?family=Amiri:wght@400;700&family=Tajawal:wght@400;500;700;800&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://fonts.quran.com/quran/fonts/v1/uthmanic_hafs.woff2'
];

// تثبيت الـ Service Worker وتخزين الملفات الأساسية
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            return cache.addAll(STATIC_ASSETS);
        })
    );
    self.skipWaiting();
});

// تفعيل وتحديث الكاش إذا تغير الإصدار
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cache) => {
                    if (cache !== CACHE_NAME) {
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
});

// استراتيجية جلب البيانات (Stale-While-Revalidate)
self.addEventListener('fetch', (event) => {
    // تجاهل طلبات الصوتيات (mp3) من الكاش المباشر لتجنب امتلاء الذاكرة
    if (event.request.url.includes('.mp3')) {
        return; 
    }

    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            const fetchPromise = fetch(event.request).then((networkResponse) => {
                // تحديث الكاش بالنسخة الجديدة من الإنترنت
                if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
                    const responseToCache = networkResponse.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(event.request, responseToCache);
                    });
                }
                return networkResponse;
            }).catch(() => {
                // في حالة انقطاع الإنترنت، يتم إرجاع النسخة المخزنة
            });
            
            return cachedResponse || fetchPromise;
        })
    );
});