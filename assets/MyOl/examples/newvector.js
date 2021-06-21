// Vector layer
const styleLabel = new ol.style.Text({
	textBaseline: 'bottom',
	offsetY: 9, // Compensate bottom
	font: '14px Calibri,sans-serif',
	backgroundFill: new ol.style.Stroke({
		color: 'yellow',
	}),
	padding: [1, 3, 0, 3],
});

function layerJson(options) {
	const source = new ol.source.Vector({
			format: new ol.format.GeoJSON(),
			strategy: options.urlBbox ? ol.loadingstrategy.bbox : ol.loadingstrategy.all,
			url: function(extent, resolution, projection) {
				//TODO Retreive checked parameters
				/*			let list = permanentCheckboxList(options.selectorName).filter(
									function(evt) {
										return evt !== 'on'; // Except the "all" input (default value = "on")
									}),*/

				return options.urlBase + // url base that can varry (server name, ...)
					(options.urlSuffix || '') + // url suffix to be defined separately from the urlBase
					(!options.urlBbox ? '' :
						options.urlBbox(ol.proj.transformExtent(
							extent,
							projection.getCode(),
							'EPSG:4326' // Received projection
						))
					);
			},
		}),

		clusterSource = !options.clusterDistance ? source :
		new ol.source.Cluster({
			distance: options.clusterDistance,
			source: source,
			// Returns an ol.geom.Point as cluster calculation point for the feature. 
			geometryFunction: function(feature) {
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
			}
		}),

		style = function(feature) {
			const styleLocal = typeof options.style == 'function' ?
				options.style(feature) :
				options.style || new ol.style.Style();

			if (feature.getProperties().features) {
				if (feature.getProperties().features.length == 1) {
					// Only 1 feature in the cluster, display it
					feature = feature.getProperties().features[0];
					styleLocal.setText(styleLabel.clone());
					styleLocal.getText().setText(feature.get('name'));
					styleLocal.getText().setOffsetY(-13);
				} else {
					// This is a cluster, display a circle with the number
					styleLocal.setImage(new ol.style.Circle({
						radius: 14,
						stroke: new ol.style.Stroke({
							color: 'blue',
						}),
						fill: new ol.style.Fill({
							color: 'white',
						}),
					}));

					styleLocal.setText(new ol.style.Text({
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
			} else {
				// No clustering
				if (styleLocal.getText())
					styleLocal.getText().setText(feature.get('name'));
			}

			const icon = feature.get('icon'); //TODO mettre en option ???
			if (icon)
				styleLocal.setImage(new ol.style.Icon({
					src: icon,
				}));

			return styleLocal;
		},

		layer = new ol.layer.Vector({
			source: clusterSource,
			style: style,
		});

	// Normalize properties
	if (typeof options.normalize == 'function')
		source.on('featuresloadend', function(evt) {
			for (let k in evt.features)
				options.normalize(evt.features[k]);
		});

	// Tune the clustering distance following the zoom leval
	let pixelRatio = 0;

	layer.on('prerender', function(evt) {
		// Get the transform ratio from the layer frameState
		const ratio = evt.frameState.pixelToCoordinateTransform[0];

		// Tune the clustering distance depending on the transform ratio
		if (typeof clusterSource.setDistance == 'function')
			clusterSource.setDistance(Math.max(8, Math.min(60, ratio)));

		if (pixelRatio != ratio) { // Only when changed
			pixelRatio = ratio;

			// Switch to another layer above a zoom limit
			if (ratio > options.pixelRatioMax) {
				layer.setSource(options.layerAbove.getSource());
				layer.setStyle(options.layerAbove.getStyle());
			} else {
				layer.setSource(clusterSource);
				layer.setStyle(style);
			}
		}
	});

	return layer;
}

/**
 * Control to display labels on hovering a feature & execute click
 * feature.properties.name : name to label the feature
 * feature.properties.link : link to call when click on the feature
 */
function controlHover() {
	const control = new ol.control.Control({
			element: document.createElement('div'), //HACK No button
		}),
		hoverTextStyle = styleLabel.clone();

	hoverLayer = new ol.layer.Vector({
		source: new ol.source.Vector(),
		zIndex: 10, // Above the features
		style: function(feature) {
			if (!feature.getProperties().features) {
				hoverTextStyle.setText(feature.get('name'));
			} else if (feature.getProperties().features.length == 1) {
				feature = feature.getProperties().features[0];
				hoverTextStyle.setText(feature.get('label'));
				hoverTextStyle.setOffsetY(-14);
			} else {
				const fs = feature.getProperties().features,
					txts = [];
				for (let fss in fs)
					txts.push(fs[fss].get('name'));
				hoverTextStyle.setText(txts.length < 8 ?
					txts.join('\n') :
					txts.length + ' elements'
				);
			}
			return new ol.style.Style({
				text: hoverTextStyle,
			});
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
				if (hoveredFeature)
					hoverLayer.getSource().removeFeature(hoveredFeature);

				if (feature)
					hoverLayer.getSource().addFeature(feature);

				map.getViewport().style.cursor = feature ? 'pointer' : 'default';
				hoveredFeature = feature;
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
		});
	};
	return control;
}

/**
 * Example
 */
const layerMassif = layerJson({
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/polygones?type_polygon=1',
		normalize: function(f) {
			f.set('link', f.get('lien'));
			f.set('name', f.get('nom'));
		},

		style: function(feature) {
			return new ol.style.Style({
				fill: new ol.style.Fill({
					color: feature.get('couleur'),
				}),
				text: styleLabel,
			});
		},
	}),

	layerWRI = layerJson({
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/bbox?nb_points=all&type_points=7,10,9,23,6,3,28&bbox=',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},
		clusterDistance: 32,
		pixelRatioMax: 100,
		layerAbove: layerMassif,

		normalize: function(f) {
			// Hover label
			const label = [],
				desc = [];
			if (f.get('type').valeur)
				label.push(f.get('type').valeur.replace(/(^\w|\s\w)/g, m => m.toUpperCase())); //TODO remplacer par function
			if (f.get('coord').alt)
				desc.push(f.get('coord').alt + 'm');
			if (f.get('places').valeur)
				desc.push(f.get('places').valeur + '\u255E\u2550\u2555');
			if (desc.length)
				label.push(desc.join(', '));
			label.push(f.get('nom'));
			f.set('label', label.join('\n'));

			// Other displays
			f.set('name', f.get('nom'));
			f.set('link', f.get('lien'));
			f.set('icon', '//www.refuges.info/images/icones/' + f.get('type').icone + '.svg'); //TODO reprendre urlBase
		},
	}),

	layerChem = layerJson({
		urlBase: '//chemineur.fr/',
		urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=64&bbox=',
		//urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=8&bbox=',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},

		wstyle: function(feature) {
			return new ol.style.Style({
				//TODO utile ???
				stroke: new ol.style.Stroke({
					color: 'blue',
				}),
				fill: new ol.style.Fill({
					color: 'blue',
				}),
				//TODO fin utile ???
			});
		},
		clusterDistance: 32,
	});

map = new ol.Map({
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
		//center: [700000, 5700000], // Maurienne
		center: [260000, 6250000], // Paris
		zoom: 11,
	}),
});

//map.addLayer(layerMassif);
//map.addLayer(layerWRI);
map.addLayer(layerChem);