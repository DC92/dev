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
		displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point_marker',
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