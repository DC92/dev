const baseLayers = {
		'Refuges.info': layerMRI(),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest('outdoors'),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'IGN TOP25': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS'), // Need an IGN key
		'IGN V2': layerIGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'png', 'pratique'), // 'pratique' is the key for the free layers
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS', 'jpeg', 'pratique'),
		'Photo Bing': layerBing('Aerial'),
	},

layers = [
	// Refuges.info
	layerWri({
		selectorName: 'couche-wri',
		maxResolution: 100,
		distance: 50,
	}),
	layerWriAreas({
		minResolution: 100,
		selectorName: 'couche-wri',
	}),
	// Overpass
	layerOverpass({
		selectorName: 'couche-osm',
		distance: 50,
		maxResolution: 100,
	}),
	// Pyrenees-refuges.com
	layerPyreneesRefuges({
		selectorName: 'couche-prc',
		distance: 50,
	}),
	// CampToCamp
	layerC2C({
		selectorName: 'couche-c2c',
		distance: 50,
	}),
	// Chemineur
	layerGeoBB({
		selectorName: 'couche-chemineur',
		maxResolution: 100,
		distance: 50,
		attribution: 'Chemineur',
	}),
	layerGeoBB({
		selectorName: 'couche-chemineur',
		subLayer: 'cluster',
		minResolution: 100,
		distance: 50,
		attribution: 'Chemineur',
	}),
	// Alpages.info
	layerAlpages({
		selectorName: 'couche-alpages',
	}),
],

  controls = [
		controlLayerSwitcher(baseLayers),
		controlPermalink({ // Permet de garder le même réglage de carte
<?php if ($vue->polygone->id_polygone) { ?>
			init: false, // Ici, on cadrera plutôt sur le massif
<?php } ?>
		}),
		new ol.control.Attribution({
			collapsible: false,
		}),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		controlFullScreen(),
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
<?if (!$vue->polygone->nom_polygone ) { ?>
		controlDownload(),
<?php } ?>
		controlPrint(),
	],

  map = new ol.Map({
	target: 'carte-nav',
	controls: controls,
	layers: layers,
});

/*
	// La couche "contour" (du massif, de la zone)
	contour = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?massif=<?=$vue->polygone->id_polygone?>',
		selectorName: 'couche-massif',
		noMemSelection: true,
		receiveProperties: function(properties, feature) {
			// Convertit les polygones en lignes pour ne pas activer le curseur en passant à l'intérieur du massif
			let multi = [];
			for(c in feature.geometry.coordinates)
				multi = multi.concat(feature.geometry.coordinates[c]);
			feature.geometry = {
				type: 'MultiLineString',
				coordinates: multi,
			};
			// Pas d'étiquette sur le bord du massif
			properties.type = null;
		},
	}),

	// La couche "polygones" (du massif, de la zone, plein et coloré)
	polygones = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?type_polygon=<?=$vue->contenu->id_polygone_type?>&intersection=<?=$vue->polygone->id_polygone?>',
		noMemSelection: true,
		receiveProperties: function(properties, feature, layer) {
			properties.name = properties.nom;
			properties.type = null;
			properties.link = properties.lien;
			properties.copy = '';
		},
		styleOptions: function(properties) {
			// Translates the color in RGBA to be transparent
			var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' +
						parseInt(cs[1], 16) + ',' +
						parseInt(cs[2], 16) + ',' +
						parseInt(cs[3], 16) + ',0.5)',
				}),
				stroke: new ol.style.Stroke({
					color: 'black',
				}),
			};
		},
		hoverStyleOptions: function(properties) {
			return {
				fill: new ol.style.Fill({
					color: properties.couleur,
				}),
			};
		},
	}),


	<?if ($vue->polygone->id_polygone){?>
		map.getView().fit(ol.proj.transformExtent([
			<?=$vue->polygone->ouest?>,
			<?=$vue->polygone->sud?>,
			<?=$vue->polygone->est?>,
			<?=$vue->polygone->nord?>,
		], 'EPSG:4326', 'EPSG:3857'));
	<?}?>
	*/
