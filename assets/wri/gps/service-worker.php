<?php
// Set no cache for immediate check of updating
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Content-Type: application/javascript');

// List of file & filemtime that need to be cached
$index_file = $_SERVER['REQUEST_SCHEME'].'://'.$_SERVER['HTTP_HOST'].pathinfo ($_SERVER['PHP_SELF'], PATHINFO_DIRNAME).'/index.php';
preg_match_all ('/(ref|src)="([^"]+)"/', file_get_contents ($index_file), $app_files);

echo "const cachedFiles = [\n";
foreach ($app_files[2] AS $f)
	echo "\t'$f', // ".filemtime($f)."\n";
echo "];\n\n";

include ('service-worker.js');
?>