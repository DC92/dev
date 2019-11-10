/**
 * This software is a progressive web application (PWA)
 * It's composed as a basic web page but includes many services as
 * data storage that make it as powerfull as an installed mobile application
 * See https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps

 * The map is based on https://openlayers.org/
 * With some personal additions https://github.com/Dominique92/MyOl
*/

// The first time a user hits the page, an install event is triggered.
// The next times an update is provided if the remote service-worker source md5 is different
self.addEventListener('install', function(e) {
	caches.delete('gpsCache');
	e.waitUntil(
		caches.open('gpsCache').then(function(cache) {
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