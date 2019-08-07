const cacheName = 'myolStaticCache';
const dataCacheName = 'myolTileCache';
const dataUrls = ['localhost', 'c92.fr', 'DC92.github.io'];

var filesToCache = [
	'./index.html',
	'./index.js',
	'../ol/ol.css',
	'../ol/ol.js',
	'../geocoder/ol-geocoder.css',
	'../geocoder/ol-geocoder-debug.js',
	'../myol.css',
	'../myol.js'
];

self.addEventListener('install', function(e) {
	//console.log('[ServiceWorker] Install');
	e.waitUntil(
		//https://developer.mozilla.org/en-US/docs/Web/API/ExtendableEvent/waitUntil
		caches.open(cacheName).then(function(cache) {
			//console.log('[ServiceWorker] Caching app shell');
			return cache.addAll(filesToCache);
		})
	);
});

self.addEventListener('activate', function(e) {
	//console.log('[ServiceWorker] Activate');
	e.waitUntil(
		caches.keys().then(function(keyList) {
			return Promise.all(keyList.map(function(key) {
				if (key !== cacheName && key !== dataCacheName) {
					//console.log('[ServiceWorker] Removing old cache', key);
					return caches.delete(key);
				}
			}));
		})
	);
	return self.clients.claim();
});

self.addEventListener('fetch', function(e) {
	//console.log('[ServiceWorker] Fetch', e.request.url);

	if (dataUrls.some((url) => e.request.url.indexOf(url) !== -1)) {
		e.respondWith(
			caches.match(e.request).then(function(response) {
				if (!response) {
					//we don't have it cached
					return caches.open(dataCacheName).then(function(cache) {
						return fetch(e.request).then(function(response) {
							cache.put(e.request.url, response.clone());
							return response;
						});
					})
				}
				return response;
			})
		);
	} else {
		e.respondWith(
			caches.match(e.request).then(function(response) {
				return response || fetch(e.request);
			})
		);
	}

});