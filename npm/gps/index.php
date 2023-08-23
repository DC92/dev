<?php
header("Content-Type: text/html");

// Find the directory where to load the myol package
$myol_path = pathinfo(
    glob("{../*/myol.*s,../*/*/myol.*s}", GLOB_BRACE)[0],
    PATHINFO_DIRNAME
);

// List .gpx files included in the gps/... directory
$gpx_files = glob("{*.gpx,*/*.gpx}", GLOB_BRACE);

echo str_replace(
    ["service-worker.js", "../dist", "myol.js", "gpxFiles = []"],
    [
        "service-worker.js.php",
        $myol_path,
        file_exists($myol_path . "/myol-debug.js")
            ? "myol-debug.js"
            : "myol.js",
        "gpxFiles = " . json_encode($gpx_files),
    ],
    file_get_contents("index.html")
);
