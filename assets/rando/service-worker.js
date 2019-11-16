// The first time a user hits the page, an install event is triggered
// The next times an update is provided if the remote service-worker source md5 is different
self.addEventListener('install', function(e) {
	caches.delete('randoCache');
	e.waitUntil(
		caches.open('randoCache').then(function(cache) {
			return cache.addAll(cachedFiles);
		})
	);
});

// Performed each time an URL is required before access to the internet
// Provides cached app file if any available
self.addEventListener('fetch', function(e) {
	e.respondWith(
		caches.match(e.request).then(function(response) {
			return response || fetch(e.request);
		})
	);
});