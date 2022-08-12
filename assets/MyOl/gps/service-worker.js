// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the remote service-worker source md5 is different

// The scope is set to the directory where the service worker script is located.
var cacheName = 'myGpsCache';

self.addEventListener('install', evt => {
	console.log('PWA SW install');

	// Delete caches
	evt.waitUntil(
		caches.keys().then((keyList) => {
			return Promise.all(keyList.map(key => {
				console.log('PWA SW caches.delete ' + key);
				return caches.delete(key);
			}));
		})
	);

	// Reconstruct GPS cache
	evt.waitUntil(
		caches.open(cacheName).then(cache => {
			console.log('PWA SW cache.addAll ' + cacheName);
			return cache.addAll([
				'index.html',
				'index.css',
				'index.js',
				'manifest.json',
				'favicon.png',
				'../ol/ol.css',
				'../ol/ol.js',
				'../geocoder/ol-geocoder.min.css',
				'../geocoder/ol-geocoder.js',
				'../myol.css',
				'../myol.js',
			]);
		})
	);
});

// Get cached values
/*//TODO DELETE ?
self.addEventListener('fetch', evt => {
	console.log('PWA SW fetch ' + evt.request.url);
	evt.respondWith(
		caches.match(evt.request).then(found => {
			return found || fetch(evt.request).then(response => {
				return caches.open(cacheName).then(cache => {
					cache.put(evt.request, response.clone());
					return response;
				});
			});
		})
	);
});
*/