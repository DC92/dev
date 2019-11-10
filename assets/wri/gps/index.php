<!DOCTYPE html>
<?php include('../config_privee.php')?>
<html>
<head>
	<title>GPS refuges.info</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="../images/favicon.png" />

	<!--
	OPENLAYERS ADAPTATION
	https://github.com/Dominique92/MyOl
	Dominique Cavailhez 2017
	Based on Openlayers https://openlayers.org
	-->

	<!-- Openlayers -->
	<link href="../ol/ol/ol.css?<?=filemtime('../ol/ol/ol.css')?>" type="text/css" rel="stylesheet">
	<script src="../ol/ol/ol.js?<?=filemtime('../ol/ol/ol.js')?>"></script>

	<!-- Recherche par nom -->
	<link href="../ol/geocoder/ol-geocoder.min.css?<?=filemtime('../ol/geocoder/ol-geocoder.min.css')?>" type="text/css" rel="stylesheet">
	<script src="../ol/geocoder/ol-geocoder.js?<?=filemtime('../ol/geocoder/ol-geocoder.js')?>"></script>

	<!-- My Openlayers -->
	<link href="../ol/myol.css?<?=filemtime('../ol/myol.css')?>" type="text/css" rel="stylesheet">
	<script src="../ol/myol.js?<?=filemtime('../ol/myol.js')?>"></script>

	<!-- This app -->
	<link rel="manifest" href="manifest.json">
	<script defer="defer" src="index.js?<?=filemtime('index.js')?>"></script>
	<!-- ref="index.php" (for cached file list) -->
	<!-- ref="service-worker.php" (for cached file list) -->

	<script>
		var ign_key = '<?=$config_wri['ign_key']?>',
			bing_key = '<?=$config_wri['bing_key']?>',
			dateGen = '<?=date('ymd-Hi')?>';
	</script>

	<style>
		html, body {
			margin: 0;
			padding: 0;
		}
		#map {
			width: 100vw;
			height: 100vh;
		}
	</style>
</head>
<body>
	<div id="map"></div>
</body>
</html>