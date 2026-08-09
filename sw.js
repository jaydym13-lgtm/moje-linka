// =========================================================================
// 🚀 SERVICE WORKER (VERZE 3.0.0 - ENTERPRISE) - 100% OFFLINE READY
// =========================================================================

const CACHE_APP = 'mojelinka-app-cache-v1';
const CACHE_PHOTOS = 'mojelinka-photos-cache-v1'; 

const CORE_URLS = [
  '/',
  '/index.html',
  '/style.css?v=3.0.0',
  '/auth.js',
  '/ui.js',
  '/render.js',
  '/compare.js',
  '/app.js',
  '/manifest.json',
  '/fonts/Oswald-Medium.ttf',
  '/fonts/Oswald-Bold.ttf',
  '/img/favicon192.png',
  '/img/favicon512.png',
  '/img/fotologoapkky.png',
  '/lib/firebase-app-compat.js',
  '/lib/firebase-auth-compat.js',
  '/lib/firebase-firestore-compat.js',
  '/lib/firebase-app-check-compat.js',
  '/lib/firebase-functions-compat.js',
  '/lib/alpine-persist.min.js',
  '/lib/alpine.min.js'
];

const PHOTO_URLS = [
  '/img/fotoburyvyhledavacnew.jpg',
  '/img/fotoampekarna.jpg',
  '/img/fotoamkynarna.jpg',
  '/img/fotoampec.jpg',
  '/img/fotoampripravna.jpg',
  '/img/fotoambaleni.jpg',
  '/img/fotodatum1radek.jpg',
  '/img/fotodatum2radky.jpg',
  '/img/fotoholacdiskv.jpg',
  '/img/fotoholac4xbezdesky.jpg',
  '/img/fotoholac4xsdeskou.jpg',
  '/img/fotoholac2xbezdesky.jpg',
  '/img/fotoholacdisk6x18.jpg',
  '/img/fotoholacdisk6x36.jpg',
  '/img/fotoalimec13kolecek.jpg',
  '/img/fotoalimec13kolecekkulata.jpg',
  '/img/fotoalimec8kolecek48mm.jpg',
  '/img/fotoalimec6kolecek.jpg',
  '/img/fotoalimec7kolecek.jpg',
  '/img/fotoalimec8kolecek.jpg',
  '/img/fotoalimec9kolecek.jpg',
  '/img/fotoalimec15kolecek.jpg'
];

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    Promise.all([
      caches.open(CACHE_APP).then(cache => {
          return Promise.allSettled(CORE_URLS.map(url => cache.add(url)));
      }),
      caches.open(CACHE_PHOTOS).then(cache => {
          return Promise.allSettled(PHOTO_URLS.map(url => cache.add(url)));
      })
    ])
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => Promise.all(
      cacheNames.map(cacheName => {
        if (cacheName !== CACHE_APP && cacheName !== CACHE_PHOTOS) {
          return caches.delete(cacheName);
        }
      })
    )).then(() => self.clients.claim()) 
  );
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('googleapis.com') || 
      event.request.url.includes('firebasedatabase.app') || 
      event.request.url.includes('google.com') ||
      event.request.url.includes('firebaseapp.com')) {
      return; 
  }

  event.respondWith(
    caches.match(event.request, { ignoreSearch: true }).then(cachedResponse => {
      if (cachedResponse) return cachedResponse;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }
        
        let responseToCache = networkResponse.clone();
        let isImage = event.request.url.match(/\.(jpg|jpeg|png|gif|webp)$/i);
        
        caches.open(isImage ? CACHE_PHOTOS : CACHE_APP).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return networkResponse;
      }).catch(() => {
        if (event.request.mode === 'navigate') {
          return caches.match('/index.html');
        }
        return new Response('Offline - obsah nenalezen', { status: 503 });
      });
    })
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});