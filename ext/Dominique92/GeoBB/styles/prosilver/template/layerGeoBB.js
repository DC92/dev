var map = new ol.Map({
	target: 'map',
	view: new ol.View({
		enableRotation: false,
	}),

	controls: controlsCollection()
		.concat(controlLayerSwitcher({
			layers: layerTileCollection(),
			additionalSelectorId: 'additional-selector',
		})),

/* //TODO DELETE
	Wcontrols: controlsCollection({
			permalink: {
				display: mapType == 'index',
			},
		})
		.concat(controlLayerSwitcher()),
*/
	layers: [
		layerClusterGeoBB({ // Chemineur
		//selectorName: 'select-chem',
		}),
	],

/* //TODO DELETE
	layers: layersCluster({
		host: '', // Relative address
		layer: layerGeoBB,
		selectorName: 'select-chem',
		attribution: 'Chemineur',
		noLabel: scriptName == 'posting',
		noClick: scriptName == 'posting',
		hoverStyleOptFnc: function(feature, properties) {
			properties.attribution = null;
			return styleOptFullLabel(feature, properties);
		},
	}),
	*/
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
			//BEST mettre dans le html
			// Modify
			'<p><u>Déplacer un sommet:</u> cliquer sur le sommet et le déplacer</p>' +
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