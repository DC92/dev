// Last change LAST_CHANGE_TIME

const cacheName = 'myGpsCache';

// Create/install cache
self.addEventListener('install', evt => {
	console.log('PWA install LAST_CHANGE_TIME');
	self.skipWaiting(); // Immediately activate the SW & trigger controllerchange
	caches.delete(cacheName)
		.then(console.log('PWA ' + cacheName + ' deleted'))
		.catch(err => console.error(err));
	evt.waitUntil(
		caches.open(cacheName)
		.then(cache => {
			console.log('PWA open cache ' + cacheName);
			cache.addAll([ /*GPXFILES*/ ]) // List of files not automatically opened
				.then(console.log('PWA end cache.addAll'))
				.catch(err => console.error(err));
		})
		.catch(err => console.error(err))
	);
});

// Cache all used files
self.addEventListener('fetch', evt => {
	//console.log('PWA fetch ' + evt.request.url);
	evt.respondWith(
		caches.match(evt.request)
		.then(found => {
			if (found) {
				//console.log('PWA cache found ' + evt.request.url)
				return found;
			} else {
				return fetch(evt.request)
					.then(response => {
						//console.log('PWA fetch ' + evt.request.url)
						caches.open(cacheName)
							.then(cache => {
								//console.log('PWA cache ' + response.type + ' ' + evt.request.url)
								// Cache every file used by the appli
								cache.put(evt.request, response);
							})
							.catch(err => console.error(err + ' ' + evt.request.url));
						return response.clone();
					})
					.catch(err => console.error(err + ' ' + evt.request.url));
			}
		})
		.catch(err => console.error(err + ' ' + evt.request.url))
	)
});