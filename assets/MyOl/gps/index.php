<!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<?php
// Scan involved directories
$url_dirs  = explode ('/', str_replace ('index.php', '', $_SERVER['SCRIPT_FILENAME']));
$script_dirs  = explode ('/', str_replace ('\\', '/', __DIR__ .'/'));

// Remove common part of the paths (except the last /)
while (count ($url_dirs ) > 1 && count ($script_dirs ) > 1 &&
	$url_dirs [0] == $script_dirs [0]) {
	array_shift ($url_dirs );
	array_shift ($script_dirs );
}

// Url path from service-worker
$url_path = str_replace ('../', ':', //HACK avoid http 406 error
	str_repeat ('../', count ($script_dirs ) - 1) .implode ('/', $url_dirs));

// Gps scripts path from url
$script_path = str_repeat ('../', count ($url_dirs ) - 1) .implode ('/', $script_dirs);

// Get manifest info
$manifest = json_decode (file_get_contents ('manifest.json'), true);
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);
?>
<html>
<head>
	<meta name="viewport" content="width=device-width, user-scalable=no" />
	<title><?=$manifest['name']?></title>
	<link href="manifest.json" rel="manifest">

	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link href="<?=$icon_file?>" rel="icon" type="image/<?=$icon_type?>" />
	<link href="<?=$icon_file?>" rel="apple-touch-icon" />

	<!-- Openlayers -->
	<link href="<?=@$script_path?>../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="<?=@$script_path?>../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link href="<?=@$script_path?>../myol.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>../myol.js"></script>

	<!-- This app -->
	<link href="<?=@$script_path?>index.css" type="text/css" rel="stylesheet">
	<script src="<?=@$script_path?>index.js" defer="defer"></script>
	<script>
		var serviceWorkerName = '<?=@$script_path?>service-worker.js.php?url_path=<?=$url_path?>',
			scope = '<?=$manifest['scope']?>',
			scriptName = 'index.php',
			mapKeys = <?=json_encode(@$mapKeys)?>;
	</script>
</head>

<body>
	<?php
	// List gpx files on the url directory
	$gpx_files = glob ('*.gpx');
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
		<p>Pour utiliser les cartes et le GPS hors réseau:</p>
		<p>Avant le départ:</p>
		<p>- Explorateur -> options -> ajouter à l‘écran d‘accueil (ou: installer)</p>
		<p>- Choisissez une couche de carte</p>
		<p>- Placez-vous au point de départ de votre randonnée</p>
		<p>- Zoomez au niveau le plus détaillé que vous voulez mémoriser</p>
		<p>- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles</p>
		<p>- Recommencez avec les couches de cartes que vous voulez mémoriser</p>
		<p>* Toutes les dalles visualisées une fois seront conservées dans le cache de l‘explorateur quelques jours</p>
		<p>Hors réseau :</p><hr />
		<p>- Ouvrez le marque-page ou l'application</p>
		<p>- Choisissez une trace du serveur en cliquant sur &#x1F6B6;</p>
		<p>- Si vous avez un fichier .gpx dans votre mobile, visualisez-le en cliquant sur &#x1F4C2;</p>
		<p>- Lancez la localisation en cliquant sur &#x2295;</p><hr />
		<p>* Fonctionne bien sur Android avec Chrome, Edge, Samsung Internet, fonctions réduites avec Firefox & Safari</p>
		<p>* Cette application ne permet pas d‘enregistrer le parcours</p>
		<p>* Aucune donnée ni géolocalisation n‘est remontée ni mémorisée</p>
	</div>

	<div id="map"></div>

	<?php // For WRI
		if(file_exists ('footer.php'))
			include 'footer.php';
	?>
</body>
</html>
