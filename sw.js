const CACHE_NAME = 'dg-toolbox-v28';
const ASSETS = [
    './',
    './about.html',
    './aim-trainer.html',
    './assets/icon-192.png',
    './assets/icon-512.png',
    './assets/icon.svg',
    './base64-tool.html',
    './color-picker.html',
    './contact.html',
    './controller-tester.html',
    './crosshair-generator.html',
    './css/about-specific.css',
    './css/aim-trainer-specific.css',
    './css/base64-tool-specific.css',
    './css/color-picker-specific.css',
    './css/contact-specific.css',
    './css/controller-tester-specific.css',
    './css/crosshair-generator-specific.css',
    './css/diff-checker-specific.css',
    './css/emoji-picker-specific.css',
    './css/encrypt-decrypt-specific.css',
    './css/exif-viewer-specific.css',
    './css/grammar-fixer-specific.css',
    './css/hash-tools-specific.css',
    './css/image-compressor-specific.css',
    './css/index-specific.css',
    './css/json-formatter-specific.css',
    './css/markdown-tool-specific.css',
    './css/offline-specific.css',
    './css/password-generator-specific.css',
    './css/pdf-studio-pro-specific.css',
    './css/privacy-specific.css',
    './css/qr-code-tool-specific.css',
    './css/reaction-tester-specific.css',
    './css/regex-tester-specific.css',
    './css/sensitivity-converter-specific.css',
    './css/settings-specific.css',
    './css/style.css',
    './css/terms-specific.css',
    './css/text-summarizer-specific.css',
    './css/unit-converter-specific.css',
    './css/uuid-generator-specific.css',
    './diff-checker.html',
    './emoji-picker.html',
    './encrypt-decrypt.html',
    './exif-viewer.html',
    './googlee28439055494f527.html',
    './grammar-fixer.html',
    './hash-tools.html',
    './image-compressor.html',
    './image-to-pdf.html',
    './index.html',
    './inject_i18n.js',
    './js/aim-trainer.js',
    './js/app.js',
    './js/audio-manager.js',
    './js/base64-tool.js',
    './js/color-picker.js',
    './js/controller-tester-specific.js',
    './js/crosshair-generator-specific.js',
    './js/diff-checker.js',
    './js/emoji-data.js',
    './js/emoji-picker.js',
    './js/encrypt-decrypt.js',
    './js/exif-viewer.js',
    './js/grammar-fixer.js',
    './js/hash-tools.js',
    './js/image-compressor.js',
    './js/image-to-pdf.js',
    './js/json-formatter.js',
    './js/markdown-tool.js',
    './js/offline-specific.js',
    './js/password-generator.js',
    './js/pdf-merge.js',
    './js/pdf-split.js',
    './js/pdf-studio-pro-specific.js',
    './js/pdf-studio-pro.js',
    './js/pdf-studio-ultimate.js',
    './js/pdf-studio.js',
    './js/pdf-to-text.js',
    './js/ping-checker.js',
    './js/privacy-specific.js',
    './js/qr-code-tool.js',
    './js/reaction-tester.js',
    './js/regex-tester.js',
    './js/sensitivity-converter-specific.js',
    './js/settings.js',
    './js/text-summarizer.js',
    './js/unit-converter.js',
    './js/uuid-generator.js',
    './json-formatter.html',
    './manifest.json',
    './markdown-tool.html',
    './offline-translator.html',
    './offline.html',
    './password-generator.html',
    './pdf-merge.html',
    './pdf-split.html',
    './pdf-studio-pro.html',
    './pdf-studio.html',
    './pdf-to-text.html',
    './ping-checker.html',
    './privacy.html',
    './qr-code-tool.html',
    './reaction-tester.html',
    './regex-tester.html',
    './sensitivity-converter.html',
    './settings.html',
    './terms.html',
    './text-summarizer.html',
    './unit-converter.html',
    './uuid-generator.html',
    './vercel.json',
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Outfit:wght@500;700&family=Cairo:wght@400;600;700&family=Tajawal:wght@400;500;700&family=IBM+Plex+Sans+Arabic:wght@400;600&display=swap',
    'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
    'https://cdn.jsdelivr.net/npm/marked/marked.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js',
    'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js',
    'https://cdnjs.cloudflare.com/ajax/libs/jsdiff/5.1.0/diff.min.js'
];

// Install: Cache all assets
self.addEventListener('install', (e) => {
    self.skipWaiting(); // Force activation immediately
    e.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => cache.addAll(ASSETS))
    );
});

// Activate: Clean up old caches
self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        return caches.delete(key);
                    }
                })
            );
        }).then(() => self.clients.claim()) // Take control immediately
    );
});

// Fetch: Network First, then Cache, then Offline Fallback
self.addEventListener('fetch', (e) => {
    e.respondWith(
        fetch(e.request)
            .then(res => {
                // Update cache with new version if successful
                if (!res || res.status !== 200 || res.type !== 'basic') {
                    return res;
                }
                const resClone = res.clone();
                caches.open(CACHE_NAME).then(cache => {
                    cache.put(e.request, resClone);
                });
                return res;
            })
            .catch(() => {
                // Network failed, try cache
                return caches.match(e.request).then(catchedRes => {
                    if (catchedRes) return catchedRes;

                    // If not in cache and it's a navigation request, show offline page
                    if (e.request.mode === 'navigate') {
                        return caches.match('./offline.html');
                    }
                });
            })
    );
});
