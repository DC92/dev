// Features de la couche
const layerGeoBB = layerVectorURL({
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
		layers: [layerGeoBB],
		controls: controlsCollection({
			//TODO get it from config.php
			geoKeys: {
				// Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
				ign: 'hcxdz5f1p9emo4i1lch6ennl',
				// Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
				thunderforest: 'ee751f43b3af4614b01d1bce72785369',
				// Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
				bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt'
				// SwissTopo : You need to register your domain in
				// https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
			},
		}),
	});

switch (map_type) {
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

	case 'line':
		map.addLayer(layerGeoJson({
			geoJsonId: 'geojson',
			snapLayers: [layerGeoBB],
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
			snapLayers: [layerGeoBB],
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