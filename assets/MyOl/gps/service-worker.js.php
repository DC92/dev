<?php
require_once ('functions.php');

header('Content-Type: application/javascript');

// Check new version each time the url is called
header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');
header('Service-Worker-Allowed: /');

// Calculate a key depending on the delivery (Total byte size of cached files)
$version_tag = 0;
foreach (array_merge (glob ('../*'), glob ('../*/*')) as $f)
	$version_tag += filesize ($f);

$root_dirs = explode ('/', $_SERVER['HTTP_REFERER']);
$script_dirs = explode ('/', $_SERVER['SCRIPT_URI']);
array_pop ($root_dirs); // Remove script name
array_pop ($script_dirs); // Remove script name
while (count ($root_dirs) && count ($script_dirs) && $root_dirs[0] == $script_dirs[0]) {
	array_shift ($root_dirs); // Remove common part of the paths
	array_shift ($script_dirs);
}
$root_dirs[] = ''; // Add last / if necessary
$script_dirs[] = ''; // Add last / if necessary
$url_path = str_repeat ('../', count ($script_dirs) - 1) .implode ('/', $root_dirs);

// Read service Worker
$service_worker = file_get_contents ('service-worker.js');
$service_worker = str_replace (
	['index.html', 'manifest.json', 'myGpsCache'],
	[$url_path.'index.php', 'manifest.json.php', 'myGpsCache_'.$version_tag],
	$service_worker
);

// Add GPX files in the url directory to the list of files to cache
$gpx_files = glob ($url_path.'*.gpx');
foreach ($gpx_files as $gf) {
	$version_tag += filesize ($gf);
	$service_worker = str_replace (
		"addAll([",
		"addAll([\n\t\t\t\t'$gf',",
		$service_worker
	);
}

// Output the version tag & the revised code
echo "// Version $version_tag\n\n$service_worker";