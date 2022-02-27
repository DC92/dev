<?php
//$_SERVER['HTTP_REFERER']= 'https://c92.fr/test/gps/MyOl/wri/index.php';

//TODO BUG n'a pas de reffere quand il s'agit d'installer => Voir ?arg

require_once ('functions.php');
$index = $url_path.'index.php'; // Protect $url_path from erasing

// Get $title
ob_start(); // Don't display the next
include ($index);
ob_end_clean();

echo read_replace (
	'manifest.json', [
		'index.html' => $index,
		'My GPS' => isset($title) ? $title : 'My GPS',
	]	
);
