// Vector layer
function layerChem() {
	return layerVector({
		urlBase: '//chemineur.fr/',
		urlSuffix: 'ext/Dominique92/GeoBB/gis.php?bbox=',
	});
}

function layerWRI() {
	return layerVector({
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/bbox?nb_points=all&type_points=7,10,9,23,6,3,28&bbox=',
		normalize: function(f) {
			f.set('name', f.get('nom'));
			f.set('link', f.get('lien'));
			f.set('icon', '//www.refuges.info/images/icones/' + f.get('type').icone + '.svg');
		},
	});
}

function layerVector(options) {
	const source = new ol.source.Vector({
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			url: function(extent, resolution, projection) {
				//TODO Retreive checked parameters
				/*			let list = permanentCheckboxList(options.selectorName).filter(
									function(evt) {
										return evt !== 'on'; // Except the "all" input (default value = "on")
									}),*/
				let bbox = null;

				if (ol.extent.getWidth(extent) != Infinity) {
					bbox = ol.proj.transformExtent(
						extent,
						projection.getCode(),
						'EPSG:4326' // Received projection
					);
				}
				return options.urlBase + // url base that can define different services (E.G. server domain and/or directory)
					(options.urlSuffix || '') + // url suffix to be defined separately from the urlBase
					bbox.join(','); //TODO option sans BBox
			},
		}),
		clusterSource = new ol.source.Cluster({
			distance: 32,
			source: source,
			/*	geometryFunction: function(feature) {
					//TODO getInteriorPoint() for polygons
					return feature.getGeometry();
				}*/
		}),
		layer = new ol.layer.Vector({
			source: clusterSource,
			style: function(feature) {
				const style = new ol.style.Style({
					image: new ol.style.Circle({
						radius: 14,
						stroke: new ol.style.Stroke({
							color: 'blue',
						}),
						fill: new ol.style.Fill({
							color: 'white',
						}),
					}),
					text: new ol.style.Text({
						font: '14px Calibri,sans-serif',
						stroke: new ol.style.Stroke({
							color: 'blue',
						}),
						fill: new ol.style.Fill({
							color: 'blue',
						}),
					}),
				});

				if (feature.getProperties().features.length == 1)
					feature = feature.getProperties().features[0];
				else
					style.getText().setText(feature.get('features').length.toString());

				const icon = feature.get('icon');
				if (icon)
					style.setImage(new ol.style.Icon({
						src: icon,
					}));

				return style;
			},
		});

	// Normalize properties
	if (typeof options.normalize == 'function')
		source.on('featuresloadend', function(evt) {
			for (let k in evt.features)
				options.normalize(evt.features[k]);
		});

	// Tune the clustering distance following the zoom leval
	layer.on('prerender', function(evt) {
		clusterSource.setDistance(
			Math.max(8, Math.min(60, // Distance bounds
				// get the transform ratio from the layer frameState
				evt.frameState.pixelToCoordinateTransform[0]
			)));
	});

	return layer;
}

/**
 * Control to display labels on hover a feature & execute click
 * feature.properties.name : name to label the feature
 * feature.properties.link : link to call when click on the feature
 */
function controlHover() {
	const control = new ol.control.Control({
		element: document.createElement('div'), //HACK No button
	});

	let hoveredFeature;

	const hoverStyle = new ol.style.Style({
			text: new ol.style.Text({
				font: '16px Calibri,sans-serif',
				fill: new ol.style.Fill({
					color: 'blue',
				}),
				stroke: new ol.style.Stroke({
					color: 'white',
					width: 10,
				}),
			}),
		}),
		hoverLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			zIndex: 10, // Above the features
			style: function(feature) {
				if (feature.getProperties().features.length == 1) {
					feature = feature.getProperties().features[0];

					hoverStyle.getText().setText(feature.get('name'));
				} else {
					const fs = feature.getProperties().features,
						txts = [];
					for (let fss in fs)
						txts.push(fs[fss].get('name'));
					hoverStyle.getText().setText(txts.length < 8 ?
						txts.join('\n') :
						txts.length + ' elements'
					);
				}
				return hoverStyle;
			},
		});

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		map.addLayer(hoverLayer);

		// Hovering a feature
		map.on('pointermove', function(evt) {
			const pixel = map.getEventPixel(evt.originalEvent),
				feature = map.forEachFeatureAtPixel(pixel, function(feature) {
					return feature;
				});

			if (feature !== hoveredFeature) {
				if (hoveredFeature) {
					hoverLayer.getSource().removeFeature(hoveredFeature);
					map.getViewport().style.cursor = 'default';
				} else if (feature.getProperties().features.length == 1)
					map.getViewport().style.cursor = 'pointer';

				if (feature)
					hoverLayer.getSource().addFeature(feature);

				hoveredFeature = feature;
				//TODO more labelling when hover
			}
		});

		// Click action
		map.on('click', function(evt) {
			let feature = map.forEachFeatureAtPixel(evt.pixel, function(feature) {
				return feature;
			});

			if (feature && feature.getProperties().features.length == 1)
				feature = feature.getProperties().features[0];

			if (feature) {
				const link = feature.get('link');
				if (link) {
					if (evt.originalEvent.ctrlKey) {
						const tab = window.open(link, '_blank');
						if (evt.originalEvent.shiftKey)
							tab.focus();
					} else
						window.location = link;
				}
			}
		});
	};
	return control;
}

/**
 * Example
 */
// Map
const map = new ol.Map({
	target: 'map',
	controls: [
		controlLayerSwitcher({
			baseLayers: layersCollection(),
		}),
		new ol.control.Attribution(),
		controlMousePosition(),
		new ol.control.Zoom(),
		controlFullScreen(),
		controlHover(),
	],
	view: new ol.View({
		center: [700000, 5700000],
		zoom: 11,
	}),
});

map.addLayer(layerWRI());
map.addLayer(layerChem());