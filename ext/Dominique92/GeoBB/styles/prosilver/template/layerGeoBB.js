// Resize map
if (jQuery.ui)
	$('#map').resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});

var map = new ol.Map({
		target: 'map',
		controls: controlsCollection(typeof controlOptions == 'object' ? controlOptions : {})
			.concat(controlLayerSwitcher()),
		layers: [
			layerVectorCluster(
				layerGeoBBPoi({
					host: '', // Relative adress
					selectorName: 'geobb-features',
					maxResolution: 100,
					distance: 50,
				})
			),
			layerVectorCluster(
				layerGeoBBCluster({
					host: '',
					selectorName: 'geobb-features',
					minResolution: 100,
					distance: 50,
				})
			),
		],
	}),

	// Point marker
	marker = layerEditGeoJson({
		geoJsonId: 'geo_json',
		displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point-marker',
		singlePoint: true,
		dragPoint: script == 'posting',
		focus: 15,
		styleOptions: {
			image: new ol.style.Icon({
				src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/' + script + '.png',
			}),
		},
	});

if (script == 'viewtopic')
	map.addLayer(marker);

if (script == 'posting' && mapType == 'point')
	map.addLayer(marker);

if (script == 'posting' && mapType == 'line')
	map.addLayer(layerEditGeoJson({
		geoJsonId: 'geojson',
		titleModify: 'Modification d‘une ligne, d‘un polygone:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer et déplacer un sommet pour modifier une ligne ou un polygone\n' +
			'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
			'Alt+cliquer sur un sommet pour le supprimer\n' +
			'Alt+cliquer sur un segment à supprimer dans une ligne pour la couper\n' +
			'Alt+cliquer sur un segment à supprimer d‘un polygone pour le transformer en ligne\n' +
			'Joindre les extrémités deux lignes pour les fusionner\n' +
			'Joindre les extrémités d‘une ligne pour la transformer en polygone\n' +
			'Ctrl+Alt+cliquer sur une ligne ou un polygone pour les supprimer',
		titleLine: 'Création d‘une ligne:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
			'double cliquer pour terminer.\n' +
			'Cliquer sur une extrémité d‘une ligne pour l‘étendre',
		titlePolygon: 'Création d‘un polygone:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner un polygone,\n' +
			'double cliquer pour terminer.\n' +
			'Si le nouveau polygone est entièrement compris dans un autre, il crée un "trou".',
	}));