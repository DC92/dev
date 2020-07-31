<!DOCTYPE html>
<html>
<head>
	<!--
	© Dominique Cavailhez 2019
	https://github.com/Dominique92/
	Based on https://openlayers.org
	-->

<?php
	// Recherche d'un eventuel path relatif entre le script et le package
	$script_filename = pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_DIRNAME);
	$scripts = explode ('/', $script_filename);
	$dir = explode ('/', str_replace ('\\', '/', __DIR__));
	$pre = [];

	foreach ($scripts AS $k=>$v)
		if ($dir[$k] == $v)
			unset ($dir[$k]);
		else
			$pre[] = '..';

	$gps_path = implode ('/', array_merge ($pre, $dir));
	if (count ($dir))
		echo "\t<base href=\"$gps_path/\" />\n";

	$favicons = glob('favicon.*');
	if (count ($favicons))
		$favicon = pathinfo ($_SERVER['SCRIPT_NAME'], PATHINFO_DIRNAME).'/'.$favicons[0];
?>
	<link rel="manifest" href="manifest.json.php?url=<?=$_SERVER['SCRIPT_NAME']?>">

	<title><?=isset($title)?$title:'MyGPS'?></title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="<?=isset($favicon)?$favicon:'favicon.png'?>" />

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
		var service_worker = "service-worker.js.php?url=<?=$_SERVER['SCRIPT_NAME']?>",
			keys = {
				ign: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
				thunderforest: 'ee751f43b3af4614b01d1bce72785369', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
				bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
				// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
			};
	</script>
	<link href="index.css" type="text/css" rel="stylesheet">
	<script src="index.js" defer="defer"></script>
</head>

<body>
	<div id="liste">
		<p>Cliquez sur le nom de la trace pour l'afficher :</p>
		<ul>
		<?php foreach (glob ('*.gpx') AS $gpx) { ?>
				<li>
					<a title="Cliquer pour afficher la trace"
						onclick="addLayer('<?=dirname($_SERVER['SCRIPT_NAME']).'/'.$gpx?>')">
						<?=ucfirst(pathinfo($gpx,PATHINFO_FILENAME))?>
					</a>
				</li>
		<?php } ?>
		</ul>
		<p>Ou fermer : <a onclick="document.getElementById('liste').style.display='none'" title="Replier">&#9651;</a></p>
		<br/>
		<p>Puis sur la cible pour afficher votre position.</p>
	</div>

	<div id="map"></div>
</body>
</html>