'use strict';

const staticCacheName = 'restaurant-reviews-v1';
var allCaches = [staticCacheName];

const urlsCached = [
  '.',
  'index.html',
  'restaurant.html',
  'styles/styles.css',
  'styles/leaflet.css',
  'styles/images/layers.png',
  'styles/images/layers-2x.png',
  'styles/images/marker-icon.png',
  'styles/images/marker-icon-2x.png',
  'styles/images/marker-shadow.png',
  'dbhelper.js',
  'scripts/main.js',
  'scripts/restaurant_info.js',
  'scripts/leaflet-src.js',
  'images/1.jpg',
  'images/2.jpg',
  'images/3.jpg',
  'images/4.jpg',
  'images/5.jpg',
  'images/6.jpg',
  'images/7.jpg',
  'images/8.jpg',
  'images/9.jpg',
  'images/10.jpg',
  'images/icons/icon-192x192.png',
  'images/icons/icon-512x512.png',
  'images/icons/favicon.ico',
  'manifest.json'
];


/* Caching files */

self.addEventListener('install', function (event) {
    event.waitUntil(
        caches.open(staticCacheName).then(function (cache) {
            return cache.addAll(urlsCached);
        })
    );
});

/* Deleting old catches */


self.addEventListener('activate', function (event) {
    event.waitUntil(caches.keys().then(function (cacheNames) {
        return Promise.all(cacheNames.filter(function (cacheName) {
            return cacheName.startsWith('restaurant-reviews-') && !allCaches.includes(cacheName);
        }).map(function (cacheName) {
            return caches['delete'](cacheName);
        }));
    }));
});



/* Fetching cached files */

self.addEventListener('fetch', function (event) {

    var requestUrl = new URL(event.request.url);
    var request = event.request;

    if (requestUrl.origin === location.origin) {
        if (requestUrl.pathname.startsWith('/restaurant.html')) {
            event.respondWith(caches.match('restaurant.html'));
        }
        /* Fetching cached images */
        if (requestUrl.pathname.startsWith('/images/')) {
            /* Replacing url of compressed images with url of cached full resolution images */
            var imgUrl = requestUrl.pathname.replace(/[0-9]00w-/, '');

            event.respondWith(caches.match(imgUrl));
        } else {
            event.respondWith(caches.match(event.request).then(function (response) {
                return response || fetch(event.request);
            }).catch(error => console.log('Following error accured: ', error)));
        }
    }

});
