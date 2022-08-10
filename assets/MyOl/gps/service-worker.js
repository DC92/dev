// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the remote service-worker source md5 is different

// The scope is set to the directory where the service worker script is located.
self.addEventListener('install', evt => {
	evt.waitUntil(
		caches.open('myGpsCache').then(cache => {
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