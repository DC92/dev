const baseLayers = {
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
	},

	controls = [
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
		controlDownload(),
		controlPrint(),
		controlLayerSwitcher(baseLayers),
		controlMousePosition(),
		new ol.control.ScaleLine(),
		controlPermalink({ // Permet de garder le même réglage de carte
			display: true,
<?php if ($vue->polygone->id_polygone) { ?>
			init: false, // Ici, on cadrera plutôt sur le massif
<?php } ?>
		}),
		new ol.control.Attribution({
			collapsed: false,
		}),
	],
	wriInput = document.getElementById('selecteur-wri'),
	massifInput = document.getElementById('selecteur-massif')
	massifsInput = document.getElementById('selecteur-massifs'),

	points = layerWri({
		host: '<?=$config_wri["sous_dossier_installation"]?>',
			attribution:null,
		selectorName: 'selecteur-wri',
//TODO		massif:4,
		urlFunction: function(options, bbox, selection) {
			if (massifInput && massifInput.checked)
				return options.host + 'api/massif' +
					'?massif=<?=$vue->polygone->id_polygone?>&'+
					'type_points=' + selection.join(',');
			else
				return options.host + 'api/bbox' +
					'?type_points=' + selection.join(',') +
					'&bbox=' + bbox.join(',');
		},
		// Clusterisation
		distanceMinCluster: 30,
		// Ajout de l'étiquette
		styleOptionsFunction: function(feature, properties) {
			return Object.assign({},
				styleOptionsLabel(properties.name, properties, true),
				styleOptionsIcon(properties.icon)
			);
		},
	}),

	layers = [
		// Refuges.info
		points,
		// Les massifs
		layerWriAreas({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			selectorName: 'selecteur-massifs',
		}),
		// Contour d'un massif ou d'une zone
<?php if ($vue->polygone->id_polygone) { ?>
		layerVector({
			url: '<?=$config_wri["sous_dossier_installation"]?>api/polygones' +
				'?massif=<?=$vue->polygone->id_polygone?>',
			selectorName: 'selecteur-massif',
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 2,
				}),
			}),
		}),
<?php } ?>

		// Overpass
		layerOverpass({
			selectorName: 'selecteur-osm',
			distanceMinCluster: 30,
			maxResolution: 100,
		}),

		// Pyrenees-refuges.com
		layerPyreneesRefuges({
			selectorName: 'selecteur-prc',
			distanceMinCluster: 30,
		}),

		// CampToCamp
		layerC2C({
			selectorName: 'selecteur-c2c',
			distanceMinCluster: 30,
		}),

		// Chemineur
		layerGeoBB({
			host: '//chemineur.fr/',
			selectorName: 'selecteur-chemineur',
			maxResolution: 100,
			distanceMinCluster: 30,
			attribution: 'Chemineur',
		}),
		layerGeoBB({
			host: '//chemineur.fr/',
			selectorName: 'selecteur-chemineur',
			subLayer: 'cluster',
			minResolution: 100,
			distanceMinCluster: 30,
			attribution: 'Chemineur',
		}),

		// Alpages.info
		layerGeoBB({
			host: '//alpages.info/',
			selectorName: 'selecteur-alpages',
			argSelName: 'forums',
			distanceMinCluster: 30,
			attribution: 'Alpages',
		}),
	],

	map = new ol.Map({
		target: 'carte-nav',
		view: new ol.View({
			enableRotation: false,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: controls,
		layers: layers,
	});

// Initialiser l'affichage des points et des massifs suivant le type de carte (zone ou massif)
if (wriInput) {
	wriInput.checked = true;
	wriInput.dispatchEvent(new Event('click'));
}
if (massifInput) {
	massifInput.checked = true;
	massifInput.dispatchEvent(new Event('click'));
}
if (massifsInput) {
	massifsInput.checked = <?=$vue->contenu?'true':'false'?>;
	massifsInput.dispatchEvent(new Event('click'));
}

// Centrer sur la zone du polygone
<?if ($vue->polygone->id_polygone) { ?>
	map.getView().fit(ol.proj.transformExtent([
		<?=$vue->polygone->ouest?>,
		<?=$vue->polygone->sud?>,
		<?=$vue->polygone->est?>,
		<?=$vue->polygone->nord?>,
	], 'EPSG:4326', 'EPSG:3857'));
<? } ?>
