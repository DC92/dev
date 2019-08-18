<!DOCTYPE html>
<?php include("../config.php")?>
<html>
<head>
	<title>GPS</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="../ext/Dominique92/GeoBB/styles/chemineur/theme/images/favicon.png" />

	<!-- Openlayers -->
	<link href="../assets/MyOl/ol/ol.css?<?=md5_file('../assets/MyOl/ol/ol.css')?>" type="text/css" rel="stylesheet">
	<script src="../assets/MyOl/ol/ol.js?<?=md5_file('../assets/MyOl/ol/ol.js')?>"></script>

	<!-- Recherche par nom -->
	<link href="../assets/MyOl/geocoder/ol-geocoder.min.css?<?=md5_file('../assets/MyOl/geocoder/ol-geocoder.min.css')?>" type="text/css" rel="stylesheet">
	<script src="../assets/MyOl/geocoder/ol-geocoder.js?<?=md5_file('../assets/MyOl/geocoder/ol-geocoder.js')?>"></script>

	<!-- My Openlayers -->
	<link href="../assets/MyOl/myol.css?<?=md5_file('../assets/MyOl/myol.css')?>" type="text/css" rel="stylesheet">
	<script src="../assets/MyOl/myol.js?<?=md5_file('../assets/MyOl/myol.js')?>"></script>

	<!-- This app -->
	<link rel="manifest" href="manifest.json?<?=md5_file('manifest.json')?>">
	<!-- other ref="index.php" -->
	<!-- other ref="service-worker.js.php" -->
	<script>
		var dateGen = '<?=date('ymd-Hi')?>',
			keys = <?=json_encode($geo_keys)?>;
	</script>
	<script src="index.js?<?=md5_file('index.js')?>"></script>

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