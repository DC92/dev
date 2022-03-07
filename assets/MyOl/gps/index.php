<!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<?php
$manifest = json_decode (file_get_contents ('manifest.json'), true);
$url_path = str_replace ('../../', '.././../', @$url_path); //HACK avoid http 406 error
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);
?>
<html>
<head>
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
			scope = '<?=@$scope_path?:'./'?>',
			scriptName = 'index.php',
			mapKeys = <?=json_encode(@$mapKeys)?>;
	</script>
</head>

<body>
	<?php
	// List gpx files on the url directory
	$gpx_files = glob ('*.gpx');
	$gpx_args = $_GET ?: $gpx_files;

	// Add a gpx layer if any arguments to the url
	if (count ($gpx_args) == 1) {
		$gpx_show =
			@$gpx_args['gpx'] ?: // 1 : ?gpx=trace
			str_replace ('.gpx', '', array_values($gpx_args)[0]) ?: // 3 : 1 gpx file in the directory
			array_keys($gpx_args)[0]; // 2 : ?trace

		if (in_array ($gpx_show.'.gpx', $gpx_files)) { ?>
		<script>
			var gpxFile = '<?=$gpx_show?>.gpx';
		</script>
	<?php }
	}

	// Add a gpx layers list
	if (count ($gpx_files)) { ?>
		<div id="liste">
			<p>Cliquez sur le nom de la trace pour l'afficher :</p>
			<ul>
			<?php foreach ($gpx_files AS $gpx) { ?>
				<li>
					<a title="Cliquer pour afficher la trace"
						onclick="addLayer('<?=$gpx?>')">
						<?=ucfirst(pathinfo($gpx,PATHINFO_FILENAME))?>
					</a>
				</li>
		<?php } ?>
			</ul>
			<p>Puis sur la cible pour afficher votre position.</p>
			<p>Fermer : <a onclick="document.getElementById('liste').style.display='none'" title="Replier">&#9651;</a></p>
		</div>
	<?php } ?>

	<div id="map"></div>

	<?php // WRI
		if(file_exists ('footer.php'))
			include 'footer.php';
	?>
</body>
</html>
