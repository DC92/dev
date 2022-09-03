const mapId = 'carte-point',
	mapEl = document.getElementById(mapId),
	mapSize = mapEl ? Math.max(mapEl.clientWidth, mapEl.clientHeight) : window.innerWidth,

	baseLayers = {
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
		'Photo ArcGIS': layerArcGIS('World_Imagery'),
		'Photo Bing': layerBing('Aerial'),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo Google': layerGoogle('s'),
	};

new ol.Map({
	target: mapId,
	view: new ol.View({
		center: ol.proj.fromLonLat([<?=$vue->point->longitude?>,<?=$vue->point->latitude?>]),
		zoom: 13,
		enableRotation: false,
		constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
	}),
	controls: [
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		controlGPS(),
		controlPrint(),
		controlLayerSwitcher({
			layers: baseLayers,
		}),
		controlMousePosition(),
		new ol.control.ScaleLine(),
		controlPermalink({ // Permet de garder le même réglage de carte d'une page à l'autre
			visible: false, // Mais on ne visualise pas le lien du permalink
			init: false, // Ici, on utilisera plutôt la position du point
		}),
		new ol.control.Attribution({
			collapsed: false,
		}),
	],
	layers: [
		// Refuges.info (2 level layer depending on resolution)
		...layersCluster({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			layer: layerWri,
			switchResolution: Math.round(60000 / mapSize), 
			styleOptionsFunction: function (feature, properties) {
				return {
					...styleOptionsLabel(properties.name, properties, true),
					...styleOptionsIcon(properties.icon),
				};
			},
			attribution: '',
		}),

		// Le cadre
		layerMarker({
			prefix: 'cadre', // S'interface avec les <TAG id="cadre-xxx"...
			src: '<?=$config_wri["sous_dossier_installation"]?>images/cadre.svg',
			focus: 15, // Centrer 
		}),
	],
});