/* jshint esversion: 6 */

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
 * clusterStyleOptions : Options of the style of the cluster bullets (object = style options)
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
//TODO BUG IE SCRIPT5022: IndexSizeError
function layerVector(opt) {
	const options = Object.assign({
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			displayProperties: function(properties) {
				return properties;
			},
		}, opt),

		// Yellow label
		defaultStyleOptions = {
			textOptions: {
				textBaseline: 'bottom',
				offsetY: -13, // Balance the bottom textBaseline
				padding: [1, 3, 0, 3],
				font: '14px Calibri,sans-serif',
				backgroundFill: new ol.style.Fill({
					color: 'yellow',
				}),
			},
		},

		// Display hover feature can display with another format
		// In addition to defaultStyleOptions
		defaultHoverStyleOptions = {
			hover: true, // Select label | hover as text to be display
			textOptions: {
				overflow: true, // Force label display of little polygons
				backgroundStroke: new ol.style.Stroke({
					color: 'blue',
				}),
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

	// Callback function to define features displays from the properties received from the server
	if (typeof options.displayProperties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				evt.features[p].display = options.displayProperties(
					evt.features[p].getProperties(),
					options
				);
		});

	// style callback function for the layer
	function style(feature, resolution) {
		// Hover style
		feature.hoverStyleFunction = function(feature, resolution) {
			return displayStyle(feature, resolution, [
				defaultStyleOptions, defaultHoverStyleOptions, options.hoverStyleOptions
			]);
		};

		if (feature.display.cluster) // Grouped features
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
		const styleOptions = {},
			textOptions = {};

		// Concatenate the list of styles & defaults
		for (let s in styles)
			if (styles[s]) {
				const style = typeof styles[s] == 'function' ?
					styles[s](feature) :
					styles[s];

				Object.assign(styleOptions, style);

				// Separately concatenate text options
				Object.assign(textOptions, style.textOptions);
			}

		//TODO faire une fonction plus générale pour les feature.display
		if (feature.display.iconchem)
			feature.display.icon =
			'//chemineur.fr/ext/Dominique92/GeoBB/icones/' + feature.display.iconchem + '.svg';

		if (feature.display.icon)
			//TODO add <sym> for Garmin upload
			styleOptions.image = new ol.style.Icon({
				src: feature.display.icon,
			});

		// Hover
		const hover = [],
			subHover = [];
		if (styleOptions.hover) { // When the function is called for hover
			if (feature.display.type)
				hover.push(feature.display.type.replace('_', ' '));
			if (feature.display.ele)
				subHover.push(feature.display.ele + 'm');
			if (feature.display.bed)
				subHover.push(feature.display.bed + '\u255E\u2550\u2555');
			if (subHover.length)
				hover.push(subHover.join(', '));
			hover.push(feature.display.name);
		}

		elLabel.innerHTML = //HACK to render the html entities in canvas
			(styleOptions.hover ? feature.display.hover : feature.display.cluster) ||
			hover.join('\n') ||
			feature.display.name;

		if (elLabel.innerHTML) {
			textOptions.text = elLabel.textContent[0].toUpperCase() + elLabel.textContent.substring(1);
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
	const options = Object.assign({
			strategy: ol.loadingstrategy.bbox,
			distance: 50, // Distance in pixels within which features will be clustered together.
		}, layer.options),

		// Clusterized source & layer
		clusterSource = new ol.source.Cluster({
			distance: options.distance,
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
			options));

	//HACK propagate setVisible following the selector status
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

	// style callback function for the layer
	function clusterStyle(feature, resolution) {
		const features = feature.get('features'),
			style = layer.getStyleFunction();
		let clusters = 0, // Add number of clusters of server cluster groups
			names = [], // List of names of clustered features
			clustered = false; // The server send clusters

		if (features) {
			for (let f in features) {
				// Check if the server send clusters
				if (features[f].display.cluster)
					clustered = true;

				clusters += parseInt(features[f].display.cluster) || 1;

				if (features[f].display.name)
					names.push(features[f].display.name);
			}

			if (features.length > 1 || !names.length) {
				// Big cluster
				if (clusters > 5)
					names = []; // Don't display big list

				// Clusters
				feature.display = {
					cluster: clusters,
					hover: names.length ? names.join('\n') : 'Cliquer pour zoomer',
				};
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
 * hover : text on top of the picture
 * url : go to a new URL when we click on the feature
 */
function controlHover() {
	const control = new ol.control.Control({
			element: document.createElement('div'), //HACK No button
		}),
		// Internal layer to temporary display the hovered feature
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

		map.getView().on('change:resolution', function() {
			// Remove hovered feature
			if (previousHoveredFeature)
				hoverLayer.getSource().removeFeature(previousHoveredFeature);
			previousHoveredFeature = null;

			// Reset cursor
			map.getViewport().style.cursor = 'default';
		});

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

		// Make the hovered feature visible in a dedicated layer
		if (feature !== previousHoveredFeature) {
			if (previousHoveredFeature)
				hoverLayer.getSource().removeFeature(previousHoveredFeature);

			if (feature)
				hoverLayer.getSource().addFeature(feature);

			map.getViewport().style.cursor = feature ? 'pointer' : 'default';
			previousHoveredFeature = feature;
		}

		// Click actions
		if (feature) {
			const features = feature.get('features') || [feature],
				url = features[0].display.url,
				geom = feature.getGeometry();

			if (evt.type == 'click') {
				if (features.length == 1 && url) {
					// Single feature
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