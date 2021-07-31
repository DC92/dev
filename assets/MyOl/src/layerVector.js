//TODO protéger les variables qui peuvent être nulles

/**
 * Misc styles
 */
var styleOptions = {
	// Common label text format
	label: {
		textBaseline: 'bottom',
		offsetY: -13, // Compensate the bottom textBaseline
		padding: [1, 3, 0, 3],
		font: '14px Calibri,sans-serif',
		backgroundFill: new ol.style.Fill({
			color: 'yellow',
		}),
	},
	// Specific format of clusters bullets
	cluster: {
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
	},
};


/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 */
function layerVector(options) {
	const baseOptions = Object.assign({
			urlHost: '',
			urlPath: '',
			url: url,
			format: new ol.format.GeoJSON(),
		}, options),

		// options.styleOptions, // Base feature format : Object or function(feature)
		labelStyleOptions = Object.assign(styleOptions.label, options.labelStyleOptions),
		clusterStyleOptions = Object.assign({}, styleOptions.cluster, options.clusterStyleOptions),

		// Style when hovering a feature
		hoverStyleOptions = Object.assign({
			// We assign the same text style to the hover label
			text: new ol.style.Text(
				labelStyleOptions //BEST specific hoverLabelStyleOptions
			),
		}, options.hoverStyleOptions),

		source = new ol.source.Vector(baseOptions),
		layer = new ol.layer.Vector({
			source: source,
			style: style,
		});

	if (options.selectorName)
		memCheckbox(options.selectorName, function(list) {
			layer.setVisible(list.length > 0);
			if (list.length > 0)
				source.refresh();
		});

	function url(extent, resolution, projection, opt) {
		//BEST gérer les msg erreur
		const options = opt || baseOptions;

		const urlPath = typeof options.urlPath == 'function' ?
			options.urlPath(
				ol.proj.transformExtent( // BBox
					extent,
					projection.getCode(),
					'EPSG:4326' // Received projection
				),
				readCheckbox(options.selectorName),
				resolution, // === zoom level
				options
			) :
			options.urlPath;

		return options.urlHost + urlPath;
	}

	// Normalize properties
	if (typeof baseOptions.computeProperties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				baseOptions.computeProperties(evt.features[p], baseOptions);
		});

	function style(feature) {
		const icon = feature.get('icon'),
			cluster = feature.get('cluster'),
			label = feature.get('label'),
			styleOptions = typeof baseOptions.styleOptions == 'function' ?
			options.styleOptions(feature) :
			options.styleOptions || {};

		//HACK Memorize the options in the feature for hover display
		feature.hoverStyleOptions = hoverStyleOptions;

		if (cluster) {
			clusterStyleOptions.text.setText(cluster.toString());
			//TODO BEST mettre la liste des 5 premiers titres
			feature.set('hover', cluster.toString() + ' éléments');

			return new ol.style.Style(clusterStyleOptions);
		}

		if (icon)
			// Add icon if one is defined in the properties
			styleOptions.image = new ol.style.Icon({
				src: icon,
			});

		if (label) {
			labelStyleOptions.text = label;
			styleOptions.text = new ol.style.Text(labelStyleOptions);
		}

		return new ol.style.Style(styleOptions);
	}

	return layer;
}

/**
 * Cluster too close features
 */
