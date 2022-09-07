<?php
error_reporting(E_ALL);
ini_set('display_errors','on');

header('Content-Type: application/javascript');
header('Cache-Control: no-cache');

include ('identification.js.php');

// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the service-worker source md5 is different

//TODO GPS parameter name & favicon (for GPS appli)
?>
self.addEventListener('install', evt => {
	console.log('PWA SW install ' + evt.target.location + ' ' + myolSWbuild);

	// Clean cache when PWA install or upgrades
	caches.delete('myGpsCache')
		.then(console.log('myGpsCache deleted'));

	// Create & populate the cache
	evt.waitUntil(
		caches.open('myGpsCache')
		.then(cache => cache.addAll(myolGPXfiles)
			.then(console.log('myGpsCache created, ' + myolGPXfiles.length + ' files added'))
		)
	);
});

// Cache all used files
self.addEventListener('fetch', evt =>
	evt.respondWith(
		caches.match(evt.request)
		.then(found => {
			if (found) {
				//console.log('found ' + evt.request.url)
				return found;
			} else
				return fetch(evt.request).then(response =>
					caches.open('myGpsCache')
					.then(cache => {
						//console.log(response.type + ' ' + evt.request.url)
						cache.put(evt.request, response.clone());
						return response;
					})
				)
		})
	)
);