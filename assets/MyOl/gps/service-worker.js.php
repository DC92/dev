<?php
require_once ('functions.php');

header('Content-Type: application/javascript');

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');
header('Service-Worker-Allowed: /');

// Calculate a key depending on the delivery (Total byte size of cached files)
$versionTag = 0;
foreach (glob ("{../*,../*/*,$url_path*}", GLOB_BRACE) as $f)
	$versionTag += filemtime ($f);

// Read service worker & replace some values
$serviceWorkerCode = read_replace (
	'service-worker.js', [
		'index.html' => $url_path.'index.php',
		'manifest.json' => 'manifest.json.php',
		'myGpsCache' => 'myGpsCache_'.$versionTag,
	]
);

// Add GPX files in the url directory to the list of files to cache
foreach (glob ($url_path.'*.gpx') as $gf) {
	$serviceWorkerCode = str_replace (
		"addAll([",
		"addAll([\n\t\t\t\t'$gf',",
		$serviceWorkerCode
	);
}

echo $serviceWorkerCode;