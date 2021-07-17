// Vector layer
function geoJsonLayer(options) {
	options = Object.assign({
		format: 'GeoJSON',
		loadingstrategy: 'bbox', // | 'all' | 'bbox' //TODO une option pour couche clusterisée
		styleOptionsFunction: function(styleOptions) {
			return styleOptions;
		},
	}, options);

	options.styleOptions = options.styleOptions || {};
	options.hoverStyleOptions = options.hoverStyleOptions || {};

	options.labelStyleOptions = Object.assign({
		textBaseline: 'bottom',
		offsetY: -13, // Compensate bottom
		padding: [1, 3, 0, 3],
		font: '14px Calibri,sans-serif',
		backgroundFill: new ol.style.Fill({
			color: 'yellow',
		}),
	}, options.labelStyleOptions);

	options.clusterStyleOptions = Object.assign({
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
	}, options.clusterStyleOptions);

	const source = new ol.source.Vector({
			format: new ol.format[options.format](),
			strategy: ol.loadingstrategy[options.loadingstrategy],
			url: function(extent, resolution, projection) {
				//BEST gérer les msg erreur
				return options.urlHost +
					options.urlPath(
						ol.proj.transformExtent( // BBox
							extent,
							projection.getCode(),
							'EPSG:4326' // Received projection
						),
						options.selectorList,
						resolution, // === zoom level
						options
					);
			},
		}),

		// Optional clusterisation
		clusterSource = !options.clusterDistance ? source :
		new ol.source.Cluster({
			distance: options.clusterDistance,
			source: source,
			geometryFunction: function(feature) {
				// Generate a center point to manage clusterisations
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
			},
		}),

		layer = new ol.layer.Vector({
			source: clusterSource,
			style: style,
		});

	layer.options = options; //HACK Memorize for further use

	if (options.selectorName)
		memCheckbox(options.selectorName, function(list) {
			options.selectorList = list;
			layer.setVisible(list.length > 0);
			if (list.length > 0)
				source.refresh();
		});

	// Normalize properties
	if (typeof options.computeProperties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				options.computeProperties(evt.features[p], layer);
		});

	// Tune the clustering distance following the zoom level
	let previousRatio = 0;
	layer.on('prerender', function(evt) {
		// Get the transform ratio from the layer frameState
		const ratio = evt.frameState.pixelToCoordinateTransform[0];

		// Refresh if we change to clustered url
		if (previousRatio > 100 ^ ratio > 100) //TODO remplacer 100 par une option
			source.refresh();

		// Tune the clustering distance depending on the transform ratio
		if (previousRatio != ratio && // Only when changed
			typeof clusterSource.setDistance == 'function')
			clusterSource.setDistance(Math.max(8, Math.min(60, ratio)));

		previousRatio = ratio;
	});

	// Define the style of the cluster point & the groupped features
	function style(feature) {
		const features = feature.get('features') || [feature],
			icon = features[0].get('icon'),
			label = features[0].get('label'),
			area = ol.extent.getArea(
				features[0].getGeometry().getExtent()
			),
			styleOptions = options.styleOptionsFunction(
				options.styleOptions,
				feature
			),
			labelStyleOptions = Object.assign({}, options.labelStyleOptions);

		feature.options = options; //HACK Memorize the options in the feature for hover display

		// Clusters
		if (features.length > 1 ||
			parseInt(features[0].get('cluster'))) {
			let clusters = 0;
			for (let f in features)
				clusters += parseInt(features[f].get('cluster')) || 1;

			const clusterStyleOptions = Object.assign({}, options.clusterStyleOptions);
			clusterStyleOptions.text.setText(clusters.toString());
			feature.set('hover', clusters.toString() + ' éléments');

			return new ol.style.Style(clusterStyleOptions);
		}

		// Single feature (point, line or poly)
		// Add a permanent label
		if (!options.clusterDistance || // If no clusterisation 
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
		} else
			// Add icon if one is defined in the properties
			if (icon)
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
	});

	const hoverLayer = new ol.layer.Vector({
		source: new ol.source.Vector(),
		zIndex: 1, // Above the features

		style: function(feature) {
			//BEST options label on hover point /ligne / surface ???
			const features = feature.get('features') || [feature],
				titles = [],
				hover = feature.get('hover'),
				labelStyleOptions = Object.assign({}, feature.options.labelStyleOptions),
				hoverStyleOptions = Object.assign({}, feature.options.hoverStyleOptions);

			if (hover)
				// Big clusters
				titles.push(hover);
			else
				// Clusters
				if (features.length > 1)
					for (let f in features)
						titles.push(features[f].get('name'));
				else
					// Point
					titles.push(features[0].get('hover'));

			labelStyleOptions.text = titles.join('\n');
			hoverStyleOptions.text = new ol.style.Text(
				labelStyleOptions
			);

			return new ol.style.Style(hoverStyleOptions);
		},
	});

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
					options = feature.options, // Mem it locally
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