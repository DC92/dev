<?php
	header('Cache-Control: no-cache');
?><!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org

This is the entry for the servers that don't run PHP
Install the service but upgrades the files only after the caches delay
-->
<html>
<head>
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<link href="manifest.json" rel="manifest">

	<title>My GPS</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0,
		maximum-scale=1.0, user-scalable=no" />
	<link href="favicon.png?<?=filemtime('favicon.png')?>" rel="icon" type="image/png" />
	<link href="favicon.png?<?=filemtime('favicon.png')?>" rel="apple-touch-icon" />

	<!-- Openlayers -->
	<link href="../ol/ol.css?<?=filemtime('../ol/ol.css')?>" type="text/css" rel="stylesheet">
	<script src="../ol/ol.js?<?=filemtime('../ol/ol.js')?>"></script>

	<!-- Recherche par nom -->
	<link href="../geocoder/ol-geocoder.min.css?<?=filemtime('../geocoder/ol-geocoder.min.css')?>" type="text/css" rel="stylesheet">
	<script src="../geocoder/ol-geocoder.js?<?=filemtime('../geocoder/ol-geocoder.js')?>"></script>

	<!-- My Openlayers -->
	<link  href="../myol.css?<?=filemtime('../myol.css')?>" type="text/css" rel="stylesheet">
	<script src="../myol.js?<?=filemtime('../myol.js')?>"></script>

	<!-- This app -->
	<link  href="index.css?<?=filemtime('index.css')?>" type="text/css" rel="stylesheet">
	<script src="version.js.php"></script>
	<script src="index.js?<?=filemtime('index.js')?>"></script>
</head>

<body>
	<?php // Add map specificities
	foreach (glob ('{../../gps_addons.php,../../*/gps_addons.php}', GLOB_BRACE) AS $f)
		include ($f);
	?>

	<div id="map"></div>
</body>
</html>