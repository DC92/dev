<?php
include ('common.php');

// Get package info
$url_dirs  = explode ('/', str_replace ('index.php', '', $_SERVER['SCRIPT_FILENAME']));
$script_dirs  = explode ('/', str_replace ('\\', '/', __DIR__ .'/'));
// Remove common part of the paths (except the last /)
while (count ($url_dirs) > 1 && count ($script_dirs) > 1 &&
	$url_dirs [0] == $script_dirs [0]) {
	array_shift ($url_dirs);
	array_shift ($script_dirs);
}
// Gps scripts path from url
$myol_path = str_repeat ('../', count ($url_dirs) - 1) .implode ('/', $script_dirs);

// Get manifest info
$manifest = json_decode (file_get_contents ('manifest.json'), true);
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);

function fl ($filename, $path = '') {
	return implode ('', [
		(pathinfo($filename, PATHINFO_EXTENSION) == 'js' ? 'src' : 'href'),
		 '="'.$path.$filename.'?'.filemtime($path.$filename).'"',
		(pathinfo($filename, PATHINFO_EXTENSION) == 'css' ? ' type="text/css" rel="stylesheet"' : ''),
	]);
}

?><!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<html>
<head>
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<link <?=fl('manifest.json')?> rel="manifest">

	<title><?=$manifest['name']?></title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link <?=fl($icon_file)?> rel="icon" type="image/<?=$icon_type?>" />
	<link <?=fl($icon_file)?> rel="apple-touch-icon" />

	<!-- Openlayers -->
	<script <?=fl('../ol/ol.js',$myol_path)?>></script>
	<link <?=fl('../ol/ol.css',$myol_path)?>>

	<!-- Recherche par nom -->
	<script <?=fl('../geocoder/ol-geocoder.js',$myol_path)?>></script>
	<link <?=fl('../geocoder/ol-geocoder.min.css',$myol_path)?>>

	<!-- My Openlayers -->
	<script <?=fl('../myol.js',$myol_path)?>></script>
	<link <?=fl('../myol.css',$myol_path)?>>

	<!-- This app -->
	<script>
	// Vars for index.js
	var scriptPath = '<?=$myol_path?>',
		myolSWbuild = '<?=$myol_SW_build?>';
	</script>
	<script <?=fl('./index.js',$myol_path)?>></script>
	<link <?=fl('./index.css',$myol_path)?>>
</head>

<body>
	<div id="map"></div>