<?php
// This utility modify the service-worker.js when the package is used from another directory & with .GPX files

header('Content-Type: application/javascript');

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');
header('Service-Worker-Allowed: /');

// Read service Worker
$service_worker = file_get_contents ('service-worker.js');

// Calculate a key depending on the delivery (Total byte size of cached files)
$version_tag = 0;

// Package files
foreach (glob ('*') as $f)
	$version_tag += filesize ($f);

// Specific files
if (isset ($_GET['files'])) {
	$specific_files = explode (',', str_replace (':', '../', $_GET['files']));

	// Update version tag
	foreach ($specific_files as $f)
		$version_tag += filesize ($f);

	// Update cached file list
	$service_worker = str_replace (
		['index.html', 'manifest.json', 'favicon.png'],
		$specific_files,
		$service_worker
	);
}

// Change cache name
$service_worker = str_replace (
	'myGpsCache',
	'myGpsCache_'.md5(@$_GET['files']), // Unique name for one implementation
	$service_worker
);

// Traces in the same directory
$gpx_files = '';
if (isset ($_GET['gpx'])) {
	foreach (glob ($_GET['gpx'].'*.gpx') as $f) {
		$version_tag += filesize ($f);
		$gpx_files .= "\n\t\t\t\t'". dirname($_GET['url']) .'/'. basename($f) ."',";
	}
}

// Add gpx files to the list of files to cache
$service_worker = str_replace (
	'addAll([',
	'addAll(['.$gpx_files,
	$service_worker
);

// Output the version tag & the revised code
echo "var version_tag = '$version_tag';

$service_worker";