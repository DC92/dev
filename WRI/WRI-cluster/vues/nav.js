// Forçage de l'init des coches
localStorage['myol_selecteurmassif'] = '<?=$vue->polygone->id_polygone?>';
localStorage['myol_selecteurwri'] = 'all';
localStorage['myol_selecteurmassifs'] =
localStorage['myol_selecteurosm'] =
localStorage['myol_selecteurprc'] =
localStorage['myol_selecteurcc'] =
localStorage['myol_selecteurchemineur'] =
localStorage['myol_selecteuralpages'] = '';

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
			init: <?=$vue->polygone->id_polygone?'false':'true'?>, // On cadre le massif
		}),
		new ol.control.Attribution({
			collapsed: false,
		}),
	],

	layers = [
		// Refuges.info (2 level layer depending on resolution)
		...layersCluster({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			layer: layerWri,
			switchResolution: 500, // Résolution à partir de laquelle le serveur sert des clusters
			selectorName: 'selecteur-wri,selecteur-massif', // 2 selectors for one layer
			styleOptionsFunction: function (feature, properties) {
				return {
					...styleOptionsLabel(properties.name, properties, true),
					...styleOptionsIcon(properties.icon),
				};
			},
			attribution: '',
		}),

		// Contour d'un massif ou d'une zone
		layerVector({
			url: '<?=$config_wri["sous_dossier_installation"]?>' +
				'api/polygones?massif=<?=$vue->polygone->id_polygone?>',
			selectorName: 'selecteur-massif',
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 2,
				}),
			}),
		}),

		// Les massifs
		layerWriAreas({
			host: '<?=$config_wri["sous_dossier_installation"]?>',
			selectorName: 'selecteur-massifs',
		}),

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
		...layersCluster({
			host: '//chemineur.fr/',
			layer: layerGeoBB,
			selectorName: 'selecteur-chemineur',
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

// Centrer sur la zone du polygone
<?if ($vue->polygone->id_polygone) { ?>
	map.getView().fit(ol.proj.transformExtent([
		<?=$vue->polygone->ouest?>,
		<?=$vue->polygone->sud?>,
		<?=$vue->polygone->est?>,
		<?=$vue->polygone->nord?>,
	], 'EPSG:4326', 'EPSG:3857'));
<? } ?>
