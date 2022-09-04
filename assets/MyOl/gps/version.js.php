<?php
header('Cache-Control: no-cache');

// Calculate a version number depending on the files used by the PWA
$dirs = [
	'../*/*', // root/MyOl/*/* (includes --/MyOl/gps/*)
	'../*', // root/MyOl/*
	'../../*.gpx', // root/*.gpx GPS files in the root directory
	'../../gps_addons.php', // root/config specific site in the root directory
	'../../*/gps_addons.php', // root/*/config specific site in any directory
];
$date = 0;
$files = glob ('{'.implode(',',$dirs).'}', GLOB_BRACE);
foreach ($files AS $file)
	if (is_file ($file) && $date < filemtime ($file))
		$date = filemtime ($file);

echo 'var myolSWversion = "'.date('jMy G:i \vs',$date).count($files).'";';
