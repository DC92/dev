<?php
error_reporting(E_ALL);
ini_set('display_errors','on');

date_default_timezone_set ('Europe/Paris');

// Calculate a build number depending on the files used by the PWA
$dirs = [
	'../*/*', // root/MyOl/*/* (includes --/MyOl/gps/*)
	'../*', // root/MyOl/*
	'../../*.gpx', // root/*.gpx GPS files in the root directory
	'../../gps_addons.php', // root/config specific site in the root directory
	'../../*/gps_addons.php', // root/*/config specific site in any directory
];
$date = 0;
$gpx_files = [];
$files = glob ('{'.implode(',',$dirs).'}', GLOB_BRACE);
foreach ($files AS $filename) {
	if (is_file ($filename) && $date < filemtime ($filename))
		$date = filemtime ($filename);

	if (pathinfo($filename, PATHINFO_EXTENSION) == 'gpx')
		$gpx_files [] = $filename;
}
$myol_SW_build = date ('jMy G:i \vs', $date) .count ($files);
$myol_GPX_files = json_encode($gpx_files);
