<!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org
-->
<?php
//	This is the entry for the apache servers running PHP
//	This installs the service and upgrades the files each time the page is reloaded

	// Calculate relative paths between script & package
	$dirs = explode ('/', str_replace ('\\', '/', __DIR__));
	$scripts = explode ('/', pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_DIRNAME));
	// Remove common part of the path
	foreach ($dirs AS $k=>$v)
		if (@$scripts[$k] == $v) {
			unset ($dirs[$k]);
			unset ($scripts[$k]);
		}
	$dirs[] = $scripts[] = '';
	$gps_path = str_repeat ('../', count ($scripts) - 1) .implode ('/', $dirs);
	$script_path = str_repeat ('../', count ($dirs) - 1) .implode ('/', $scripts);

	$manifest = $gps_path.'manifest.json.php?url='.$_SERVER['SCRIPT_NAME'];
	if (isset ($title))
		$manifest .= '&title='.$title;
	if (isset ($favicon))
		$manifest .= '&favicon='.$script_path.$favicon;
	else
		$favicon = $gps_path.'favicon.png';

	$gpx_files = glob ('*.gpx');
?>
<html>
<head>
	<link rel="manifest" href="<?=$manifest?>">

	<title><?=isset($title)?$title:'MyGPS'?></title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="<?=mime_content_type($favicon)?>" href="<?=$favicon?>" />

	<!-- Openlayers -->
	<link href="<?=$gps_path?>../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="<?=$gps_path?>../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="<?=$gps_path?>../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="<?=$gps_path?>../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link href="<?=$gps_path?>../myol.css" type="text/css" rel="stylesheet">
	<script src="<?=$gps_path?>../myol.js"></script>

	<!-- This app -->
	<script>
		var service_worker = "<?=$gps_path?>service-worker.js.php?url=<?=$_SERVER['SCRIPT_NAME']?>",
			keys = {
				ign: "<?=isset($ign_key)?$ign_key:'hcxdz5f1p9emo4i1lch6ennl'?>", // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
				thunderforest: "<?=isset($thunderforest_key)?$thunderforest_key:'ee751f43b3af4614b01d1bce72785369'?>", // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
				bing: "<?=isset($bing_key)?$bing_key:'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt'?>" // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
				// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
			};
	</script>
	<link href="<?=$gps_path?>index.css" type="text/css" rel="stylesheet">
	<script src="<?=$gps_path?>index.js" defer="defer"></script>
</head>

<body>
	<?php if (isset ($_GET['gpx']) || isset ($overlay)) { ?>
		<script>
			window.onload = function() {
				<?php if (isset ($_GET['gpx'])) { ?>
					addLayer ('<?=dirname($_SERVER['SCRIPT_NAME'])?>/<?=$_GET['gpx']?>.gpx');
				<?php }
				if () { ?>
					map.addLayer (<?=$overlay?>);
				<?php } ?>
			};
		</script>
	<?php }
	if (count ($gpx_files) && !isset ($_GET['gpx'])) { ?>
		<div id="liste">
			<p>Cliquez sur le nom de la trace pour l'afficher :</p>
			<ul>
			<?php foreach ($gpx_files AS $gpx) { ?>
					<li>
						<a title="Cliquer pour afficher la trace"
							onclick="addLayer('<?=dirname($_SERVER['SCRIPT_NAME']).'/'.$gpx?>')">
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
</body>
</html>