// Create/install cache
self.addEventListener('install', evt => {
	console.log('install');
	self.skipWaiting();
	evt.waitUntil(
		caches.open('Demo').then(cache => {
			console.log('open');
			cache.addAll([
				'index.html',
				'manifest.json'
				//'YOUR-STYLES.css',
				//'YOUR-SCRIPTS.js',
				//'YOUR-IMAGES.jpg'
			]);
		})
		.catch(err => console.error(err))
	);
});

// Claim control instantly
self.addEventListener('activate', evt => {
	console.log('activate');
	self.clients.claim();
});

// Load with network first, fallback to cache if offline
self.addEventListener('fetch', evt => {
	console.log('fetch');
	evt.respondWith(
		fetch(evt.request).catch(() => {
			console.log('catch');
			caches.match(evt.request);
		}));
});