/**
 * This file adds some facilities to ol.layer.Vector
 */

/**
 * BBOX strategy when the url returns a limited number of features in the BBox
 * We do need to reload when the zoom in
 */
ol.loadingstrategy.bboxLimit = function(extent, resolution) {
	if (this.bboxLimitResolution > resolution) // When zoom in
		this.refresh(); // Force the loading of all areas
	this.bboxLimitResolution = resolution; // Mem resolution for further requests
	return [extent];
};

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
					 *
					 * GeoJson properties:
					 * icon : url of an icon file
					 * iconchem : url of an icon from chemineur.fr
					 * name : label on top of the feature
					 * type : cabane, ...
					 * ele : elevation / altitude (meters)
					 * bed : number of places to sleep
					 * cluster: number of grouped features too close to be displayed alone
					 * hover : label on hovering a feature
					 * url: url to go if feature is clicked
 */
//TODO+ BUG battement si trop d'icônes
//TODO+ BUG Pas de pictos Cluster dans le Vercors 
function layerVector(opt) {
	const options = Object.assign({
			zIndex: 1, // Above the base layer
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
		}, opt),

		// Source & layer
		source = new ol.source.Vector(Object.assign({
			url: url,
		}, options)),

		layer = new ol.layer.Vector(Object.assign({
			source: source,
			style: style,
			//TODO declutter: true,
		}, options)),

		//		elLabel = document.createElement('span'),		//HACK to render the html entities in canvas
		statusEl = document.getElementById(options.selectorName);

	// XHR download tracking
	if (statusEl)
		source.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
			if (!statusEl.textContent.includes('error'))
				statusEl.textContent = '';

			switch (evt.type) {
				case 'featuresloadstart':
					statusEl.textContent = 'Chargement...';
					break;
				case 'featuresloaderror':
					statusEl.textContent = 'Erreur !';
			}
		});

	// url callback function for the layer
	function url(extent, resolution, projection) {
		return options.urlFunction(
			options, // Layer options
			ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(),
				'EPSG:4326' // Received projection
			).map(function(c) {
				return c.toFixed(4); // Round to 4 digits
			}),
			readCheckbox(options.selectorName),
			extent, resolution, projection
		);
	}

	// Modify a geoJson url argument depending on checkboxes
	memCheckbox(options.selectorName, function(selection) {
		layer.setVisible(selection.length > 0);
		if (selection.length > 0)
			source.refresh();
	});

	// Callback function to define feature display from the properties received from the server
	source.on('featuresloadend', function(evt) {
		for (let f in evt.features) {
			// These options will be displayed by the hover response
			//HACK attach this function to each feature to access it when hovering without layer context
			evt.features[f].hoverStyleOptions = options.hoverStyleOptions;

			// Add data to be used to display the feature
			//TODO DELETE
			evt.features[f].display = typeof options.displayProperties == 'function' ?
				options.displayProperties(
					evt.features[f].getProperties(),
					evt.features[f],
					options
				) :
				evt.features[f].getProperties();
		}
	});

	// Style callback function for the layer
	function style(feature, resolution) {
		/*		if (feature.display && feature.display.cluster) // Grouped features
					// Cluster style
					return displayStyle(feature, resolution, options.clusterStyleOptions);
				else*/
		// Basic display style
		return displayStyle(feature, resolution, options.styleOptions);
	}

	// Function to display different styles
	//TODO merge with style
	function displayStyle(feature, resolution, styleOptionsFunction) {
		if (feature.display) {
			const styleOptions = typeof styleOptionsFunction == 'function' ? styleOptionsFunction(feature, feature.getProperties(), options) : {}; //TODO optimize

			return new ol.style.Style(styleOptions);
		}
	}

	// Display labels on hovering & click
	// on features of vector layers having the following properties :
	// hover : text on top of the picture
	// url : go to a new URL when we click on the feature

	//HACK attach an hover listener once when the map is defined
	ol.Map.prototype.render = function() {
		if (!this.hoverListenerInstalled && this.getView()) {
			initHover(this);
			this.hoverListenerInstalled = true;
		}

		return ol.PluggableMap.prototype.render.call(this);
	};

	function initHover(map) {
		// Layer to display an hovered features
		const hoverSource = new ol.source.Vector(),
			hoverLayer = new ol.layer.Vector({
				source: hoverSource,
				zIndex: 2, // Above the features
				//TODO declutter: true, //To avoid dumping the other labels
				style: function(feature, resolution) {
					return displayStyle(feature, resolution, feature.hoverStyleOptions);
				},
			});

		map.addLayer(hoverLayer);

		// Leaving the map reset hovering
		window.addEventListener('mousemove', function(evt) {
			const divRect = map.getTargetElement().getBoundingClientRect();

			if (evt.clientX < divRect.left || divRect.right < evt.clientX || // The mouse is outside the map
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				hovermouseEvent({});
		});

		map.on(['pointermove', 'click'], hovermouseEvent);
		map.getView().on('change:resolution', hovermouseEvent); // For WRI massifs

		function hovermouseEvent(evt) {
			const originalEvent = evt.originalEvent ||
				evt, //TODO still needed ???
				// Get the hovered feature
				//TODO+ BUG forEachFeatureAtPixel with no features when decluter
				feature = map.forEachFeatureAtPixel(
					map.getEventPixel(originalEvent),
					function(feature) {
						return feature;
					}, {
						hitTolerance: 6, // Default 0
					});

			// Update the display of hovered feature
			if (map.hoveredFeature !== feature) {
				if (map.hoveredFeature)
					hoverSource.clear();

				if (feature)
					hoverSource.addFeature(feature);

				map.getViewport().style.cursor = feature ? 'pointer' : '';

				map.hoveredFeature = feature;
			}

			// Click actions
			if (feature && evt.type == 'click') {
				const features = feature.get('features') || [feature],
					display = features[0].display,
					geom = feature.getGeometry();

				if (display) {
					if (features.length == 1 && display.url) {
						// Single feature
						if (originalEvent.ctrlKey)
							window.open(display.url, '_blank').focus();
						else
						if (originalEvent.shiftKey)
							// To specify feature open a new window
							window.open(display.url, '_blank', 'resizable=yes').focus();
						else
							window.location = display.url;
					}
					// Cluster
					else if (geom)
						map.getView().animate({
							zoom: map.getView().getZoom() + 2,
							center: geom.getCoordinates(),
						});
				}
			}
		}
	}

	return layer;
}

