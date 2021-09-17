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
});

// viewtopic marker
if (script == 'viewtopic')
	map.addLayer(layerEditGeoJson({
		geoJsonId: 'geo_json',
		singlePoint: true,
		focus: 15,
		displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point-marker',
		styleOptions: {
			image: new ol.style.Icon({
				src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/cadre.png',
			}),
		},
	}));