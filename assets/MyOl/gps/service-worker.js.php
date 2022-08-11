<?php
header('Content-Type: application/javascript');
//TODO BUG : essaye de loader le service worker quand on revient à l'URL de base MyOl/
//TODO BUG (WRI) service-worker.js.ph…/favicon_t384.svg:1 Uncaught (in promise) TypeError: Failed to fetch

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');
header('Service-Worker-Allowed: /');

//HACK avoid http 406 error
$url_path = str_replace (':', '../', @$_GET['url_path']);

// Read service worker & replace some values
$serviceWorkerCode = file_get_contents ('service-worker.js');

// Add GPX files in the url directory to the list of files to cache
foreach (glob ($url_path.'*.gpx') as $gf) {
	$serviceWorkerCode = str_replace (
		"addAll([",
		"addAll([\n\t\t\t\t'$gf',",
		$serviceWorkerCode
	);
}

// Add date tag as arg to files to avoid caching changes
$serviceWorkerCode = preg_replace_callback(
	"/'([a-z0-9\.\/\-_]+\.[a-z]+)'/i",
	function ($matches) {
		return '"'.$matches[1].'?'.filemtime($matches[1]).'"';
	},
	$serviceWorkerCode
);

// Add non tagged index.php & favicon.png
$serviceWorkerCode = str_replace (
	"addAll([",
	"addAll([\n\t\t\t\t'index.php',\n\t\t\t\t'favicon.png',",
	$serviceWorkerCode
);

// Display code
echo $serviceWorkerCode;
