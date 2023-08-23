self.addEventListener('install', evt => {
	console.log('install');
	self.skipWaiting();
	evt.waitUntil(
		caches.open('myGpsCache4').then(cache => {
			console.log('open cache');
			cache.addAll([
				'index.html',
				'index.php',
				'index.js',
				'manifest.json',
				/*OTHER_FILES*/
			]);
		})
		.catch(err => console.error(err))
	);
});

// Claim control instantly
self.addEventListener('activate', () => {
	console.log('activate');
	self.clients.claim();
});

// Load with network first, fallback to cache if offline
self.addEventListener('fetch', evt => {
	//console.log('fetch ' + evt.request.url);
	return evt.respondWith(
		fetch(evt.request).catch(() => {
			console.log('catch ' + evt.request.url);
			caches.match(evt.request);
		})
	);
});