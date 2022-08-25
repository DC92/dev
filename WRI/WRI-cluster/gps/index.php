<?php
// Force la couche carte quand on lance le GPS
setcookie ('baselayer', 'Refuges.info');

include ('../config_privee.php');
$mapKeys = $config_wri['mapKeys'];

$baseLayers = "{
		'Refuges.info': layerMRI(),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest('outdoors'),
		'IGN TOP25': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: mapKeys.ign,
		}),
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // The key for the free layers
			format: 'image/png',
		}),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': layerArcGIS('World_Imagery'),
		'Photo Bing': layerBing('Aerial'),
		'Photo Google': layerGoogle('s'),
	}";

$no_tail = true;
include ('../MyOl/gps/index.php');
?>

<div id="additional-selector" >
	Refuges.info <input type="checkbox" name="wri-features" />
	<ul>
		<li><input type="checkbox" name="wri-features" value="7" checked="checked" />Cabane</li>
		<li><input type="checkbox" name="wri-features" value="10" checked="checked" />Refuge</li>
		<li><input type="checkbox" name="wri-features" value="9" />Gîte</li>
		<li><input type="checkbox" name="wri-features" value="23" checked="checked" />Point d'eau</li>
		<li><input type="checkbox" name="wri-features" value="6" />Sommet</li>
		<li><input type="checkbox" name="wri-features" value="3" />Passage</li>
		<li><input type="checkbox" name="wri-features" value="28" />Bâtiment</li>
	</ul>
</div>

<script>
	window.addEventListener('load', function() {
		map.addLayer(layerWri({
			selectorName: 'wri-features',
			maxResolution: 100, // La couche est affichée pour les résolutions < 100 Mercator map unit / pixel
			distanceMinCluster: 30,
		}));
	});
</script>

</body>
</html>
