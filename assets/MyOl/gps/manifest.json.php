<?php
header('Content-Type: application/json');

$manifest = file_get_contents ('manifest.json');

if (isset ($_GET['url']))
	$manifest = str_replace ('index.html', $_GET['url'], $manifest);

if (isset ($_GET['title']))
	$manifest = str_replace ('MyGPS', $_GET['title'], $manifest);

if (isset ($_GET['favicon'])) {
	$size = getimagesize ($_GET['favicon']);
	$manifest = str_replace (
		['favicon.png', '225x225', 'image/png'],
		[$_GET['favicon'], $size[0].'x'.$size[1], mime_content_type ($_GET['favicon'])],
		$manifest
	);
}

echo $manifest;