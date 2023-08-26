// Last change LAST_CHANGE_TIME
//TODO BUG content keep in cache

const cacheName = 'myGpsCache';

// Create/install cache
self.addEventListener('install', evt => {
	console.log('PWA install LAST_CHANGE_TIME');
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

// Claim control instantly
// Necessary to trigger controllerchange event
self.addEventListener('activate', () => {
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
				//console.log('PWA cache found ' + evt.request.url)
				return found;
			} else {
				return fetch(evt.request)
					.then(response => {
						//console.log('PWA fetch ' + evt.request.url)
						caches.open('myGpsCache')
							.then(cache => {

								if (evt.request.url.includes('service-worker')) //TODO TEST -> delete
									alert();

								//console.log('PWA cache ' + response.type + ' ' + evt.request.url)
								cache.put(evt.request, response);
								//		return response; //TODO BUG ne retrourne pas le fichier trouvé
							})
							.catch(err => console.error(err));
						return response.clone(); //TODO BUG ne retrourne pas le fichier trouvé
					})
					.catch(err => console.error(err));
			}
		})
		.catch(err => console.error(err))
	)
});