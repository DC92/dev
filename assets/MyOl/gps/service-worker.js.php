<?php
header('Content-Type: application/javascript');

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');

$version_tag = 0; // Total byte size of files
$gpx_files = '';
if (isset ($_GET['gpx'])) {
	foreach (glob ($_GET['gpx'].'*.gpx') as $f) {
		$version_tag += filesize ($f);
		$gpx_files .= "\n\t\t\t\t'". dirname($_GET['url']) .'/'. basename($f) ."',";
	}
}
// Package files
foreach (glob ('*') as $f)
	$version_tag += filesize ($f);

// Service Worker
$service_worker = file_get_contents ('service-worker.js');

// Add gpx files to the list of files to cache
$service_worker = str_replace (
	'addAll([',
	'addAll(['.$gpx_files,
	$service_worker
);

$service_worker = str_replace (
	'index.html',
	$_GET['url'],
	$service_worker
);

echo "// Version $version_tag\n$service_worker";