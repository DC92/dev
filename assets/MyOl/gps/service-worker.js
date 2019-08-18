/** MyGPS ed 19081807
	https://github.com/Dominique92/MyOl
	© Dominique Cavailhez 2019

	This software is a progressive web application (PWA)
	It's composed as a basic web page but includes many services as
	data storage that make it as powerfull as an installed mobile application
	See https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps

	The map is based on https://openlayers.org/
	With some personal additions https://github.com/Dominique92/MyOl
*/

// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the remote service-worker source md5 is different
self.addEventListener('install', function(e) {
	caches.delete('myolCache');
	e.waitUntil(
		caches.open('myolCache').then(function(cache) {
			return cache.addAll([
				'favicon.png',
				'index.html',
				'index.js',
				'manifest.json',
				'service-worker.js',
				'../ol/ol.css',
				'../ol/ol.js',
				'../myol.css',
				'../myol.js'
			]);
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