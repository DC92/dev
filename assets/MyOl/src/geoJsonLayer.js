/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 * Hover & click
 * Features clusters
 * Specific source for hign resolution zoom
 */
function geoJsonLayer(options) {
	const baseOptions = Object.assign({
			format: new ol.format.GeoJSON(),
			url: url,
		}, options),

		// options.styleOptions, // Base feature format : Object or function(feature)

		// Common label text format
		labelStyleOptions = Object.assign({
			textBaseline: 'bottom',
			offsetY: -13, // Compensate the bottom textBaseline
			padding: [1, 3, 0, 3],
			font: '14px Calibri,sans-serif',
			backgroundFill: new ol.style.Fill({
				color: 'yellow',
			}),
		}, options.labelStyleOptions),

		// Style when hovering a feature
		hoverStyleOptions = Object.assign({
			// We assign the same text style to the hover label
			text: new ol.style.Text(
				labelStyleOptions //BEST specific hoverLabelStyleOptions
			),
		}, options.hoverStyleOptions),

		// Specific format of clusters bullets
		clusterStyleOptions = Object.assign({
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
			}),
		}, options.clusterStyleOptions),

		// Options of the source if resolution > options.alt.minResolution
		altOptions = Object.assign({},
			baseOptions,
			options.alt, {
				url: function(extent, resolution, projection) {
					return url(extent, resolution, projection, altOptions);
				}
			}
		),

		// Basic source
		source = new ol.source.Vector(baseOptions),

		// Source if clusterized
		clusterSource = baseOptions.clusterDistance ?
		new ol.source.Cluster({
			distance: baseOptions.clusterDistance,
			source: source,
			geometryFunction: centerPoint,
		}) :
		source,

		// Alternative source
		altSource = options.alt ? new ol.source.Vector(altOptions) : null,

		// Alternative cluster
		clusterAltSource = altOptions.clusterDistance ?
		new ol.source.Cluster({
			distance: altOptions.clusterDistance,
			source: altSource,
			geometryFunction: centerPoint,
		}) :
		altSource,

		// Layer
		layer = new ol.layer.Vector({
			source: clusterSource,
			style: style,
			render: function(frameState, target) {
				prepareFrame(frameState.pixelToCoordinateTransform[0]);

				//HACK to be informed of render to be run
				return ol.layer.Vector.prototype.render.call(this, frameState, target);
			},
		});

	function centerPoint(feature) {
		// Generate a center point to manage clusterisations
		return new ol.geom.Point(
			ol.extent.getCenter(
				feature.getGeometry().getExtent()
			)
		);
	}

	function url(extent, resolution, projection, options) {
		options = options || baseOptions;

		//BEST gérer les msg erreur
		return options.urlHost +
			options.urlPath(
				ol.proj.transformExtent( // BBox
					extent,
					projection.getCode(),
					'EPSG:4326' // Received projection
				),
				memCheckbox(options.selectorName, function(list) {
					layer.setVisible(list.length > 0);
					if (list.length > 0)
						source.refresh();
				}),
				resolution, // === zoom level
				options
			);
	}

	// Normalize properties
	if (typeof baseOptions.computeProperties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				baseOptions.computeProperties(evt.features[p], baseOptions);
		});

	let previousResolution = 0;

	function prepareFrame(resolution) {
		// Change the source if > alt.minResolution
		if (options.alt)
			layer.setSource(options.alt.minResolution > resolution ?
				clusterSource :
				clusterAltSource
			);

		// Refresh if we change the source options
		if (options.alt &&
			options.alt.minResolution > resolution ^
			options.alt.minResolution > previousResolution)
			source.refresh();

		// Tune the clustering distance depending on the transform resolution
		if (previousResolution != resolution && // Only when changed
			typeof clusterSource.setDistance == 'function')
			clusterSource.setDistance(Math.max(8, Math.min(60, resolution)));

		previousResolution = resolution;
	}

	// Define the style of the cluster point & the groupped features
	function style(feature) {
		const features = feature.get('features') || [feature],
			icon = features[0].get('icon'),
			label = features[0].get('label'),
			area = ol.extent.getArea(
				features[0].getGeometry().getExtent()
			),
			styleOptions = typeof baseOptions.styleOptions == 'function' ?
			options.styleOptions(feature) :
			options.styleOptions || {};

		//HACK Memorize the options in the feature for hover display
		feature.hoverStyleOptions = hoverStyleOptions;

		// Clusters
		if (features.length > 1 ||
			parseInt(features[0].get('cluster'))) {
			let clusters = 0;
			for (let f in features)
				clusters += parseInt(features[f].get('cluster')) || 1;

			clusterStyleOptions.text.setText(clusters.toString());
			feature.set('hover', clusters.toString() + ' éléments');

			return new ol.style.Style(clusterStyleOptions);
		}

		// Single feature (point, line or poly)
		// Add a permanent label
		if (!baseOptions.clusterDistance || // If no clusterisation 
			(feature.get('features') // If not cluster marker 
			) && label) {
			labelStyleOptions.text = label;
			styleOptions.text = new ol.style.Text(labelStyleOptions);
		}

		// Include the feature in the cluster source (lines, polygons) to make it visible
		if (area) {
			const featureExists = clusterSource.forEachFeature(function(f) {
				if (features[0].ol_uid == f.ol_uid)
					return true;
			});

			if (!featureExists)
				clusterSource.addFeature(features[0]);
		} else if (icon)
			// Add icon if one is defined in the properties
			styleOptions.image = new ol.style.Icon({
				src: icon,
			});

		return new ol.style.Style(styleOptions);
	}

	return layer;
}

