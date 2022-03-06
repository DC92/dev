<?php
header('Content-Type: application/javascript');

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');
header('Service-Worker-Allowed: /');

// Calculate a key depending on the delivery (Total byte size of cached files)
$versionTag = 0;
foreach (glob ("{../*,../*/*,{$_GET['url_path']}*}", GLOB_BRACE) as $f)
	$versionTag += filemtime ($f);

// Read service worker & replace some values
$changes = [
	'index.html' => $_GET['url_path'].'index.php',
	'myGpsCache' => 'myGpsCache_'.$versionTag,
];

$serviceWorkerCode = str_replace (
	array_keys ($changes), $changes,
	file_get_contents ('service-worker.js')
);

// Add GPX files in the url directory to the list of files to cache
foreach (glob ($_GET['url_path'].'*.gpx') as $gf) {
	$serviceWorkerCode = str_replace (
		"addAll([",
		"addAll([\n\t\t\t\t'$gf',",
		$serviceWorkerCode
	);
}

echo $serviceWorkerCode;
