<?php
header('Content-Type: application/javascript');
header('Cache-Control: no-cache');

// Calculate a tag depending on the last dates of the files
$dirs = [
	'../*/*', // rep/MyOl/*/* (whose rep/MyOl/gps/*
	'../*', // rep/MyOl/*
	'../../*.gpx', // gps files in the root directory
	'../../config_gps.php', // config site dependant in the root directory
	'../../*/config_gps.php', // config site dependant in tany directory
];
$tag = 0;
foreach (glob ('{'.implode(',',$dirs).'}', GLOB_BRACE) AS $f)
	if (is_file ($f))
		$tag += filemtime ($f);

//TODO put GPX files in cache
//TODO parameter manifest name, favicon & id
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