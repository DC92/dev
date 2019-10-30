<!DOCTYPE html>
<?php include('../config_privee.php')?>
<html>
<head>
	<title>GPS refuges.info</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="../images/favicon.png" />

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
	<link rel="manifest" href="manifest.json?<?=filemtime('manifest.json')?>">
	<!-- for service-worker list ref="index.php" for -->
	<!-- for service-worker list ref="service-worker.js.php" -->
	<script>
		var dateGen = '<?=date('ymd-Hi')?>',
			keys = {
			ign: '<?=$config_wri['ign_key']?>',
			thunderforest: '<?=$config_wri['thunderforest_key']?>',
			bing: '<?=$config_wri['bing_key']?>'
		};
	</script>
	<script src="index.js?<?=filemtime('index.js')?>"></script>

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