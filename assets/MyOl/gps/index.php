<?php
//TODO faut-il le .php urlname ? dans le service-worker ?
// favicon

$manifest = file_get_contents ($gps_path.'index.html');
$basename = basename ($_SERVER['SCRIPT_NAME']);

if (isset ($title))
	$manifest = str_replace ('MyGPS', $title, $manifest); // Index.html title
$manifest = str_replace ('</title>', "</title>\n\t<base href=\"$gps_path\">", $manifest);
$manifest = str_replace ('manifest.json', 'manifest.json.php?src='.$basename, $manifest);

// For index.js
$manifest = str_replace ('index.html', $basename, $manifest);
$manifest = str_replace (
	'service-worker.js',
	'service-worker.js.php'.
		(isset ($gpx_path) ? '?gpx='.urlencode($gpx_path) : ''),
	$manifest
);

echo $manifest;