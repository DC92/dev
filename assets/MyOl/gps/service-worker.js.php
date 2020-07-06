<?php
header('Content-Type: application/javascript');

$service_worker = file_get_contents ('service-worker.js');
$service_worker = str_replace (["\n", "\t"], ['!n', '!t'], $service_worker);

/*
// Update service worker file name
$service_worker = str_replace (
	'service-worker.js',
	$_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['SERVER_NAME'].$_SERVER['SCRIPT_NAME'].(isset ($_SERVER['QUERY_STRING']) ? '?'.$_SERVER['QUERY_STRING'] : ''),
//	'service-worker.js.php'.		(isset ($_GET['gpx']) ? '?gpx='.$_GET['gpx'] : ''),
	$service_worker
);
*/

// Revision of list of cached files
$service_worker = preg_replace_callback(
	'/\[(.*)\]/',
	function ($matches) {
		// List of files in service-worker.js
		$files = explode (',', str_replace (['!n', '!t', '\''], '', $matches[1]));

		// Add list of .gpx files
		if (isset ($_GET['gpx']))
			$files = array_merge ($files, glob ($_GET['gpx'].'*.gpx'));

		$r = '';
		foreach ($files AS $f)
			if ($f) // Avoid last , in []
				$r .= "\n\t\t\t\t'$f', // " .md5_file ($f);

		return "[$r\n\t\t\t]";
	},
	$service_worker
);

$service_worker = str_replace (['!n', '!t'], ["\n", "\t"], $service_worker);
echo $service_worker;