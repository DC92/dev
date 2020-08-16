<?php
// Overload manifest.json with args
header('Content-Type: application/json');

$manifest = json_decode (file_get_contents ('manifest.json'), true);

$manifest = array_merge ($manifest, $_GET);

if (is_string ($manifest['icons'])) {
	$size = getimagesize ($manifest['icons']);
	$manifest['icons'] = [[
		'src' => $manifest['icons'],
		'sizes' => $size[0].'x'.$size[1],
		'type' => mime_content_type ($manifest['icons']),
	]];
}

echo json_encode ($manifest, JSON_UNESCAPED_SLASHES + JSON_PRETTY_PRINT);