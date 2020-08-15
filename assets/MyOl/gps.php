
<!DOCTYPE html>
<!--
© Dominique Cavailhez 2019
https://github.com/Dominique92/MyOl
Based on https://openlayers.org

This is the entry for servers that don't run PHP
This installs the service but upgrades the files only after the caches delay
-->
<html>
<head>
	<link rel="manifest" href="manifest.json">

	<title>My GPS</title>
	<meta charset="utf-8">
	<meta name="viewport" content="width=device-width, initial-scale=1" />
	<link rel="icon" type="image/png" href="gps/favicon.png" />

	<!-- Openlayers -->
	<link href="gps/../ol/ol.css" type="text/css" rel="stylesheet">
	<script src="gps/../ol/ol.js"></script>

	<!-- Recherche par nom -->
	<link href="gps/../geocoder/ol-geocoder.min.css" type="text/css" rel="stylesheet">
	<script src="gps/../geocoder/ol-geocoder.js"></script>

	<!-- My Openlayers -->
	<link href="gps/../myol.css" type="text/css" rel="stylesheet">
	<script src="gps/../myol.js"></script>

	<!-- This app -->
	<script>
		var service_worker = 'gps/service-worker.js.php',
			// You will have to replace these keys by some that you ask for your own domain
			keys = {
				ign: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
				thunderforest: 'ee751f43b3af4614b01d1bce72785369', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
				bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
				// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
			};
	</script>
	<link href="gps/index.css" type="text/css" rel="stylesheet">
	<script src="gps/index.js" defer="defer"></script>
</head>

<body>
assets/MyOl/gps/index.html
	<div id="map"></div>
</body>
</html>