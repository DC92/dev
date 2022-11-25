<?php
// Calculate a build number depending on the files used by the PWA
$dirs = [
	$start_path.'*', // Files in the start dir
	$myol_path.'../*', // MyOl/*
	$myol_path.'../*/*', // MyOl/*/* (includes MyOl/gps/*)
];

date_default_timezone_set ('Europe/Paris');
$date = 0;
$gpx_files = [];
$files = glob ('{'.implode(',',$dirs).'}', GLOB_BRACE);

// List files to cache
foreach ($files AS $filename) {
	if (is_file ($filename) && $date < filemtime ($filename))
		$date = filemtime ($filename);

	if (pathinfo($filename, PATHINFO_EXTENSION) == 'gpx')
		$gpx_files[] = $filename;
}

//TODO Gps avec argument pour rando

// Build version tag
$build_date = date ('jMy-G:i.\vs', $date) .count ($files);
