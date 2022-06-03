/**
 * This file adds some facilities to ol.layer.Vector
 */

/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 *
 * Options:
 * selectorName : <input name="SELECTORNAME"> url arguments selector
 * selectorName : <TAG id="SELECTORNAME-status"></TAG> display loading status
 * urlFunction: function(options, bbox, selection, extent, resolution, projection) returning the XHR url
 * convertProperties: function(properties, feature, options) who extract a list of data from the XHR to be available as feature.display.XXX
 * styleOptionsFunction: function(feature, properties, options) returning options of the style of the features
 * styleOptionsClusterFunction: function(feature, properties, options) returning options of the style of the cluster bullets
 * hoverStyleOptionsFunction: function(feature, properties, options) returning options of the style when hovering the features
 * source.Vector options : format, strategy, attributions, ...
 */
function layerVector(opt) {
	const options = Object.assign({
			zIndex: 10, // Features : above the base layer (zIndex = 1)
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			styleOptionsClusterFunction: styleOptionsCluster,
		}, opt),

		// Source & layer
		source = new ol.source.Vector(Object.assign({
			url: url,
		}, options)),

		layer = new ol.layer.Vector(Object.assign({
			source: source,
			style: style,
		}, options)),

		elLabel = document.createElement('span'), //HACK to render the html entities in canvas
		statusEl = document.getElementById(options.selectorName + '-status'); // XHR download tracking

	if (statusEl)
		source.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
			if (!statusEl.textContent.includes('error'))
				statusEl.textContent = '';

			//BEST status hors limites zoom
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
		const selection = readCheckbox(options.selectorName);

		return options.urlFunction(
			options, // Layer options
			ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(), // Map projection
				'EPSG:4326' // Received projection
			).map(function(c) {
				return c.toFixed(4); // Round to 4 digits
			}),
			typeof selection == 'object' ? selection : [],
			extent, resolution, projection
		);
	}

	// Modify a geoJson url argument depending on checkboxes
	memCheckbox(options.selectorName, function(selection) {
		const visible = typeof selection == 'object' ? selection.length : selection === true;

		layer.setVisible(visible);
		if (visible)
			source.refresh();
	});

	// Callback function to define feature display from the properties received from the server
	source.on('featuresloadend', function(evt) {
		for (let f in evt.features) {
			// These options will be displayed by the hover response
			//HACK attach this function to each feature to access it when hovering without layer context
			evt.features[f].hoverStyleOptionsFunction = options.hoverStyleOptionsFunction;

			// Compute data to be used to display the feature
			evt.features[f].display = typeof options.convertProperties == 'function' ?
				options.convertProperties(
					evt.features[f].getProperties(),
					evt.features[f],
					options
				) : {};

			// Detect lines or polygons
			evt.features[f].display.area = ol.extent.getArea(evt.features[f].getGeometry().getExtent());
		}
	});

	// Style callback function for the layer
	function style(feature) {
		const properties = feature.getProperties();

		return displayStyle(
			feature,
			properties.features || properties.cluster ?
			options.styleOptionsClusterFunction :
			options.styleOptionsFunction
		);
	}

	// Function to display different styles
	function displayStyle(feature, styleOptionsFunction) {
		if (typeof styleOptionsFunction == 'function') {
			const styleOptions = styleOptionsFunction(feature, Object.assign(feature.getProperties(), feature.display), options);

			//HACK to render the html entities in the canvas
			if (styleOptions && styleOptions.text) {
				elLabel.innerHTML = styleOptions.text.getText();

				if (elLabel.innerHTML) {
					styleOptions.text.setText(
						elLabel.textContent[0].toUpperCase() + elLabel.textContent.substring(1)
					);
				}
			}

			return new ol.style.Style(styleOptions);
		}
	}

	// Display labels on hovering & click
	// on features of vector layers having the following properties :
	// hover : text on top of the picture
	// url : go to a new URL when we click on the feature
	//BEST label attached to the cursor for lines & poly

	//HACK attach an hover listener once when the map is defined
	ol.Map.prototype.render = function() {
		if (!this.hoverListenerInstalled && this.getView()) {
			this.hoverListenerInstalled = true;
			initHover(this);
		}

		return ol.PluggableMap.prototype.render.call(this);
	};

	function initHover(map) {
		// Layer to display an hovered features
		const hoverSource = new ol.source.Vector(),
			hoverLayer = new ol.layer.Vector({
				source: hoverSource,
				zIndex: 30, // Hover : above the the features
				style: function(feature) {
					return displayStyle(feature, feature.hoverStyleOptionsFunction);
				},
			});

		map.addLayer(hoverLayer);

		// Leaving the map reset hovering
		window.addEventListener('mousemove', function(evt) {
			const divRect = map.getTargetElement().getBoundingClientRect();

			// The mouse is outside of the map
			if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				mouseEvent({});
		});

		map.on(['pointermove', 'click'], mouseEvent);
		map.getView().on('change:resolution', mouseEvent); // For WRI massifs

		function mouseEvent(evt) {
			const originalEvent = evt.originalEvent || evt,
				// Get the hovered feature
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

				map.hoveredFeature = feature;
			}

			if (feature) {
				const features = feature.get('features') || [feature],
					display = Object.assign({},
						features[0].getProperties(), // Get first or alone feature
						features[0].display
					),
					geom = feature.getGeometry();

				// Set the cursor if hover a clicable feature
				map.getViewport().style.cursor = display.url || display.cluster ? 'pointer' : '';

				// Click actions
				if (evt.type == 'click' && display) {
					if (features.length == 1 && display.url) {
						// Single feature
						if (originalEvent.ctrlKey)
							window.open(display.url, '_blank').focus();
						else
						if (originalEvent.shiftKey)
							// To specify feature open a new window
							window.open(display.url, '_blank', 'resizable=yes').focus();
						else
							location = display.url;
					}
					// Cluster
					else if (geom && (features.length > 1 || display.cluster))
						map.getView().animate({
							zoom: map.getView().getZoom() + 2,
							center: geom.getCoordinates(),
						});
				}
			} else
				map.getViewport().style.cursor = '';
		}
	}

	return layer;
}

