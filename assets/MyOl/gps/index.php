<?php
header('Cache-Control: no-cache');
header('Pragma: no-cache');

include ('common.php');

// Get package info
$url_dirs  = explode ('/', str_replace ('index.php', '', $_SERVER['SCRIPT_FILENAME']));
$script_dirs  = explode ('/', str_replace ('\\', '/', __DIR__ .'/'));
// Remove common part of the paths (except the last /)
while (count ($url_dirs) > 1 && count ($script_dirs) > 1 &&
	$url_dirs [0] == $script_dirs [0]) {
	array_shift ($url_dirs);
	array_shift ($script_dirs);
}
// Gps scripts path from url
$myol_path = str_repeat ('../', count ($url_dirs) - 1) .implode ('/', $script_dirs);

//TODO DELETE
// Url path from service-worker
//$url_path = str_repeat ('../', count ($script_dirs) - 1) .implode ('/', $url_dirs);

// Get manifest info
$manifest = json_decode (file_get_contents ('manifest.json'), true);
$icon_file = $manifest['icons'][0]['src'];
$icon_type = pathinfo ($icon_file, PATHINFO_EXTENSION);

function fl ($filename, $path = '') {
	return implode ('', [
		(pathinfo($filename, PATHINFO_EXTENSION) == 'js' ? 'src' : 'href'),
		 '="'.$path.$filename.'?'.filemtime($path.$filename).'"',
		(pathinfo($filename, PATHINFO_EXTENSION) == 'css' ? ' type="text/css" rel="stylesheet"' : ''),
	]);
}

?><!DOCTYPE html>
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
	<link <?=fl('manifest.json')?> rel="manifest">

	<title>My GPS</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
	<link <?=fl($icon_file)?> rel="icon" type="image/<?=$icon_type?>" />
	<link <?=fl($icon_file)?> rel="apple-touch-icon" />

	<!-- Openlayers -->
	<script <?=fl('../ol/ol.js',$myol_path)?>></script>
	<link <?=fl('../ol/ol.css',$myol_path)?>>

	<!-- Recherche par nom -->
	<script <?=fl('../geocoder/ol-geocoder.js',$myol_path)?>></script>
	<link <?=fl('../geocoder/ol-geocoder.min.css',$myol_path)?>>

	<!-- My Openlayers -->
	<script <?=fl('../myol.js',$myol_path)?>></script>
	<link <?=fl('../myol.css',$myol_path)?>>

	<!-- This app -->
	<script>
		var scriptPath = '<?=$myol_path?>',
			myolSWbuild = '<?=$myol_SW_build?>',
			myolGPXfiles = <?=$myol_GPX_files?>;//TODO TRIER
	</script>
	<script <?=fl('./index.js',$myol_path)?>></script>
	<link <?=fl('./index.css',$myol_path)?>>
</head>

<body>
	<?php // Add map specificities
	//TODO REMOVE (put in index.php at origin)
	foreach (glob ('{../../gps_addons.php,../../*/gps_addons.php}', GLOB_BRACE) AS $f)
		include ($f);
	?>

	<div id="map"></div>

	<div style="display:none"><!-- //TODO REMOVE (put in index.php at origin) -->
		<div id="myol-gps-help">
			<p>MyGPS <span class="myol-sw-build"></span></p>
		</div>
	</div>
</body>
</html>