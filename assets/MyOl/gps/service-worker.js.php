<?php
header('Content-Type: application/javascript');

header('Expires: '.date('r'));
header('Cache-Control: no-cache');
header('Pragma: no-cache');

// Generate a tag depending on the files changes
$tag = isset ($_GET['tag']) ? $_GET['tag'] : 0;
foreach (glob ('*') as $f)
	$tag += filesize ($f);

echo '// Version '.$tag.PHP_EOL
	.file_get_contents ('service-worker.js');