/**
 * Clustering features
 */
function layerVectorCluster(options) {
	// Detailed layer
	const layer = layerVector(options);

	// No clustering
	if (!options.distance)
		return layer;

	// Clusterized source
	const clusterSource = new ol.source.Cluster({
			source: layer.getSource(),
			distance: options.distance,
			geometryFunction: geometryFunction,
			createCluster: createCluster,
		}),

		// Clusterized layer
		clusterLayer = new ol.layer.Vector(Object.assign({
			source: clusterSource,
			style: clusterStyle,
			visible: layer.getVisible(),
			zIndex: layer.getZIndex(),
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

		// Don't cluster lines or polygons whose the extent perimeter is more than 400 pixels
		if (pixelSemiPerimeter > 200)
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

		// Display a cluster point
		return new ol.Feature({
			geometry: point,
			features: features
		});
	}

	// Style callback function for the layer
	function clusterStyle(feature, resolution) {
		const features = feature.get('features'),
			style = layer.getStyleFunction();

		if (features)
			feature.hoverStyleOptionsFunction = options.hoverStyleOptionsFunction;

		return style(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Get checkboxes values of inputs having the same name
 * selectorName {string}
 * Return an array of the selected inputs
 */
function readCheckbox(selectorName, withOn) {
	const inputEls = document.getElementsByName(selectorName);

	// Specific case of a single on/off <input>
	if (inputEls.length == 1)
		return inputEls[0].checked ? [inputEls[0].value] : [];

	// Read each <input> checkbox
	const selection = [];
	for (let e = 0; e < inputEls.length; e++)
		if (inputEls[e].checked &&
			(inputEls[e].value != 'on' || withOn)) // Avoid the first check in a list
			selection.push(inputEls[e].value);

	return selection;
}

/**
 * Manage checkbox inputs having the same name
 * selectorName {string}
 * callback {function(selection)} action when the button is clicked
 *
 * Mem / recover the checkboxes in localStorage, url args or hash
 * Manages a global flip-flop of the same named <input> checkboxes
 */
function memCheckbox(selectorName, callback) {
	const inputEls = document.getElementsByName(selectorName),
		values = typeof localStorage['myol_' + selectorName] != 'undefined' ?
		localStorage['myol_' + selectorName] :
		readCheckbox(selectorName, true).join(',');

	// Set the <inputs> accordingly with the localStorage or url args
	if (inputEls)
		for (let e = 0; e < inputEls.length; e++) { //BEST ?? HACK for doesn't work on element array
			// Set inputs following localStorage & args
			inputEls[e].checked =
				values.indexOf(inputEls[e].value) != -1 || // That one is declared
				values.split(',').indexOf('on') != -1; // The "all" (= "on") is set

			// Compute the all check && init the localStorage if data has been given by the url
			checkEl(inputEls[e]);

			// Attach the action
			inputEls[e].addEventListener('click', onClick);
		}

	function onClick(evt) {
		checkEl(evt.target); // Do the "all" check verification

		// Mem the data in the localStorage
		const selection = readCheckbox(selectorName);

		if (selectorName)
			localStorage['myol_' + selectorName] = typeof selection == 'object' ? selection.join(',') : selection ? 'on' : '';

		if (inputEls.length && typeof callback == 'function')
			callback(selection);
	}

	// Check on <input> & set the "All" input accordingly
	function checkEl(target) {
		let allIndex = -1, // Index of the "all" <input> if any
			allCheck = true; // Are all others checked ?

		for (let e = 0; e < inputEls.length; e++) { //BEST ??
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
 * Some usefull style functions
 */
// Get icon from an URL
function styleOptionsIcon(iconUrl) {
	if (iconUrl)
		return {
			image: new ol.style.Icon({
				src: iconUrl,
			}),
		};
}

// Get icon from chemineur.fr
function styleOptionsIconChemineur(iconName) {
	if (iconName) {
		const icons = iconName.split(' ');

		iconName = icons[0] + (icons.length > 1 ? '_' + icons[1] : ''); // Limit to 2 type names & ' ' -> '_'

		return styleOptionsIcon('//chemineur.fr/ext/Dominique92/GeoBB/icones/' + iconName + '.svg');
		//TODO BUG detect svg support on canvas & modify extention / do for all svg
	}
}

// Display a label with some data about the feature
function styleOptionsFullLabel(properties) {
	let text = [],
		line = [];

	// Cluster
	if (properties.features || properties.cluster) {
		let includeCluster = !!properties.cluster;
		for (let f in properties.features) {
			const name = properties.features[f].getProperties().name || properties.features[f].display.name;
			if (name)
				text.push(name);
			if (properties.features[f].getProperties().cluster)
				includeCluster = true;
		}

		if (text.length == 0 || text.length > 6 || includeCluster)
			text = ['Cliquer pour zoomer'];
	}
	// Feature
	else {
		if (properties.name)
			text.push(properties.name);

		if (properties.ele)
			line.push(parseInt(properties.ele) + ' m');
		if (properties.capacity)
			line.push(parseInt(properties.capacity) + '\u255E\u2550\u2555');
		if (line.length)
			text.push(line.join(', '));

		if (typeof properties.type == 'string' && properties.type)
			text.push(properties.type[0].toUpperCase() + properties.type.substring(1).replace('_', ' '));
		if (properties.attribution)
			text.push('&copy;' + properties.attribution);
	}

	return styleOptionsLabel(text.join('\n'), properties, true);
}

// Display a label with only the name
function styleOptionsLabel(text, properties, important) {
	const styleTextOptions = {
		text: text,
		font: '14px Calibri,sans-serif',
		padding: [1, 1, 0, 3],
		fill: new ol.style.Fill({
			color: 'black',
		}),
		backgroundFill: new ol.style.Fill({
			color: 'white',
		}),
		backgroundStroke: new ol.style.Stroke({
			color: 'blue',
			width: important ? 1 : 0.3,
		}),
		overflow: important,
	};

	// For points
	if (!properties.area)
		Object.assign(styleTextOptions, {
			textBaseline: 'top',
			offsetY: -30, // Above the icon
		});

	return {
		text: new ol.style.Text(styleTextOptions),
		zIndex: 40, // Label : above the the features & editor
	};
}

// Apply a color and transparency to a polygon
function styleOptionsPolygon(color, transparency) { // color = #rgb, transparency = 0 to 1
	if (color)
		return {
			fill: new ol.style.Fill({
				color: 'rgba(' + [
					parseInt(color.substring(1, 3), 16),
					parseInt(color.substring(3, 5), 16),
					parseInt(color.substring(5, 7), 16),
					transparency || 1,
				].join(',') + ')',
			})
		};
}

// Style of a cluster bullet (both local & server cluster
function styleOptionsCluster(feature, properties) {
	let nbClusters = parseInt(properties.cluster || 0);

	for (let f in properties.features)
		nbClusters += parseInt(properties.features[f].getProperties().cluster || 1);

	return {
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
			text: nbClusters.toString(),
			font: '14px Calibri,sans-serif',
		}),
	};
}