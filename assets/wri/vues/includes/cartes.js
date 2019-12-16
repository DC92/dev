// Contient les déclarations communes aux cartes

const baseLayers = {
	'Refuges.info': layerOSM(
		'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
	),
	'OpenTopoMap': layerOSM(
		'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		'<a href="https://opentopomap.org">OpenTopoMap</a> ' +
		'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
	),
//TODO	'Outdoors': layerThunderforest('<?=$config_wri['thunderforest_key']?>', 'outdoors'),
	'OSM-fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
<?php if ($vue->type != 'point_formulaire_modification') { ?>
	'IGN': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
	'IGN Express': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
<?php } ?>
	'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
	'Autriche': layerKompass('KOMPASS Touristik'),
	'Espagne': layerSpain('mapa-raster', 'MTN'),
	'Photo-Bing': layerBing('<?=$config_wri['bing_key']?>', 'Aerial'),
	'Photo-IGN': layerIGN('<?=$config_wri['ign_key']?>', 'ORTHOIMAGERY.ORTHOPHOTOS'),
};