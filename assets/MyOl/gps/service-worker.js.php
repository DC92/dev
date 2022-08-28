<?php
header('Content-Type: application/javascript');

// Calculate a tag depending on the last dates of the files
$tag = 0;
foreach (glob ('{../*,../../*,../*/*}', GLOB_BRACE) AS $f)
	$tag += filemtime($f);
?>
// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the service-worker source md5 is different
// Version tag <?=$tag?> 

// Get cached values
self.addEventListener('fetch', evt =>
	evt.respondWith(
		caches.match(evt.request)
		.then(found => found ||
			fetch(evt.request).then(response =>
				caches.open('myGpsCache')
				.then(cache => {
					cache.put(evt.request, response.clone());
					return response;
				})
			)
		)
	)
);