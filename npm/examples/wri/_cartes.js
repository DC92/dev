const ol = myol.ol; // On récupère certaines fonctions natives Openlayers dans le bundle myol

// La couche des massifs colorés (accueil et couche carte nav)
function coucheMassifsColores(options) {
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
function coucheContourMassif(options) {
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

function couchePointsWRI(opt) {
	const options = {
		selectMassif: new myol.Selector('no-selector'), // Defaut = pas de sélecteur de massif
		...opt
	};

	layer = new myol.layer.MyVectorLayer({
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
		myol.control.MyGeolocation(),
		'nav,edit'.includes(page) ? new myol.control.Load() : new myol.control.myButton(),
		'point,edit'.includes(page) ? new myol.control.Download() : new myol.control.myButton(),
		'nav,point'.includes(page) ? myol.control.print() : myol.control.myButton(),

		// Bas gauche
		new myol.control.mousePosition(),
		new ol.control.ScaleLine(),

		// Bas droit
		new ol.control.Attribution({ // Attribution doit être défini avant LayerSwitcher
			collapsed: false,
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
		'IGN TOP25': 'nav,point'.includes(page) ?
			new myol.layer.tile.IGN({
				layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
				key: layersKeys.ign,
			}) : null,
		'IGN V2': new myol.layer.tile.IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // La clé pour les couches publiques
			format: 'image/png',
		}),
		'SwissTopo': 'nav,point'.includes(page) ?
			new myol.layer.tile.SwissTopo(
				'ch.swisstopo.pixelkarte-farbe'
			) : null,
		'Autriche': new myol.layer.tile.Kompass(),
		'Espagne': new myol.layer.tile.IgnES('mapa-raster', 'MTN'),
		'Photo IGN': new myol.layer.tile.IGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': new myol.layer.tile.ArcGIS('World_Imagery'),
		'Photo Google': 'nav,point'.includes(page) ?
			new myol.layer.tile.Google('s') : null,
	};
}

// Le code d'affichage des différentes cartes
function carteIndex(extent) {
	return new ol.Map({
			target: 'carte-accueil',
			view: new ol.View({
				enableRotation: false,
			}),
			controls: [
				new ol.control.Attribution({ // Du fond de carte
					collapsed: false,
				}),
			],
			layers: [
				new myol.layer.tile.MRI(), // Fond de carte
				coucheMassifsColores(), // Les massifs
				new myol.layer.Hover(), // Gère le survol du curseur
			],
		})
		// Centre la carte sur la zone souhaitée
		.getView().fit(ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857'));
}

function carteNav(extent, init) {
	const contourMassif = coucheContourMassif({
			selectName: 'select-massif',
		}),
		pointsWRI = couchePointsWRI({
			selectName: 'select-wri',
			selectMassif: contourMassif.options.selector,
		}),
		couchesVectoriellesExternes = [
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

	return new ol.Map({
			target: 'carte-nav',
			view: new ol.View({
				enableRotation: false,
			}),
			controls: [
				...controlesCartes('nav'),
				myol.control.permalink({ // Permet de garder le même réglage de carte
					display: true, // Affiche le lien
					init: init, // On cadre le massif, s'il y a massif
				}),
				new myol.control.LayerSwitcher({
					layers: fondsCarte('nav', layersKeys),
				}),
			],
			layers: [
				coucheMassifsColores({
					selectName: 'select-massifs',
				}),
				...couchesVectoriellesExternes,
				contourMassif,
				pointsWRI,
				new myol.layer.Hover(),
			],
		})
		// Centre la carte sur la zone souhaitée
		.getView().fit(ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857'));
}

function carteEdit(extent) {
	const coucheContours = coucheContourMassif(),
		controlEditor = new myol.control.Editor({
			geoJsonId: 'edit-json',
			snapLayers: [coucheContours],
			help: [
				(document.getElementById('myol-help-edit-modify') || {}).innerHTML,
				null, // Pas d'édition de ligne
				(document.getElementById('myol-help-edit-poly') || {}).innerHTML,
			],
			saveFeatures: function(coordinates, format) {
				return format.writeGeometry(
					new ol.geom.MultiPolygon(coordinates.polys), {
						featureProjection: 'EPSG:3857',
						decimals: 5,
					});
			},
		});

	return new ol.Map({
			target: 'carte-edit',
			view: new ol.View({
				enableRotation: false,
			}),
			controls: [
				...controlesCartes('edit'),
				//myol.control.permalink(options.Permalink), //TODO
				new myol.control.LayerSwitcher({
					layers: fondsCarte('edit', layersKeys),
				}),
				controlEditor,
			],
			layers: [
				coucheContours,
				new myol.layer.Hover(),
			],
		})
		// Centre la carte sur la zone souhaitée
		.getView().fit(ol.proj.transformExtent(extent, 'EPSG:4326', 'EPSG:3857'));
}

function cartePoint() {
	return new ol.Map({
		target: 'carte-point',
		view: new ol.View({
			center: ol.proj.fromLonLat([5.50669, 44.98445]),
			zoom: 13,
			enableRotation: false,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: [
			...controlesCartes('point'),
			myol.control.permalink({ // Permet de garder le même réglage de carte
				visible: false, // Mais on ne visualise pas le lien du permalink
				init: false, // Ici, on utilisera plutôt la position du point
			}),
			new myol.control.LayerSwitcher({
				layers: fondsCarte('point', layersKeys),
			}),
		],
		layers: [
			couchePointsWRI(),
			// Le cadre
			new myol.layer.Marker({
				src: host + 'images/cadre.svg',
				focus: 15,
			}),
			new myol.layer.Hover(),
		],
	});
}

function carteModif() {
	return 0;
}