<?php
header('Content-Type: application/javascript');

header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');

$service_worker = file_get_contents ('service-worker.js');

$service_worker = str_replace (
	'index.html',
	$_GET['url'],
	$service_worker
);

$service_worker = str_replace (
	'manifest.json',
	'manifest.json.php?url='.$_GET['url'],
	$service_worker
);

// Generate a tag depending on the files changes
$tag = isset ($_GET['tag']) ? $_GET['tag'] : 0;
foreach (glob ('*') as $f)
	$tag += filesize ($f);

echo '// Version '.$tag.PHP_EOL .$service_worker;