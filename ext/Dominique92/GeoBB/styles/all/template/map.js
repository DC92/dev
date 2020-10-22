// Features de la couche
const layerGeoBBgis = layerVectorURL({
		baseUrl: 'ext/Dominique92/GeoBB/gis.php?limit=300',
		urlSuffix: '',
		strategy: ol.loadingstrategy.bboxLimit,
		receiveProperties: function(properties) {
			properties.copy = 'chemineur.fr';
		},
		styleOptions: function(properties) {
			const style = {
				// Lines & polygons
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3,
				}),
			};
			if (properties.icon)
				// Points
				style.image = new ol.style.Icon({
					src: properties.icon,
				});
			return style;
		},
		hoverStyleOptions: {
			// Lines & polygons
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 3,
			})
		},
	}),
	map = new ol.Map({
		target: 'map',
		layers: [layerGeoBBgis],
		controls: controlsCollection({
			baseLayers: layersCollection(),
			controlPermalink: {
				display: mapType == 'index',
			},
		}),
	});

switch (mapType) {
	case 'view':
		map.addLayer( // Cadre définissant la position
			layerGeoJson({
				displayPointId: 'cadre-coords',
				geoJsonId: 'cadre-json',
				focus: 16,
				styleOptions: {
					image: new ol.style.Icon({
						src: 'assets/MyOl/examples/cadre.png',
					}),
				},
			}));
		break;

	case 'point':
		map.addLayer(layerGeoJson({
			displayPointId: 'marker',
			geoJsonId: 'geojson',
			focus: 16,
			dragPoint: true,
			singlePoint: true,
			styleOptions: {
				image: new ol.style.Icon({
					src: 'assets/MyOl/examples/viseur.png',
				}),
			},
		}));
		break;

//TODO BUG une ligne surimposée en viewtopic ??? le marqueur avec un json ?
	case 'line':
		map.addLayer(layerGeoJson({
			geoJsonId: 'geojson',
			snapLayers: [layerGeoBBgis],
			titleModify: 'Modification d‘une ligne:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer et déplacer un sommet pour modifier une ligne\n' +
				'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
				'Alt+cliquer sur un sommet pour le supprimer\n' +
				'Alt+cliquer sur un segment à supprimer dans une ligne pour la couper\n' +
				'Joindre les extrémités deux lignes pour les fusionner\.n',
			titleLine: 'Création d‘une ligne:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
				'double cliquer pour terminer.\n' +
				'Cliquer sur une extrémité d‘une ligne pour l‘étendre.',
		}));
		break;

	case 'poly':
		map.addLayer(layerGeoJson({
			geoJsonId: 'geojson',
			snapLayers: [layerGeoBBgis],
			titleModify: 'Modification d‘un polygone:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer et déplacer un sommet pour modifier un polygone\n' +
				'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
				'Alt+cliquer sur un sommet pour le supprimer\n' +
				'Joindre un sommet de chaque polygone et Alt+cliquer pour les fusionner' +
				'Ctrl+Alt+cliquer sur un polygone pour le supprimer.',
			titlePolygon: 'Création d‘un polygone:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer sur la carte et sur chaque point désiré pour dessiner un polygone,\n' +
				'double cliquer pour terminer.\n' +
				'Si le nouveau polygone est entièrement compris dans un autre, il crée un "trou".',
		}));
		break;
}