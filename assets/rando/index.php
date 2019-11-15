<!DOCTYPE html>
<html>
<head>
	<title>Rando</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="favicon.png" />

	<!--
	OPENLAYERS ADAPTATION
	https://github.com/Dominique92/MyOl
	Dominique Cavailhez 2017
	Based on Openlayers https://openlayers.org
	-->

	<!-- Openlayers -->
	<link href="MyOl/ol/ol.css?<?=filemtime('MyOl/ol/ol.css')?>" type="text/css" rel="stylesheet">
	<script src="MyOl/ol/ol.js?<?=filemtime('MyOl/ol/ol.js')?>"></script>

	<!-- My Openlayers -->
	<link href="MyOl/myol.css?<?=filemtime('MyOl/myol.css')?>" type="text/css" rel="stylesheet">
	<script src="MyOl/myol.js?<?=filemtime('MyOl/myol.js')?>"></script>

	<!-- This app -->
	<link rel="manifest" href="manifest.json">
	<script defer="defer" src="index.js?<?=filemtime('index.js')?>"></script>
	<!-- ref="index.php" (for cached file list) -->
	<!-- ref="service-worker.php" (for cached file list) -->

	<script>
		var registrationDate = ' <?=date('md-Hi')?>-',
			trace = '<?=array_keys($_GET)[0]?>';
	</script>

	<style>
		html, body {
			margin: 0;
			padding: 0;
		}
		#liste h3 {
			text-align: center
		}
		#liste * {
			margin: 0;
			line-height: 1.5em;
		}
		#liste li a {
			cursor: pointer;
		}
		#map {
			width: 100vw;
			height: 100vh;
		}
	</style>
</head>

<body>
	<div id="liste">
		<h3>RANDONNÉES DE L'EPGV 92</h3>
		<p>Cliquez sur le nom de la trace pour l'afficher :</p>
		<ul>
			<?php
				$gpxs = glob ('*.gpx');
				foreach ($gpxs AS $gpx)
					echo '<li><a onclick="addLayer(this.text)" title="Cliquer pour afficher la trace">'.pathinfo($gpx,PATHINFO_FILENAME)."</a></li>\n\t\t\t";
			?>
		</ul>
		<p>Puis sur la cible pour afficher votre position.</p>
		<br/>
	</div>

	<div id="map"></div>
</body>
</html>