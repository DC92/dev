//const host = '<?=$config_wri["sous_dossier_installation"]?>'; // Appeler la couche de CE serveur
const host = '//www.refuges.info/',
	ol = myol.ol, // On récupère certaines fonctions natives Openlayers dans le bundle myol

	// La carte des massifs colorés
	optionsMassifsColores = {
		// Construction de l'url
		host: host,
		query: () => ({
			_path: 'api/polygones',
			type_polygon: 1, // Massifs
		}),
		strategy: ol.loadingstrategy.all, // Pas de bbox

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
				fill: new ol.style.Fill({
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
				stroke: new ol.style.Stroke({
					color: feature.getProperties().couleur,
					width: 2,
				}),
			};
		},
	},

	// Affiche le contour d'un massif pour la page nav
	optionsContourMassif = {
		// Construction de l'url
		host: host,
		query: (extent, resolution, projection, options) => ({
			_path: 'api/polygones',
			massif: options.selector.getSelection(),
		}),
		strategy: ol.loadingstrategy.all, // Pas de bbox

		// Sélecteur d'affichage
		selectName: 'select-massif',

		// Affichage de base
		basicStylesOptions: () => [{
			// Simple contour bleu
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
		}],

		// Pas d'action au survol
		hoverStylesOptions: () => {},
	},

	optionsPointsWRI = {
		host: host,
		browserClusterMinDistance: 50,
		serverClusterMinResolution: 100,
		selectName: 'select-wri',

		query: (extent, resolution, projection, options) => {
			const selectionMassif = contourMassif.options.selector.getSelection(); //TODO trouver comment lier dans wri.html

			return {
				_path: selectionMassif.length ? 'api/massif' : 'api/bbox',
				type_points: options.selector.getSelection(),
				massif: selectionMassif,
				nb_points: 'all',
				cluster: resolution > options.serverClusterMinResolution ? 0.1 : null, // For server cluster layer
			};
		},

		addProperties: properties => ({
			label: properties.nom, // Permanence de l'étiquette dès l'affichage de la carte
			name: properties.nom, // Nom utilisé dans les listes affichées au survol des ronds des clusters
			icon: host + 'images/icones/' + properties.type.icone + '.svg',
			//TODO rapatrier fabrication étiquette
			ele: properties.coord ? properties.coord.alt : null,
			bed: properties.places ? properties.places.valeur : null,
			type: properties.type ? properties.type.valeur : null,
			link: properties.lien, // Lien sur lequel cliquer
		}),
	};

const pointsWRI = new myol.layer.MyVectorLayer(optionsPointsWRI);
const contourMassif = new myol.layer.MyVectorLayer(optionsContourMassif);
// Recharger le sélecteur de massif la couche de point quand change
contourMassif.options.selector.callbacks.push(() => pointsWRI.reload());
//TODO mettre dans wri.html

// Les controles des cartes de refuges.info
function wriMapControls(options) {
	return [
		// Haut gauche
		new ol.control.Zoom(),
		new ol.control.FullScreen(),

		myol.control.load(),
		myol.control.download(),
		myol.control.print(),
		/*
		controlGeocoder(),
		controlGPS(),
		options.page == 'point' ? controlButton() : 
		options.page == 'nav' ? controlButton() : download(options.Download),
		options.page == 'modif' ? controlButton() : print(),

		// Haut droit
		controlLayerSwitcher({
			layers: wriMapBaseLayers(options.page),
		}),
		*/
		// Bas gauche
		//controlMousePosition(),
		new ol.control.ScaleLine(),

		// Bas droit
		//controlPermalink(options.Permalink),
		new ol.control.Attribution({
			collapsed: false,
		}),
	];
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
*/