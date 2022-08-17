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
			'<p>Déplacer un sommet : cliquer sur le sommet et le déplacer</p>' +
			'<p>Ajouter un sommet au milieu d&apos;un segment : cliquer le long du segment puis déplacer</p>' +
			'<p>Supprimer un sommet : Alt+cliquer sur le sommet</p>' +
			'<p>Couper une ligne en deux : Alt+cliquer sur le segment à supprimer</p>' +
			'<p>Fusionner deux lignes : déplacer l&apos;extrémité d&apos;une ligne pour rejoindre l&apos;autre</p>' +
			'<p>Supprimer une ligne : Ctrl+Alt+cliquer sur un segment</p>',
			// Line
			'<p>Pour créer une ligne :</p>' +
			'<p>Cliquer sur l&apos;emplacement du début</p>' +
			'<p>Puis sur chaque sommet</p>' +
			'<p>Double cliquer sur le dernier sommet pour terminer</p>' +
			'<p><hr/>Cliquer sur une extrémité d&apos;une ligne existante pour l&apos;étendre</p>',
		],
	}));