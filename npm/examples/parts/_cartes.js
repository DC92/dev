 // La carte des massifs pour la page d'accueil
 class Massifs extends myol.layer.MyVectorLayer {
 	constructor() {
 		super({
 			// Construction de l'url
 			host: '//www.refuges.info/',
 			query: () => ({
 				_path: 'api/polygones',
 				type_polygon: 1, // Massifs
 			}),
 			strategy: myol.loadingstrategy.all, // Pas de bbox

 			// Réception des données
 			addProperties: properties => ({
 				label: properties.nom,
 				couleur: properties.couleur,
 				link: properties.lien,
 			}),

 			// Affichage
 			basicStylesOptions: areasStylesOptions_,
 			hoverStylesOptions: hoverStylesOptions_,
 		});

 		// Affichage de base
 		function areasStylesOptions_(feature, layer) {
 			const properties = feature.getProperties(),
 				// Calcul de la couleur rgb
 				colors = properties.couleur
 				.match(/([0-9a-f]{2})/ig)
 				.map(c => parseInt(c, 16));

 			return [{
 				// Etiquette
 				...myol.stylesOptions.label(...arguments),

 				// Affichage de la couleur du massif
 				fill: new myol.style.Fill({
 					// Transparence 0.3
 					color: 'rgba(' + colors.join(',') + ',0.3)',
 				}),
 			}];
 		}

 		// Affichage au survol des massifs
 		function hoverStylesOptions_(feature, layer) {
 			const properties = feature.getProperties();

 			// Préparation de l'étiquette
 			feature.setProperties({
 				label: properties.nom,
 				overflow: true, // Display label even if not contained in polygon
 			}, true);

 			return {
 				// Etiquette
 				...myol.stylesOptions.label(feature, layer),

 				// ON renforce le contour du massif survolé
 				stroke: new myol.style.Stroke({
 					color: properties.couleur,
 					width: 2,
 				}),
 			};
 		}
 	}
 }

 // Les couches de fond des cartes de refuges.info
 /*function wriMapBaseLayers(page) {
 	return {
 		'Refuges.info': layerMRI(),
 		'OSM fr': layerOSM({
 			url: '//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
 		}),
 		'OpenTopo': layerOpenTopo(),
 		'Outdoors': layerThunderforest({
 			subLayer: 'outdoors',
 			key: mapKeys.thunderforest,
 		}),
 		'IGN TOP25': page == 'modif' ? null : layerIGN({
 			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
 			key: mapKeys.ign,
 		}),
 		'IGN V2': layerIGN({
 			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
 			key: 'essentiels', // La clé pour les couches publiques
 			format: 'image/png',
 		}),
 		'SwissTopo': page == 'modif' ? null : layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
 		'Autriche': layerKompass(),
 		'Espagne': layerSpain('mapa-raster', 'MTN'),
 		'Photo IGN': layerIGN({
 			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
 			key: 'essentiels',
 		}),
 		'Photo ArcGIS': layerArcGIS('World_Imagery'),
 		'Photo Google': page == 'modif' ? null : layerGoogle('s'),
 	};
 }

 // Les controles des cartes de refuges.info
 function wriMapControls(options) {
 	return [
 		// Haut gauche
 		new ol.control.Zoom(),
 		new ol.control.FullScreen(),
 		controlGeocoder(),
 		controlGPS(),
 		options.page == 'point' ? controlButton() : controlLoadGPX(),
 		options.page == 'nav' ? controlButton() : controlDownload(options.Download),
 		options.page == 'modif' ? controlButton() : controlPrint(),

 		// Haut droit
 		controlLayerSwitcher({
 			layers: wriMapBaseLayers(options.page),
 		}),

 		// Bas gauche
 		controlMousePosition(),
 		new ol.control.ScaleLine(),

 		// Bas droit
 		controlPermalink(options.Permalink),
 		new ol.control.Attribution({
 			collapsed: false,
 		}),
 	];
 }*/