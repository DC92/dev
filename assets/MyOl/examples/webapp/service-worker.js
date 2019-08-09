const cacheName = 'myolStaticCache';
const dataCacheName = 'myolTileCache';

//TODO ARCHI soit récupérer url, soit laisser ouvert
const dataUrls = ['localhost', 'github.io', 'dc9.fr', 'chemineur.fr', 'refuges.info', 'alpages.info'];

var filesToCache = [
	'./favicon.png',
	'./index.html',
	'../../ol/ol.css',
	'../../ol/ol.js',
	'../../myol.css',
	'../../myol.js'
];

// The first time a user hits the page an install event is triggered.
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

// The method is enabled to remove old caches
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

/* The event.respondWith() method tells the browser to evaluate the result of the event in the future.
   caches.match(event.request) takes the current web request that triggered the fetch event and looks in the cache for a resource that matches.
   The match is performed by looking at the URL string.
   The match method returns a promise that resolves even if the file is not found in the cache. 
*/
self.addEventListener('fetch', function(e) {
	//console.log('[ServiceWorker] Fetch', e.request.url);

/*	if (dataUrls.some((url) => e.request.url.indexOf(url) !== -1)) {
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
	} else */ {
		e.respondWith(
			caches.match(e.request).then(function(response) {
				return response || fetch(e.request);
			})
		);
	}
});