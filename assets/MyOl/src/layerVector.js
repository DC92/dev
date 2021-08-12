/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 *
 * Options:
 * All source.Vector options : format, strategy, attributions, ...
 * url: function(options, bbox, selection, extent, resolution, projection)
 * selectorName : <input name="selectorName"> url arguments selector
 * styleOptions: Options of the style of the features (object = style options or function returning object)
 * hoverStyleOptions: Options of the style when hovering the features (object = style options or function returning object)
 * clusterStyleOptions : Options of the style of the cluster bullets (object = style options)
 *
 * GeoJson properties:
 * icon : url of an icon file
 * label : label on top of the feature
 * hover : label on hovering a feature
 * link: url to go if feature is clicked
 * cluster: several features too close to be displayed alone (number)
 */
function layerVector(options) {
	const defaultLabelTextOptions = {
			textBaseline: 'bottom',
			offsetY: -13, // Compensate the bottom textBaseline
			padding: [1, 3, 0, 3],
			backgroundFill: new ol.style.Fill({
				color: 'yellow',
			}),
		},
		defaultOptions = {
			format: new ol.format.GeoJSON(),
		},
		defaultStyleOptions = {
			textOptions: defaultLabelTextOptions,
		},
		defaultHoverStyleOptions = {
			// In addition to defaultStyleOptions
			hover: true, // Select label | hover as text to be display
			textOptions: {
				font: '14px Calibri,sans-serif',
			},
		},
		defaultClusterStyleOptions = {
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
		defaultClusterHoverStyleOptions = {
			// In addition to defaultClusterStyleOptions
			hover: true, // Select label | hover as text to be display
			textOptions: defaultLabelTextOptions,
		},
		elLabel = document.createElement('span'), //HACK to render the html entities in canvas

		// Source & layer
		source = new ol.source.Vector(Object.assign(
			defaultOptions,
			options, {
				url: url, // Forced
			}
		)),
		layer = new ol.layer.Vector({
			source: source,
			style: style,
		});

	// Url args selector
	//TODO comment
	if (options.selectorName)
		memCheckbox(options.selectorName, function(selection) {
			layer.setVisible(selection.length > 0);
			if (selection.length > 0)
				source.refresh();
		});

	// Convert specific properties to basic one ("icon", "label, "link", "cluster", ...)
	if (typeof options.properties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				options.properties(evt.features[p], options);
		});

	function url(extent, resolution, projection) {
		return options.url(
			options,
			ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(),
				'EPSG:4326' // Received projection
			),
			readCheckbox(options.selectorName),
			extent, resolution, projection
		);
	}

	function style(feature, resolution) {
		// Cluster: grouped features
		if (feature.get('cluster')) {
			// Precompile hover style
			feature.hoverStyleFunction = function(feature, resolution) {
		//		feature.set('hover', 'WW hover');
		//		feature.set('label', 'WW label');
		//		feature.set('cluster', 'WW cluster '+feature.get('cluster'));
				return displayStyle(feature, resolution, [
					defaultClusterStyleOptions, options.clusterStyleOptions,
					defaultClusterHoverStyleOptions, options.clusterHoverStyleOptions
				]);
			};
			// Calculate display style
			return displayStyle(feature, resolution, [
				defaultClusterStyleOptions, options.clusterStyleOptions
			]);
		} else {
			// Precompile hover style
			feature.hoverStyleFunction = function(feature, resolution) {
				return displayStyle(feature, resolution, [
					defaultStyleOptions, options.styleOptions,
					defaultHoverStyleOptions, options.hoverStyleOptions
				]);
			};
			// Calculate display style
			return displayStyle(feature, resolution, [
				defaultStyleOptions, options.styleOptions
			]);
		}
	}

	function displayStyle(feature, resolution, styles) {
		const properties = feature.getProperties(),
			styleOptions = {},
			textOptions = {};

		// Concatenate the list of styles
		for (let s in styles)
			if (styles[s]) {
				Object.assign(styleOptions,
					typeof styles[s] == 'function' ? styles[s](feature) : styles[s]
				);
				// Separately concatenate text options
				Object.assign(textOptions,
					styles[s].textOptions
				);
			}

		// Feature icon
		if (properties.icon)
			styleOptions.image = new ol.style.Icon({
				src: properties.icon,
			});

		// Cluster: grouped features
		if (properties.cluster) 
			elLabel.innerHTML = properties.cluster ;
		// Hover
		else if(styleOptions.hover)
			elLabel.innerHTML = properties.hover  ;
		// Labels
		else
			elLabel.innerHTML =   properties.label;

		// Feature label
		if (elLabel.innerHTML) {
			textOptions.text = elLabel.textContent;
			styleOptions.text = new ol.style.Text(textOptions);
		}

		return new ol.style.Style(styleOptions);
	}

	// Callback function run when hovering the feature
	function WWWWWWWWWWhoverStyleLocal(feature) { //TODO DELETE
		const features = feature.get('features') || [feature],
			titles = [];

		if (feature.get('hover'))
			// Groups (clusters managed by the server)
			titles.push(feature.get('hover'));
		else
		if (features.length > 1) {
			// Clusters
			for (let f in features)
				if (features[f].get('name'))
					titles.push(features[f].get('name'));
		} else
			// Point
			titles.push(features[0].get('hover'));

		//HACK to render the html entities //TODO généraliser ??
		const elTitles = document.createElement('span');
		elTitles.innerHTML = titles.join('\n');

		if (options.hoverStyleOptions.text)
			options.hoverStyleOptions.text.setText(!titles.length || feature.get('group') || titles.length > 5 ?
				'Cliquer pour zoomer' :
				elTitles.innerHTML
			);

		return new ol.style.Style(options.hoverStyleOptions);
	}

	//HACK Save options for further use (layerVectorCluster)
	layer.options = options; //BEST avoid

	return layer;
}