/**
 * Clustering features
 */
function layerVectorCluster(options) {
	// No clustering
	if (!options.distance)
		return layerVector(options);

	// Detailed layer
	const layer = layerVector(options),

		// Clusterized source
		clusterSource = new ol.source.Cluster({
			source: layer.getSource(),
			distance: options.distance,
			geometryFunction: geometryFunction,
			createCluster: createCluster,
		}),

		// Clusterized layer
		clusterLayer = new ol.layer.Vector(Object.assign({
			source: clusterSource,
			zIndex: 1, // Above the base layer
			//TODO declutter: true,
			style: clusterStyle,
			visible: layer.getVisible(), // Get the selector status 
		}, options));

	// Propagate setVisible following the selector status
	layer.on('change:visible', function() {
		clusterLayer.setVisible(this.getVisible());
	});

	// Tune the clustering distance depending on the zoom level
	let previousResolution;
	clusterLayer.on('prerender', function(evt) {
		const resolution = evt.frameState.viewState.resolution,
			distance = resolution < 10 ? 0 : Math.min(options.distance, resolution);

		if (previousResolution != resolution) // Only when changed
			clusterSource.setDistance(distance);

		previousResolution = resolution;
	});

	// Generate a center point to manage clusterisations
	function geometryFunction(feature) {
		const extent = feature.getGeometry().getExtent(),
			pixelSemiPerimeter = (extent[2] - extent[0] + extent[3] - extent[1]) / this.resolution;

		if (pixelSemiPerimeter > 200)
			// Don't cluster lines or polygons whose the 1/2 perimeter is more than 200 pixels
			clusterSource.addFeature(feature);
		else
			return new ol.geom.Point(
				ol.extent.getCenter(
					feature.getGeometry().getExtent()
				)
			);
	}

	// Generate the features to render the cluster
	function createCluster(point, features) {
		// Single feature : display it
		if (features.length == 1)
			return features[0];

		// Stay clustered
		return new ol.Feature({
			geometry: point,
			features: features
		});
	}

	// Style callback function for the layer
	function clusterStyle(feature, resolution) {
		const features = feature.get('features'),
			style = layer.getStyleFunction();

		let clusters = 0, // Add number of clusters of server cluster groups
			names = [], // List of names of clustered features
			clustered = false; // The server send clusters

		if (features) {
			for (let f in features)
				// Check if the server send clusters
				if (features[f].display) {
					if (features[f].display.name)
						names.push(features[f].display.name);

					if (features[f].display.cluster)
						clustered = true;

					clusters += parseInt(features[f].display.cluster) || 1;
				}

			// Cluster labels
			if (features.length > 1 || !names.length) {
				// Big cluster
				if (clusters > 7)
					names = []; // Don't display big list

				// Clusters
				feature.display = {
					cluster: clusters,
					hover: names.length ? names.join('\n') : 'Cliquer pour zoomer',
				};
				feature.hoverStyleOptions = options.hoverStyleOptions;
			}
		}

		return style(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Get checkboxes values of inputs having the same name
 * selectorName {string}
 */
function readCheckbox(selectorName) {
	const inputEls = document.getElementsByName(selectorName);

	// Specific case of a single on/off <input>
	if (inputEls.length == 1)
		return inputEls[0].checked ? ['on'] : [];

	// Read each <input> checkbox
	const selection = [];
	for (let e = 0; e < inputEls.length; e++)
		if (inputEls[e].checked &&
			inputEls[e].value != 'on')
			selection.push(inputEls[e].value);

	return selection;
}

/**
 * Manage checkbox inputs having the same name
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
		for (let e = 0; e < inputEls.length; e++) { // for doesn't work on element array
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

		if (inputEls.length && typeof callback == 'function')
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

	//BEST common code with function onClick(evt) {
	if (inputEls.length && typeof callback == 'function')
		callback(selection);

	return selection;
}