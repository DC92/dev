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
			host: '', // Relative address
			selectorName: 'geobb-features',
			maxResolution: 100,
			distance: 30,
			attribution: 'Chemineur',
			noLabel: scriptName == 'posting',
			noClick: scriptName == 'posting',
			hoverStyleOptionsFunction: function(feature, properties) {
				properties.attribution = null;
				return styleOptionsFullLabel(properties);
			},
		}),

		// High map resolution : clusters
		layerGeoBB({
			host: '', // Relative address
			subLayer: 'cluster',
			selectorName: 'geobb-features',
			minResolution: 100,
			distance: 30,
			noLabel: scriptName == 'posting',
			noClick: scriptName == 'posting',
		}),
	],
});

if (mapType == 'point')
	map.addLayer(layerMarker({
		src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/' + scriptName + '.svg',
		focus: 15,
		dragable: scriptName == 'posting',
		zIndex: 10,
	}));

if (mapType == 'line' && scriptName == 'posting')
	map.addLayer(layerEditGeoJson({
		geoJsonId: 'marker-json',
		focus: 15,
		help: [
			// Modify
			'<p>Cliquer et déplacer un sommet pour modifier une ligne</p>' +
			'<p>Cliquer sur un segment puis déplacer pour créer un sommet</p>' +
			'<p>Alt+cliquer sur un sommet pour le supprimer</p>' +
			'<p>Alt+cliquer sur un segment à supprimer dans une ligne pour la couper</p>' +
			'<p>Joindre les extrémités de deux lignes pour les fusionner</p>' +
			'<p>Ctrl+Alt+cliquer sur une ligne pour la supprimer</p>',
			// Line
			'<p>Cliquer sur la carte pour créer une nouvelle ligne,' +
			'<p>Cliquer sur une extrémité d&apos;une ligne existante pour l&apos;étendre,' +
			'<p>puis sur chaque point pour dessiner la nouvelle ligne,</p>' +
			'<p>double cliquer pour terminer.</p>',
		],
	}));