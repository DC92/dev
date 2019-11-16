<!DOCTYPE html>
<!--
This software is a progressive web application (PWA)
It's composed as a basic web page but includes many services as
data storage that make it as powerfull as an installed mobile application
See https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps

The map is based on https://openlayers.org/
with some personal additions https://github.com/Dominique92/MyOl
© Dominique Cavailhez 2017
-->
<html>
<head>
	<title>Rando</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="epgv.png" />

	<!-- Openlayers -->
	<link href="MyOl/ol/ol.css?<?=filemtime('MyOl/ol/ol.css')?>" type="text/css" rel="stylesheet">
	<script src="MyOl/ol/ol.js?<?=filemtime('MyOl/ol/ol.js')?>"></script>

	<!-- My Openlayers -->
	<link href="MyOl/myol.css?<?=filemtime('MyOl/myol.css')?>" type="text/css" rel="stylesheet">
	<script src="MyOl/myol.js?<?=filemtime('MyOl/myol.js')?>"></script>

	<!-- This app -->
	<!-- ref="index.php" (for cached file list) -->
	<link href="index.css?<?=filemtime('index.css')?>" type="text/css" rel="stylesheet">
	<script defer="defer" src="index.js?<?=filemtime('index.js')?>"></script>
	<link rel="manifest" href="manifest.json">
	<!-- ref="service-worker.php" (for cached file list) -->

	<script>
		var registrationDate = ' <?=date('md-Hi')?>-',
			trace = '<?=array_keys($_GET)[0]?>';
	</script>
</head>

<body>
	<div id="liste">
		<h3>RANDONNÉES DE L'EPGV 92</h3>
		<p>Cliquez sur le nom de la trace pour l'afficher :</p>
		<ul>
		<?php
			$gpxs = glob ('gpx/*.gpx');
			foreach ($gpxs AS $gpx) { ?>
				<li>
					<a onclick="addLayer(this.text)" title="Cliquer pour afficher la trace">
						<?=ucfirst(pathinfo($gpx,PATHINFO_FILENAME))?>
					</a>
					<a href="<?=$gpx?>">
						<img src="gpx.png" title="Charger le fichier GPX" />
					</a>
				</li>
		<?php } ?>
		</ul>
		<p>Puis sur la cible pour afficher votre position.</p>
		<br/>
	</div>

	<div id="map"></div>
</body>
</html>