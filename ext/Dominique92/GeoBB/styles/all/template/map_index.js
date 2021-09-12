var map = new ol.Map({
	target: 'map',
	controls: controlsCollection({
		controlPermalink: {
			display: true,
		},
	}).concat(controlLayerSwitcher()),
	layers: [
		layerVectorCluster(
			layerGeoBBPoi({
				selectorName: 'geobb-features',
				maxResolution: 100,
				distance: 50,
			})
		),
		layerVectorCluster(
			layerGeoBBCluster({
				selectorName: 'geobb-features',
				minResolution: 100,
				distance: 50,
			})
		),
	],
});

// Resize map
if (jQuery.ui)
	$('#map').resizable({
		handles: 's,w,sw', // 2 côtés et 1 coin

		resize: function(event, ui) {
			ui.position.left = ui.originalPosition.left; // Reste à droite de la page
			map.updateSize(); // Reaffiche tout le nouveau <div>
		},
	});