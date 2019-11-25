<!DOCTYPE html>
<!--
Progressive web application (PWA)
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<?php
	ini_set('display_errors', 1);
	ini_set('display_startup_errors', 1);
	error_reporting(E_ALL);
?>
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
	<link href="index.css?<?=filemtime('index.css')?>" type="text/css" rel="stylesheet">
	<script defer="defer" src="index.js?<?=filemtime('index.js')?>"></script>
	<link rel="manifest" href="manifest.json">
	<!-- ref="index.php" (for cached file list) -->
	<!-- ref="service-worker.php" (for cached file list) -->

	<script>
		var registrationDate = ' <?=date('md-Hi')?>-',
			trace = '<?=array_keys($_GET)[0]?>';
	</script>
</head>

<body>
	<div id="liste">
		<h3>RANDONNÉES DE L'EPGV 92</h3>
		<p>Cliquez sur le nom de la rando pour l'afficher :</p>
		<ul>
		<?php
			$gpxs = glob ('gpx/*.gpx');
			foreach ($gpxs AS $gpx) { ?>
				<li>
					<a onclick="addLayer(this.text)" title="Cliquer pour afficher la trace">
						<?=ucfirst(pathinfo($gpx,PATHINFO_FILENAME))?>
					</a>
					<a href="<?=$gpx?>" target="_blank">
						<img src="gpx.png" title="Charger le fichier GPX" />
					</a>
				</li>
		<?php } ?>
		</ul>
		<p>Cliquez sur la cible pour afficher votre position.</p>
		<br/>
	</div>

	<div id="map"></div>
</body>
</html>