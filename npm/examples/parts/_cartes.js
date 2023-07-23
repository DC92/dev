 // La carte des massifs colorés pour la page d'accueil
 const massifsColores = new myol.layer.MyVectorLayer({
 	// Construction de l'url
 	host: '//www.refuges.info/',
 	//host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de CE serveur
 	query: () => ({
 		_path: 'api/polygones',
 		type_polygon: 1, // Massifs
 	}),
 	strategy: myol.loadingstrategy.all, // Pas de bbox

 	// Réception et traduction des données
 	addProperties: properties => ({
 		label: properties.nom, // Affichage du nom du massif si le polygone est assez grand
 		link: properties.lien, // Lien sur lequel cliquer
 	}),

 	// Affichage de base
 	basicStylesOptions: feature => {
 		// Conversion de la couleur en rgb pour pouvoir y ajouter la transparence
 		const rgb = feature.getProperties().couleur
 			.match(/([0-9a-f]{2})/ig)
 			.map(c => parseInt(c, 16));

 		return [{
 			// Etiquette
 			...myol.stylesOptions.label(feature),

 			// Affichage de la couleur du massif
 			fill: new myol.style.Fill({
 				// Transparence 0.3
 				color: 'rgba(' + rgb.join(',') + ',0.3)',
 			}),
 		}];
 	},

 	// Affichage au survol des massifs
 	hoverStylesOptions: feature => {
 		feature.setProperties({
 			overflow: true, // Affiche l'étiquette même si elle n'est pas contenue dans le polygone
 		}, true);

 		return {
 			// Etiquette (pour les cas où elle n'est pas déja affichée)
 			...myol.stylesOptions.label(feature),

 			// On renforce le contour du massif survolé
 			stroke: new myol.style.Stroke({
 				color: feature.getProperties().couleur,
 				width: 2,
 			}),
 		};
 	},
 });

 // Affiche le contout d'un massif pour la page nav
 const contourMassif = new myol.layer.MyVectorLayer({
 	// Construction de l'url
 	host: '//www.refuges.info/',
 	//host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de ce serveur
 	query: () => ({
 		_path: 'api/polygones',
 		massif: contourMassif.selector.getSelection(),
 	}),
 	strategy: myol.loadingstrategy.all, // Pas de bbox

 	// Sélecteur d'affichage
 	selectName: 'select-massif',

 	// Affichage de base
 	basicStylesOptions: () => [{
 		// Simple contour bleu
 		stroke: new myol.style.Stroke({
 			color: 'blue',
 			width: 2,
 		}),
 	}],

 	// Pas d'actions au survol
 	hoverStylesOptions: () => {},
 });


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