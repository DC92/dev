// Last change LAST_CHANGE_TIME

const cacheName = 'myGpsCache';

// Create/install cache
self.addEventListener('install', evt => {
	console.log('PWA install');
	caches.delete(cacheName)
		.then(console.log(cacheName + ' deleted'))
		.catch(err => console.error(err));
	evt.waitUntil(
		caches.open(cacheName)
		.then(cache => {
			console.log('PWA open cache ' + cacheName);
			cache.addAll([ /*GPXFILES*/ ])
				.then(console.log('PWA end cache.addAll'))
				.catch(err => console.error(err));
		})
		.catch(err => console.error(err))
	);
});

// Claim control instantly
self.addEventListener('activate', evt => {
	console.log('PWA activate');
	self.clients.claim()
		.then(console.log('PWA end clients.claim'))
		.catch(err => console.error(err));
});

// Cache all used files
self.addEventListener('fetch', evt => {
	//console.log('PWA fetch ' + evt.request.url);
	evt.respondWith(
		caches.match(evt.request)
		.then(found => {
			if (found) {
				console.log('found ' + evt.request.url)
				return found;
			} else {
				return fetch(evt.request)
					.then(response => {
						caches.open('myGpsCache')
							.then(cache => {
								console.log(response.type + ' ' + evt.request.url)
								cache.put(evt.request, response.clone());
								return response;
							})
							.catch(err => console.error(err));
					})
					.catch(err => console.error(err));
			}
		})
		.catch(err => console.error(err))
	)
});