<?php
header('Content-Type: application/json');

$manifest = file_get_contents ('manifest.json');

// Generate a tag depending on the files changes to reload when files changes
$tag = 0;
foreach (glob ('*') as $f)
	$tag += filesize ($f);
$manifest = str_replace ('1.0', $tag, $manifest);

if (isset ($_GET['url']))
	$manifest = str_replace ('index.html', $_GET['url'], $manifest);

echo $manifest;