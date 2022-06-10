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
			noLabel: scriptName == 'posting',
			noClick: scriptName == 'posting',
		}),

		// High map resolution : clusters
		layerGeoBB({
			host: '', // Relative adress
			subLayer: 'cluster',
			selectorName: 'geobb-features',
			minResolution: 100,
			distance: 30,
			noLabel: scriptName == 'posting',
			noClick: scriptName == 'posting',
		}),

		mapType == 'point' ?
		layerMarker({
			src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/' + scriptName + '.svg',
			focus: 15,
			dragable: scriptName == 'posting',
			zIndex: 10,
		}) :

		// Line or polygon
		layerEditGeoJson({
			geoJsonId: 'marker-json',
			focus: 15,
			titleModify: scriptName != 'posting' ? '' : 'Modification d‘une ligne:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer et déplacer un sommet pour modifier une ligne\n' +
				'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
				'Alt+cliquer sur un sommet pour le supprimer\n' +
				'Alt+cliquer sur un segment à supprimer dans une ligne pour la couper\n' +
				'Joindre les extrémités deux lignes pour les fusionner\n' +
				'Ctrl+Alt+cliquer sur une ligne pour la supprimer',
			titleLine: scriptName != 'posting' ? '' : 'Création d‘une ligne:\n' +
				'Activer ce bouton (couleur jaune) puis\n' +
				'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
				'double cliquer pour terminer.\n' +
				'Cliquer sur une extrémité d‘une ligne pour l‘étendre',
		}),
	],
});