/**
 * Cluster close features
 */
function layerVectorCluster(opt) {
	//TODO réduction distance clusters quand zoome plus prés
	const fullLayer = layerVector(opt), // Hidden layer with all the features

		// Base options
		options = Object.assign({},
			fullLayer.options, { // Get default options from the layerVector
				clusterDistance: 50,
			}, opt), // Get declaration options

		// Clusterized source & layer
		clusterSource = new ol.source.Cluster({
			distance: options.clusterDistance,
			source: fullLayer.getSource(),
			geometryFunction: function(feature) {
				// Generate a center point to manage clusterisations
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
			},
		}),
		clusterLayer = new ol.layer.Vector({
			source: clusterSource,
			style: clusterStyleOptions,
			visible: fullLayer.getVisible(),
		});

	//HACK propagate setVisible
	fullLayer.on('change:visible', function() {
		clusterLayer.setVisible(this.getVisible());
	});

	function clusterStyleOptions(feature, resolution) {
		const features = feature.get('features'),
			style = fullLayer.getStyleFunction();

		if (features) {
			if (features.length > 1)
				// Cluster
				feature.set('cluster', features.length);
			 else {
				// Single feature (point, line or poly)
				const featureAlreadyExists = clusterSource.forEachFeature(function(f) {
					if (features[0].ol_uid == f.ol_uid)
						return true;
				});
				if (!featureAlreadyExists)
					clusterSource.addFeature(features[0]);
				return; // Dont display that one !!!
			}
		}
		return style(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Display different layers depending on the map resolution
 */
function layerFlip(lowLayer, highLayer, limitResolution) {
	let currentLayer;

	const layer = new ol.layer.Vector({
		render: function(frameState, target) {
			const resolution = frameState.pixelToCoordinateTransform[0],
				newLayer = resolution < limitResolution ? lowLayer : highLayer;

			if (currentLayer != newLayer) {
				currentLayer = newLayer;
				layer.setSource(newLayer.getSource());
				layer.setStyle(newLayer.getStyle());
				layer.setVisible(newLayer.getVisible());
			}

			//HACK report setVisible to the cluster
			currentLayer.on('change:visible', function() {
				layer.setVisible(this.getVisible());
			});

			//HACK to be informed of render to be run
			return ol.layer.Vector.prototype.render.call(this, frameState, target);
		},
	});

	return layer;
}

/**
 * Control to display labels on hovering & click
 * on features of vector layers having the following properties :
 * label : text on top of the picture
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
			style: function(feature, resolution) {
				if (typeof feature.hoverStyleFunction == 'function')
					return feature.hoverStyleFunction(feature, resolution);
			},
		});

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);
		map.addLayer(hoverLayer);

		map.on(['pointermove', 'click'], mouseEvent);
	};

	let previousHoveredFeature;

	function mouseEvent(evt) {
		// Get hovered feature
		const feature = map.forEachFeatureAtPixel(
			map.getEventPixel(evt.originalEvent),
			function(feature) {
				return feature;
			});

		if (feature) {
			const features = feature.get('features') || [feature],
				link = features[0].get('link'),
				geom = feature.getGeometry();

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
				else if (geom)
					map.getView().animate({
						zoom: map.getView().getZoom() + 2,
						center: geom.getCoordinates(),
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
	const selection = [];
	for (let e = 0; e < inputEls.length; e++)
		if (inputEls[e].checked &&
			inputEls[e].value != 'on')
			selection.push(inputEls[e].value);

	return selection;
}

/**
 * Manages checkboxes inputs having the same name
 * selectorName {string}
 * callback {function(selection)} action when the button is clicked
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
			inputEls[e].addEventListener('click', onClick);

			// Compute the all check && init the cookies if data has been given by the url
			checkEl(inputEls[e]);
		}

	function onClick(evt) {
		checkEl(evt.target); // Do the "all" check verification

		const selection = readCheckbox(selectorName);

		// Mem the data in the cookie
		if (selectorName)
			document.cookie = selectorName + '=' + selection.join(',') +
			'; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString(); // Keep over all session

		if (typeof callback == 'function')
			callback(selection);
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

	const selection = readCheckbox(selectorName);

	if (typeof callback == 'function')
		callback(selection);

	return selection;
}