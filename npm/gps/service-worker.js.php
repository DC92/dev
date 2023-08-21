<?php
header("Content-Type: application/javascript");

// Display the last modified filetime to trigger the reload
$ft = 0;
foreach (glob("{*,*/*,../*/myol.*s,../*/*/myol.*s}", GLOB_BRACE) as $f) {
    $ft = max($ft, filemtime($f));
}
date_default_timezone_set("Europe/Paris");
echo date("// Y-m-d H:i:s\n\n", $ft);

// Add the service-worker script and include the .gpx files list
$script = file_get_contents("service-worker.js");
$gpx_files = join("',\n\t\t\t\t'", glob("{*.gpx,*/*.gpx}", GLOB_BRACE));
if ($gpx_files) {
    $script = str_replace("/*OTHER_FILES*/", "'$gpx_files'", $script);
}
echo $script;
