<?php
error_reporting(E_ALL);
ini_set('display_errors','on');

header('Cache-Control: no-cache');
header('Pragma: no-cache');

// Get manifest info
$manifest = json_decode (file_get_contents ('manifest.json'), true);
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);

// Get package info
$start_dirs  = explode ('/', str_replace ('index.php', '', $_SERVER['SCRIPT_FILENAME']));
$myol_dirs  = explode ('/', str_replace ('\\', '/', __DIR__ .'/'));
// Remove common part of the paths (except the last /)
while (count ($start_dirs) > 1 && count ($myol_dirs) > 1 &&
	$start_dirs [0] == $myol_dirs [0]) {
	array_shift ($start_dirs);
	array_shift ($myol_dirs);
}

// Url start path from service-worker
$compressed_start_path =  str_replace (['..','/'], [':',''], //HACK avoid http 406 error
	str_repeat ('../', count ($myol_dirs) - 1) .implode ('/', $start_dirs));

// Url start path from index.php
$start_path = '';

// MyOl/gps scripts path from index.php
$myol_path = str_repeat ('../', count ($start_dirs) - 1) .implode ('/', $myol_dirs);

include ('common.php');

function fl ($filename) {
	return implode ('', [
		(pathinfo($filename, PATHINFO_EXTENSION) == 'js' ? 'src' : 'href'),
		 '="'.$filename.'?'.filemtime($filename).'"',
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
	<script <?=fl($myol_path.'../ol/ol.js')?>></script>
	<link <?=fl($myol_path.'../ol/ol.css')?>>

	<!-- Recherche par nom -->
	<script <?=fl($myol_path.'../geocoder/ol-geocoder.js')?>></script>
	<link <?=fl($myol_path.'../geocoder/ol-geocoder.min.css')?>>

	<!-- My Openlayers -->
	<script <?=fl($myol_path.'../myol.js')?>></script>
	<link <?=fl($myol_path.'../myol.css')?>>

	<!-- This app -->
	<script>
	// Vars for index.js
	var myolPath = '<?=$myol_path?>',
		compressedStartPath = '<?=$compressed_start_path?>',
		myolSWbuild = '<?=$myol_SW_build?>';
	</script>
	<script <?=fl($myol_path.'./index.js')?>></script>
	<link <?=fl($myol_path.'./index.css')?>>
</head>

<body>
	<div id="map"></div>