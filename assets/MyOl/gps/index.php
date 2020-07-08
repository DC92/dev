<!DOCTYPE html>
<html>
<head>
	<!--
	© Dominique Cavailhez 2019
	https://github.com/Dominique92/MyOl
	Based on https://openlayers.org
	-->
	<?php
		// Get the script to be referenced in the manifest
		$basename = basename ($_SERVER['SCRIPT_NAME']);

		// Generate a tag depending on the files changes
		$tag = 0;
		foreach (glob ('*') as $f)
			$tag += filesize ($f);
	?>

	<title>MyGPS</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="favicon.png" />

	<!-- Openlayers -->
	<link href="../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link href="../myol.css" type="text/css" rel="stylesheet">
	<script src="../myol.js"></script>

	<!-- This app -->
	<script>
		var service_worker = "service-worker.js.php?url=<?=$basename?>&tag=<?=$tag?>";
	</script>

	<link rel="manifest" href="manifest.json.php?url=<?=$basename?>">
	<link href="index.css" type="text/css" rel="stylesheet">
	<script src="index.js" defer="defer"></script>
</head>

<body>
	<div id="map"></div>
</body>
</html>