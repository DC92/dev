<!DOCTYPE html>
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
	<link href="favicon.png" rel="icon" type="image/png" />
	<link href="favicon.png" rel="apple-touch-icon" />

	<!-- Openlayers -->
	<link href="../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link  href="../myol.css" type="text/css" rel="stylesheet">
	<script src="../myol.js"></script>

	<!-- This app -->
	<link href="index.css" type="text/css" rel="stylesheet">
	<script src="index.js" defer="defer"></script>
</head>

<body>
	<?php
	// List gpx files on the url directory
	$gpx_files = glob ('../../*.gpx');
	if ($gpx_files) { ?>
		<script>
			const gpxFiles = <?=strtolower(str_replace('.gpx','',json_encode($gpx_files)))?>;
		</script>
		<div id="gps-trace-list">
			<p>Cliquez sur une trace pour l'afficher :</p>
			<?php foreach ($gpx_files AS $gpx) { ?>
				<a title="Cliquer pour afficher la trace"
					onclick="addGpxLayer('<?=pathinfo($gpx,PATHINFO_FILENAME)?>')">
					<?=ucfirst(str_replace('_',' ',pathinfo($gpx,PATHINFO_FILENAME)))?>
				</a>
			<?php }
			if ($_GET) { ?>
				<br /><a href=".">Effacer les traces</a>
			<?php } ?>
		</div>
	<?php } ?>

	<div id="gps-help">
		<p>Pour utiliser les cartes et le GPS hors réseau,
			vous pouvez installer ce logiciel
			et mettre des parties de cartes en cache.</p>
		<hr /><p><u>Avant le départ:</u></p>
		<p>- Explorateur -> options -> ajoutez à l'écran d'accueil (ou: installer)</p>
		<p>Pour mémoriser un fond de carte:</p>
		<p>- Choisissez un fond de carte</p>
		<p>- Placez-vous au point de départ de votre randonnée</p>
		<p>- Zoomez au niveau le plus détaillé que vous voulez mémoriser</p>
		<p>- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles</p>
		<p>- Recommencez avec les fonds de cartes que vous voulez mémoriser</p>
		<p>* Toutes les dalles visualisées une fois seront conservées
			dans le cache de l'explorateur quelques jours et
			pourront être affichées même hors de portée du réseau</p>
		<hr /><p><u>Hors réseau :</u></p>
		<p>- Ouvrez le marque-page ou l'application</p>
		<p>- Si vous voulez suivre une trace du serveur,
			choisissez là en cliquant sur &#x1F6B6;</p>
		<p>- Si vous avez un fichier .gpx dans votre mobile,
			visualisez-le en cliquant sur &#x1F4C2;</p>
		<p>- Lancez la localisation en cliquant sur &#x2295;</p>
		<hr />
		<p>* Fonctionne bien sur Android avec Chrome, Edge, Brave, Samsung Internet,
			fonctions réduites avec Firefox & Safari</p>
		<p>* Cette application ne permet pas de visualiser ou d'enregistrer le parcours</p>
		<p>* Aucune donnée ni géolocalisation n'est remontée ni mémorisée</p>
		<hr /><p>Mise à jour: <?=date('d M Y H:i:s')?> @<?=$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']?>
		</p>
	</div>

	<div id="map"></div>

	<?php // For WRI
		if(file_exists ('footer.php'))
			include 'footer.php';
	?>
</body>
</html>