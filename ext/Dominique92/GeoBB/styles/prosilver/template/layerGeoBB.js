var map = new ol.Map({
		target: 'map',
		view: new ol.View({
			enableRotation: false,
		}),
		controls: controlsCollection({
				permalink: {
					display: mapType == 'index',
				},
			})
			.concat(controlLayerSwitcher()),
		layers: [
			// Low map resolution : points
			layerGeoBB({
				host: '', // Relative adress
				selectorName: 'geobb-features',
				maxResolution: 100,
				distance: 30,
				attribution: 'Chemineur',
			}),
			// High map resolution : clusters
			layerGeoBB({
				host: '', // Relative adress
				subLayer: 'cluster',
				selectorName: 'geobb-features',
				minResolution: 100,
				distance: 30,
			}),
		],
	});

if (scriptName == 'viewtopic')
	map.addLayer(layerMarker('ext/Dominique92/GeoBB/styles/prosilver/theme/images/viewtopic.svg'));

if (scriptName == 'posting' && mapType == 'point')
	map.addLayer(layerMarker('ext/Dominique92/GeoBB/styles/prosilver/theme/images/posting.svg'), true);

if (scriptName == 'posting' && mapType == 'line')
	map.addLayer(layerEditGeoJson({
		geoJsonId: 'marker-json',
		focus: 15,
		titleModify: 'Modification d‘une ligne:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer et déplacer un sommet pour modifier une ligne\n' +
			'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
			'Alt+cliquer sur un sommet pour le supprimer\n' +
			'Alt+cliquer sur un segment à supprimer dans une ligne pour la couper\n' +
			'Joindre les extrémités deux lignes pour les fusionner\n' +
			'Ctrl+Alt+cliquer sur une ligne pour la supprimer',
		titleLine: 'Création d‘une ligne:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
			'double cliquer pour terminer.\n' +
			'Cliquer sur une extrémité d‘une ligne pour l‘étendre',
	}));