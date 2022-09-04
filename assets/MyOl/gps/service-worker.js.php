<?php
header('Content-Type: application/javascript');
header('Cache-Control: no-cache');

// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the service-worker source md5 is different

include ('version.js.php');

//TODO GPS put GPX files in cache
//TODO GPS parameter name & favicon (for GPS appli)
?>

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