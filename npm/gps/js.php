<?php
error_reporting(E_ALL);
ini_set("display_errors", "on");

header("Cache-Control: no-cache");
header("Pragma: no-cache");
header("Content-Type: application/javascript");

$script_name = array_keys($_GET)[0] . ".js";

// Display the last modified filetime to trigger the reload
date_default_timezone_set("Europe/Paris");
$last_change_time = 0;
foreach (glob("{*,*/*,../*/myol.*s,../*/*/myol.*s}", GLOB_BRACE) as $f) {
    $last_change_time = max($last_change_time, filemtime($f));
}

// List .gpx files included in the gps/... directory
$gpx_files = glob("{*.gpx,*/*.gpx}", GLOB_BRACE);

$replace = [
    "LAST_CHANGE_TIME" => date("Y-m-d H:i:s", $last_change_time),
    "[/*GPXFILES*/]" => str_replace(
        ",",
        "," . PHP_EOL,
        json_encode($gpx_files)
    ),
];

echo str_replace(
    array_keys($replace),
    array_values($replace),
    file_get_contents($script_name)
);