function layerVectorCluster(opt) {
	const options = Object.assign({
			clusterDistance: 50,
		}, opt),

		layer = layerVector(options),
		source = layer.getSource(),
		detailStyleFunction = layer.getStyleFunction(),

		// Specific format of clusters bullets
		//TODO double déclaration
		clusterStyleOptions = {
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
		},

		// Source if clusterized
		//TODO tune the distance depending on the resolution
		clusterSource = new ol.source.Cluster({
			distance: options.clusterDistance,
			source: source,
			geometryFunction: centerPoint,
		}),

		// Layer
		clusterLayer = new ol.layer.Vector({
			source: clusterSource,
			style: style,
		});

	function centerPoint(feature) {
		// Generate a center point to manage clusterisations
		return new ol.geom.Point(
			ol.extent.getCenter(
				feature.getGeometry().getExtent()
			)
		);
	}

	function style(feature, resolution) {
		const features = feature.get('features'),
			label = feature.get('label');

		// Clusters
		if (features) {
			// Clustered features
			let clusters = 0;
			for (let f in features)
				clusters += parseInt(features[f].get('cluster')) || 1;

			if (clusters > 1) {
				clusterStyleOptions.text.setText(clusters.toString());
				//TODO BEST mettre la liste des 5 premiers titres
				feature.set('hover', clusters.toString() + ' éléments');

				/*
						// Add a permanent label
						if (!baseOptions.clusterDistance || // If no clusterisation 
							(feature.get('features') // If not cluster marker 
							) && label) {
							labelStyleOptions.text = label;
							styleOptions.text = new ol.style.Text(labelStyleOptions);
						}
						*/

				return new ol.style.Style(clusterStyleOptions);
			}

			// Single feature (point, line or poly)
			const featureAlreadyExists = clusterSource.forEachFeature(function(f) {
				if (features[0].ol_uid == f.ol_uid)
					return true;
			});

			if (!featureAlreadyExists)
				clusterSource.addFeature(features[0]);
		} else // Feature copied from initial source to cluster source
			return detailStyleFunction(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Display different layers depending on the map resolution
 */
function layerFlip(lowLayer, highLayer, limitResolution) {
	let currentLayer;

	const layer = new ol.layer.Vector({
		render: function(frameState, target) { //HACK to be informed of render to be run
			const resolution = frameState.pixelToCoordinateTransform[0],
				newLayer = resolution < limitResolution ? lowLayer : highLayer;

			if (currentLayer != newLayer) {
				currentLayer = newLayer;
				layer.setSource(newLayer.getSource());
				layer.setStyle(newLayer.getStyle());
			}

			return ol.layer.Vector.prototype.render.call(this, frameState, target);
		},
	});

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

		if (feature.hoverStyleOptions)
			feature.hoverStyleOptions.text.setText(titles.join('\n'));

		return new ol.style.Style(feature.hoverStyleOptions);
	}

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);
		map.addLayer(hoverLayer);

		map.on(['pointermove', 'click'], action);
	};

	let previousHoveredFeature;

	function action(evt) {
		// Get hovered feature
		const feature = map.forEachFeatureAtPixel(
			map.getEventPixel(evt.originalEvent),
			function(feature) {
				return feature;
			});

		if (feature) {
			const features = feature.get('features') || [feature],
				link = features[0].get('link'),
				center = feature.getGeometry().getCoordinates();

			if (evt.type == 'click') {
				// Single feature
				if (features.length == 1 && link) {
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
	}

	return control;
}

/**
 * Get checkboxes values of inputs having the same name
 * selectorName {string}
 */
function readCheckbox(selectorName) {
	const inputEls = document.getElementsByName(selectorName);

	// Specific case of a single on/off <input>
	if (inputEls.length == 1)
		return [inputEls[0].checked];

	// Read each <input> checkbox
	const list = [];
	for (let e = 0; e < inputEls.length; e++)
		if (inputEls[e].checked &&
			inputEls[e].value != 'on')
			list.push(inputEls[e].value);

	return list;
}

/**
 * Manages checkboxes inputs having the same name
 * selectorName {string}
 * callback {function(list)} action when the button is clicked
 *
 * Mem the checkboxes in cookies / recover it from the cookies, url args or hash
 * Manages a global flip-flop of the same named <input> checkboxes
 */
function memCheckbox(selectorName, callback) {
	const request = // Search values in cookies & args
		window.location.search + ';' + // Priority to the url args ?selector=1,2,3
		window.location.hash + ';' + // Then the hash #selector=1,2,3
		document.cookie, // Then the cookies

		match = request.match(new RegExp(selectorName + '=([^;]*)')),
		inputEls = document.getElementsByName(selectorName);

	// Set the <inputs> accordingly with the cookies or url args
	if (inputEls)
		for (let e = 0; e < inputEls.length; e++) { //HACK el.forEach is not supported by IE/Edge
			// Set inputs following cookies & args
			if (match)
				inputEls[e].checked =
				match[1].split(',').includes(inputEls[e].value) || // That one is declared
				match[1].split(',').includes('on'); // The "all (= "on") is set

			// Attach the action
			inputEls[e].onclick = onClick;

			// Compute the all check && init the cookies if data has been given by the url
			checkEl(inputEls[e]);
		}

	function onClick(evt) {
		checkEl(evt.target); // Do the "all" check verification

		const list = readCheckbox(selectorName);

		// Mem the data in the cookie
		if (selectorName)
			document.cookie = selectorName + '=' + list.join(',') +
			'; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString(); // Keep over all session

		if (typeof callback == 'function')
			callback(list);
	}

	// Check on <input> & set the "All" input accordingly
	function checkEl(target) {
		let allIndex = -1, // Index of the "all" <input> if any
			allCheck = true; // Are all others checked ?

		for (let e = 0; e < inputEls.length; e++) {
			if (target.value == 'on') // If the "all" <input> is checked (who has a default value = "on")
				inputEls[e].checked = target.checked; // Force all the others to the same
			else if (inputEls[e].value == 'on') // The "all" <input>
				allIndex = e;
			else if (!inputEls[e].checked)
				allCheck = false; // Uncheck the "all" <input> if one other is unchecked	
		}

		// Check the "all" <input> if all others are
		if (allIndex != -1)
			inputEls[allIndex].checked = allCheck;
	}

	const list = readCheckbox(selectorName);

	if (typeof callback == 'function')
		callback(list);

	return list;
}