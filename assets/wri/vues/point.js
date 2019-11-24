const baseLayers = {
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

	overlays = [
		layerRefugesInfo({
			serverUrl: '<?=$config_wri['sous_dossier_installation']?>',
		}),

		layerMarker({
			imageUrl: '<?=$config_wri['sous_dossier_installation']?>images/cadre.png',
			idDisplay: 'marqueur',
		}),
	],

	controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({ // Permet de garder le même réglage de carte d'une page à l'autre
			visible: false, // Mais on ne visualise pas le lien du permalink
			init: false, // Ici, on utilisera plutôt la position du point
		}),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '', //HACK Bad presentation on IE & FF
			tipLabel: 'Plein écran',
		}),
		controlDownloadGPX(),
		new ol.control.Attribution({
			collapsible: false, // Attribution always open
		}),
	],

	map = new ol.Map({
		target: 'carte-point',
		view: new ol.View({
			center: ol.proj.fromLonLat([
				<?=$vue->point->longitude?> ,
				<?=$vue->point->latitude?>,
			]),
			zoom: 13,
		}),
		layers: overlays,
		controls: controls,
	});