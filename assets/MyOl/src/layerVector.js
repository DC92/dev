/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 *
 * Options:
 * All source.Vector options : format, strategy, attributions, ...
 * urlFunction: function(options, bbox, selection, extent, resolution, projection)
 * selectorName : <input name="selectorName"> url arguments selector
 * styleOptions: Options of the style of the features (object = style options or function returning object)
 * hoverStyleOptions: Options of the style when hovering the features (object = style options or function returning object)
 * clusterStyleOptions : Options of the style of the cluster bullets (object = style options)
 *
 * GeoJson properties:
 * icon : url of an icon file
 * label : label on top of the feature
 * hover : label on hovering a feature
 * url: url to go if feature is clicked
 * cluster: number of grouped features too close to be displayed alone
 */
//TODO BUG IE SCRIPT5022: IndexSizeError
function layerVector(options) {
	const defaultStyleOptions = {
			// Yellow label
			textOptions: {
				textBaseline: 'bottom',
				offsetY: -13, // Compensate the bottom textBaseline
				padding: [1, 3, 0, 3],
				font: '14px Calibri,sans-serif',
				backgroundFill: new ol.style.Fill({
					color: 'yellow',
				}),
			},
		},
		// Hover a feature can display "hover" properties on another format
		// In addition to defaultStyleOptions
		defaultHoverStyleOptions = {
			hover: true, // Select label | hover as text to be display
			textOptions: {
				overflow: true, // Force label display of little polygons
			},
		},
		// Cluster bullet
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
		//HACK to render the html entities in canvas
		elLabel = document.createElement('span'),

		// Source & layer
		source = new ol.source.Vector(Object.assign({
				url: url,
				format: new ol.format.GeoJSON(),
			},
			options)),

		layer = new ol.layer.Vector(Object.assign({
				source: source,
				style: style,
			},
			options));

	// url callback function for the layer
	function url(extent, resolution, projection) {
		return options.urlFunction(
			options, // Layer options
			ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(),
				'EPSG:4326' // Received projection
			),
			readCheckbox(options.selectorName),
			extent, resolution, projection
		);
	}

	// Modify a geoJson url argument depending on checkboxes
	if (options.selectorName)
		memCheckbox(options.selectorName, function(selection) {
			layer.setVisible(selection.length > 0);
			if (selection.length > 0)
				source.refresh();
		});

	// Convert server properties to the one rendered ("icon", "label, "hover", "url", "cluster", ...)
	if (typeof options.properties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				options.properties(evt.features[p], options);
		});

	// style callback function for the layer
	function style(feature, resolution) {
		// Hover style
		feature.hoverStyleFunction = function(feature, resolution) {
			return displayStyle(feature, resolution, [
				defaultStyleOptions, defaultHoverStyleOptions, options.hoverStyleOptions
			]);
		};

		if (feature.get('cluster')) // Grouped features
			// Cluster style
			return displayStyle(feature, resolution, [
				defaultClusterStyleOptions, options.clusterStyleOptions
			]);
		else
			// Basic display style
			return displayStyle(feature, resolution, [
				defaultStyleOptions, options.styleOptions
			]);
	}

	// Function to display different styles
	function displayStyle(feature, resolution, styles) {
		const properties = feature.getProperties(),
			styleOptions = {},
			textOptions = {};

		// Compile the list of styles & default
		for (let s in styles)
			if (styles[s]) {
				const style = typeof styles[s] == 'function' ?
					styles[s](feature) :
					styles[s];

				Object.assign(styleOptions, style);

				// Separately concatenate text options
				Object.assign(textOptions, style.textOptions);
			}

		// Feature icon
		if (properties.icon)
			styleOptions.image = new ol.style.Icon({
				src: properties.icon,
			});

		// Hover
		if (styleOptions.hover)
			elLabel.innerHTML = properties.hover || properties.label;

		// Cluster: grouped features
		else if (properties.cluster)
			elLabel.innerHTML = properties.cluster;

		// Labels
		else if (properties.label)
			elLabel.innerHTML = properties.label;

		else
			elLabel.innerHTML = '';

		// Feature label
		if (elLabel.innerHTML) {
			textOptions.text = elLabel.textContent;
			styleOptions.text = new ol.style.Text(textOptions);
		}

		return new ol.style.Style(styleOptions);
	}

	//HACK Save options for further use (layerVectorCluster)
	layer.options = options; //BEST avoid

	return layer;
}

