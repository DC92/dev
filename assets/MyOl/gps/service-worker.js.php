<?php
header('Content-Type: application/javascript');
header('Cache-Control: no-cache');

// Calculate a tag depending on the last dates of the files
$dirs = [
//TODO tag = last file date with format
	'../*/*', // root/MyOl/*/* (includes --/MyOl/gps/*)
	'../*', // root/MyOl/*
	'../../*.gpx', // root/*.gpx GPS files in the root directory
	'../../gps_addons.php', // root/config specific site in the root directory
	'../../*/gps_addons.php', // root/*/config specific site in any directory
];
$date = 0;
foreach (glob ('{'.implode(',',$dirs).'}', GLOB_BRACE) AS $f)
	if (is_file ($f) && $date <filemtime ($f))
		$date =filemtime ($f);

$tag = date('ymdHis',$date);

//TODO GPS put GPX files in cache
//TODO GPS parameter manifest name, favicon & id (for GPS appli)
//TODO display version info
?>
// The first time a user hits the page an install event is triggered.
// The other times an update is provided if the service-worker source md5 is different
console.log('PWA version <?=$tag?>');

self.addEventListener('install', async function() {
	// Clean & reconstruct GPS cache
	await caches.delete('myGpsCache')
		.then(() => console.log('PWA myGpsCache deleted'));

	await caches.open('myGpsCache')
		.then(cache =>
			cache.addAll([
				'favicon.png',
			])
			.then(() => console.log('PWA myGpsCache files added'))
		)
		.then(() => console.log('PWA myGpsCache opened'));
});

// Get cached values
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