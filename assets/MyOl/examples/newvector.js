// Vector layer
function layerMassif() {
	return layerJson({
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/polygones?type_polygon=1',

		styleOptions: function(feature) {
			return {
				fill: new ol.style.Fill({
					color: feature.get('couleur'),
				}),
				text: new ol.style.Text({
					font: '14px Calibri,sans-serif',
					backgroundStroke: new ol.style.Stroke({
						color: 'black',
					}),
					backgroundFill: new ol.style.Stroke({
						color: 'yellow',
					}),
					text: feature.get('nom'),
					padding: [0, 3, 0, 3],
				}),
			};
		},
	});
}

function layerWRI() {
	return layerJson({
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/bbox?nb_points=all&type_points=7,10,9,23,6,3,28&bbox=',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},
		normalize: function(f) {
			f.set('name', f.get('nom'));
			f.set('link', f.get('lien'));
			f.set('icon', '//www.refuges.info/images/icones/' + f.get('type').icone + '.svg');
		},
		clusterDistance: 32,
	});
}

function layerChem() {
	return layerJson({
		urlBase: '//chemineur.fr/',
		urlSuffix: 'ext/Dominique92/GeoBB/gis.php?bbox=',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},
		clusterDistance: 32,
	});
}

function layerJson(options) {
	let pixelRatio = 0;

	const source = new ol.source.Vector({
			format: new ol.format.GeoJSON(),
			strategy: options.urlBbox ? ol.loadingstrategy.bbox : ol.loadingstrategy.all,
			url: function(extent, resolution, projection) {
				//TODO Retreive checked parameters
				/*			let list = permanentCheckboxList(options.selectorName).filter(
									function(evt) {
										return evt !== 'on'; // Except the "all" input (default value = "on")
									}),*/

				const bbox = ol.proj.transformExtent(
					extent,
					projection.getCode(),
					'EPSG:4326' // Received projection
				);

				return options.urlBase + // url base that can varry (server name, ...)
					options.urlSuffix + // url suffix to be defined separately from the urlBase
					(options.urlBbox ? options.urlBbox(bbox) : '');
			},
		}),

		clusterSource = !options.clusterDistance ? source :
		new ol.source.Cluster({
			distance: options.clusterDistance,
			source: source,
			geometryFunction: function(feature) {
				if (feature.getGeometry().getGeometries)
					//TODO getInteriorPoint() for polygons
					//	return feature.getGeometry().getInteriorPoints().getPoint(0);
					if (feature.getGeometry().getGeometries)
						return;
				return feature.getGeometry();
			}
		}),

		layer = new ol.layer.Vector({
			source: clusterSource,
			style: function(feature) {
				const style = new ol.style.Style(typeof options.styleOptions == 'function' ?
					options.styleOptions(feature) :
					options.styleOptions || {}
				);

				if (feature.getProperties().features) {
					if (feature.getProperties().features.length == 1)
						// Only 1 feature in the cluster, display it
						feature = feature.getProperties().features[0];
					else {
						// This is a cluster, display a circle with the number
						style.setImage(new ol.style.Circle({
							radius: 14,
							stroke: new ol.style.Stroke({
								color: 'blue',
							}),
							fill: new ol.style.Fill({
								color: 'white',
							}),
						}));

						style.setText(new ol.style.Text({
							font: '14px Calibri,sans-serif',
							stroke: new ol.style.Stroke({
								color: 'blue',
							}),
							fill: new ol.style.Fill({
								color: 'blue',
							}),
							text: feature.get('features').length.toString(),
						}));
					}
				}

				const icon = feature.get('icon'); //TODO mettre en option ???
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
		// get the transform ratio from the layer frameState
		const ratio = evt.frameState.pixelToCoordinateTransform[0];

		if (pixelRatio != ratio) { // Only when changed
			pixelRatio = ratio;

			// Tune the clustering distance depending on the transform ratio
			if (typeof clusterSource.setDistance == 'function')
				clusterSource.setDistance(Math.max(8, Math.min(60, ratio)));
		}
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
		}),
		hoverStyle = new ol.style.Style({
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
				if (!feature.getProperties().features) {
					hoverStyle.getText().setText(feature.get('name'));
				} else if (feature.getProperties().features.length == 1) {
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

	let hoveredFeature;
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
				} else if (feature.getProperties().features && feature.getProperties().features.length == 1)
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

			if (feature &&
				feature.getProperties().features &&
				feature.getProperties().features.length == 1
			)
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
			//TODO zoom when click a cluster or a polygon (massifs)
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
		center: [700000, 5700000], // Maurienne
		//center: [260000, 6250000], // Paris
		zoom: 11,
	}),
});

//map.addLayer(layerWRI());
//map.addLayer(layerMassif());
map.addLayer(layerChem());