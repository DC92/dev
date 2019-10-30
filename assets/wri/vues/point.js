// Script de la page point
var map = new ol.Map({
	target: 'carte-point',
	view: new ol.View({
		center: ol.proj.fromLonLat([<?=$vue->point->longitude?>,<?=$vue->point->latitude?>]),
		zoom: 13,
	}),
	layers: [
		layerMarker('<?=$config_wri['sous_dossier_installation']?>images/cadre.png', 'marqueur'),
		layerMarker('<?=$config_wri['sous_dossier_installation']?>images/viseur.png', 'viseur', null, true),
	],
	controls: [
		controlLayersSwitcher({
			baseLayers: {
				'Refuges.info': layerOSM(
					'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
					'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
				),
				'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
				'OpenTopoMap': layerOSM(
					'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
					'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
				),
				'IGN': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
				'IGN Express': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
				'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
				'Autriche': layerKompass('KOMPASS Touristik'),
				'Espagne': layerSpain('mapa-raster', 'MTN'),
				'Photo Bing': layerBing('<?=$config_wri['bing_key']?>', 'Aerial'),
				'Photo IGN': layerIGN('<?=$config_wri['ign_key']?>', 'ORTHOIMAGERY.ORTHOPHOTOS'),
			},
		}),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '',
			labelActive: '',
			tipLabel: 'Plein écran',
		}),
		controlDownloadGPX(),
		controlPrint(),
		new ol.control.Attribution({
			collapsible: false, // Attribution always open
		}),
	],
});