/**
 * Control to display labels on hovering & click
 * on features of vector layers having the following properties :
 * name : name of the feature
 * hover : full label on hover
 * link : go to a new URL when we click on the feature
 */
function controlHover() {
	const control = new ol.control.Control({
			element: document.createElement('div'), //HACK No button
		}),
		// Internal layer to temporary display hovered feature
		hoverLayer = new ol.layer.Vector({
			source: new ol.source.Vector(),
			zIndex: 1, // Above the features
			style: style,
		});

	function style(feature) {
		//BEST options label on hover point /ligne / surface ???
		const features = feature.get('features') || [feature],
			titles = [];

		if (feature.get('hover'))
			// Big clusters
			titles.push(feature.get('hover'));
		else
		if (features.length > 1)
			// Clusters
			for (let f in features)
				titles.push(features[f].get('name'));
		else
			// Point
			titles.push(features[0].get('hover'));

		feature.hoverStyleOptions.text.setText(titles.join('\n'));
		return new ol.style.Style(feature.hoverStyleOptions);
	}

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);
		map.addLayer(hoverLayer);

		let previousHoveredFeature;
		map.on(['pointermove', 'click'], function(evt) {
			// Get hovered feature
			const feature = map.forEachFeatureAtPixel(
				map.getEventPixel(evt.originalEvent),
				function(feature) {
					return feature;
				});

			if (feature) {
				const features = feature.get('features'),
					center = feature.getGeometry().getCoordinates(),
					link = (features ? features[0] : feature).get('link');

				if (evt.type == 'click') {
					// Single feature
					if (link) {
						if (evt.originalEvent.ctrlKey)
							window.open(link, '_blank').focus();
						else if (evt.originalEvent.shiftKey)
							// To specify feature open a new window
							window.open(link, '_blank', 'resizable=yes').focus();
						else
							window.location = link;
					}

					// Cluster
					else
						map.getView().animate({
							zoom: map.getView().getZoom() + 1,
							center: center,
						});
				}
			}

			// Make the hovered feature visible in a dedicated layer
			if (feature !== previousHoveredFeature) {
				if (previousHoveredFeature)
					hoverLayer.getSource().removeFeature(previousHoveredFeature);

				if (feature)
					hoverLayer.getSource().addFeature(feature);

				map.getViewport().style.cursor = feature ? 'pointer' : 'default';
				previousHoveredFeature = feature;
			}
		});
	};

	return control;
}