const ol = myol.ol; // On récupère certaines fonctions natives Openlayers dans le bundle myol

// La couche des massifs colorés (accueil et couche carte nav)
function layerMassifsColores(options) {
	return new myol.layer.MyVectorLayer({
		// Construction de l'url
		host: host,
		query: () => ({
			_path: 'api/polygones',
			type_polygon: 1, // Massifs
		}),
		strategy: ol.loadingstrategy.all, // Pas de bbox
		...options,

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
	});
}

// Affiche le contour d'un massif pour la page nav
function layerContourMassif(options) {
	return new myol.layer.MyVectorLayer({
		// Construction de l'url
		host: host,
		query: (extent, resolution, projection, options) => ({
			_path: 'api/polygones',
			type_polygon: 1, // Massifs
			massif: options.selector.getSelection(),
		}),
		strategy: ol.loadingstrategy.all, // Pas de bbox
		...options,

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
	});
}

function layerPointsWRI(options) {
	const layer = new myol.layer.MyVectorLayer({
		host: host,
		browserClusterMinDistance: 50,
		serverClusterMinResolution: 100,
		...options,

		query: (extent, resolution, projection, opt) => {
			const selectionMassif = options.selectMassif.getSelection();

			return {
				_path: selectionMassif.length ? 'api/massif' : 'api/bbox',
				massif: selectionMassif,
				type_points: opt.selector.getSelection(),
				nb_points: 'all',
				cluster: resolution > opt.serverClusterMinResolution ? 0.1 : null, // For server cluster layer
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
	});

	// Recharger la couche de points quand le sélecteur de massif change
	options.selectMassif.callbacks.push(() => layer.reload());

	return layer;
}

// Les controles des cartes de refuges.info
function controlesCartes(page) {
	return [
		// Haut gauche
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		new myol.control.MyGeocoder(),
		myol.control.myGeolocation(),
		'nav,edit'.includes(page) ? myol.control.load() : myol.control.myButton(),
		'edit'.includes(page) ? myol.control.download() : myol.control.myButton(),
		'nav'.includes(page) ? myol.control.print() : myol.control.myButton(),

		// Bas gauche
		new myol.control.mousePosition(),
		new ol.control.ScaleLine(),

		// Bas droit
		new ol.control.Attribution({ // Attribution doit être défini avant layerSwitcher
			collapsed: false,
		}),
	];
}

// Les couches vectorielles de refuges.info
function couchesVectoriellesExternes() {
	return [
		new myol.layer.vector.Chemineur({
			selectName: 'select-chemineur',
		}),
		new myol.layer.vector.Alpages({
			selectName: 'select-alpages',
		}),
		new myol.layer.vector.PRC({
			selectName: 'select-prc',
		}),
		new myol.layer.vector.C2C({
			selectName: 'select-c2c',
		}),
		new myol.layer.vector.Overpass({
			selectName: 'select-osm',
		}),
	];
}

// Les couches de fond des cartes de refuges.info
function fondsCarte(page, layersKeys) {
	return {
		'Refuges.info': new myol.layer.tile.MRI(),
		'OSM fr': new myol.layer.tile.OSM({
			url: '//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
		}),
		'OpenTopo': new myol.layer.tile.OpenTopo(),
		'Outdoors': new myol.layer.tile.Thunderforest({
			subLayer: 'outdoors',
			key: layersKeys.thunderforest,
		}),
		'IGN TOP25': page == 'modif' ? null : new myol.layer.tile.IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: layersKeys.ign,
		}),
		'IGN V2': new myol.layer.tile.IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // La clé pour les couches publiques
			format: 'image/png',
		}),
		'SwissTopo': page == 'modif' ? null : new myol.layer.tile.SwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': new myol.layer.tile.Kompass(),
		'Espagne': new myol.layer.tile.IgnES('mapa-raster', 'MTN'),
		'Photo IGN': new myol.layer.tile.IGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': new myol.layer.tile.ArcGIS('World_Imagery'),
		'Photo Google': page == 'modif' ? null : new myol.layer.tile.Google('s'),
	};
}