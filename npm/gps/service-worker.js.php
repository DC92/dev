<?php
header("Content-Type: application/javascript");

// Display the last modified filetime
$ft = 0;
foreach (array_merge(glob("*"), glob("*/*"), glob("../dist/*")) as $f) {
    $ft = max($ft, filemtime($f));
}

// Add this in the service-worker
date_default_timezone_set("Europe/Paris");
echo date("// r\n\n", $ft) . file_get_contents("service-worker.js");