/**
 * Cluster close features
 */
function layerVectorCluster(layer, distance) {
	// Clusterized source & layer
	const clusterDistance = distance || layer.options.distance || 50,
		clusterSource = new ol.source.Cluster({
			distance: clusterDistance,
			source: layer.getSource(),
			geometryFunction: function(feature) {
				// Generate a center point to manage clusterisations
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
			},
		}),
		clusterLayer = new ol.layer.Vector(Object.assign({
				source: clusterSource,
				style: clusterStyle,
				visible: layer.getVisible(), // Get the selector status 
			},
			layer.options));

	//HACK propagate setVisible following the selector status
	layer.on('change:visible', function() {
		clusterLayer.setVisible(this.getVisible());
	});

	// Tune the clustering distance depending on the zoom level
	let previousResolution;
	clusterLayer.on('prerender', function(evt) {
		const resolution = evt.frameState.viewState.resolution,
			distance = resolution < 10 ? 0 : Math.min(clusterDistance, resolution);

		if (previousResolution != resolution) // Only when changed
			clusterSource.setDistance(distance);

		previousResolution = resolution;
	});

	// style callback function for the layer
	function clusterStyle(feature, resolution) {
		const features = feature.get('features'),
			style = layer.getStyleFunction();
		let clusters = 0, // Add number of clusters of server cluster groups
			labels = [], // List of labels of clustered features
			clustered = false; // The server send clusters

		if (features) {
			for (let f in features) {
				const properties = features[f].getProperties();

				// Check if the server send clusters
				if (properties.cluster)
					clustered = true;

				clusters += parseInt(properties.cluster) || 1;

				if (properties.label || properties.hover)
					labels.push(properties.label || properties.hover);
			}

			if (features.length > 1 || !labels.length) {
				// Big cluster
				if (clusters > 5)
					labels = []; // Don't display big list

				// Clusters
				feature.set('cluster', clusters);
				feature.set('hover', labels.length ? labels.join('\n') : 'Cliquer pour zoomer');
			} else {
				// Single feature (point, line or poly)
				const featureAlreadyExists = clusterSource.forEachFeature(function(f) {
					if (features[0].ol_uid == f.ol_uid)
						return true;
				});

				if (!featureAlreadyExists)
					clusterSource.addFeature(features[0]);

				return; // Dont display that one, it will display the added one
			}
		}

		return style(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Control to display labels on hovering & click
 * on features of vector layers having the following properties :
 * label : text on top of the picture
 * url : go to a new URL when we click on the feature
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

		map.getView().on('change:resolution', function() {
			// Remove hovered feature
			if (previousHoveredFeature)
				hoverLayer.getSource().removeFeature(previousHoveredFeature);
			previousHoveredFeature = null;

			// Reset cursor
			map.getViewport().style.cursor = 'default';
		});
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
				url = features[0].get('url'),
				geom = feature.getGeometry();

			if (evt.type == 'click') {
				// Single feature
				if (features.length == 1 && url) {
					if (evt.originalEvent.ctrlKey)
						window.open(url, '_blank').focus();
					else
					if (evt.originalEvent.shiftKey)
						// To specify feature open a new window
						window.open(url, '_blank', 'resizable=yes').focus();
					else
						window.location = url;
				} else
					// Cluster
					if (geom)
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
	//TODO BUG ne marche pas avec un sélecteur simple (une coche on/off)
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
				match[1].split(',').indexOf(inputEls[e].value) != -1 || // That one is declared
				match[1].split(',').indexOf('on') != -1; // The "all (= "on") is set

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