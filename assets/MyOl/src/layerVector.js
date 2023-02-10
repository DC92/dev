/**
 * Adds some facilities to ol.layer.Vector
 */
//jshint esversion: 9

/**
 * Layer to display remote geoJson layer
 */
function layerVector(opt) {
	const options = {
			host: '', // Url host
			/* urlParams: function(layerOptions, bbox, selections, extent) {
				path: '', // Url path of the layer
				key: value, // key=values pairs to add to the url as parameters
			}, */
			selectName: '',
			/* <input name="SELECT_NAME"> url arguments selector
				can be several SELECT_NAME_1,SELECT_NAME_2,...
				display loading status <TAG id="SELECT_NAME-status"></TAG>
				no selectName will display the layer
				selectName with no selector with this name will hide the layer
			*/
			callBack: function() { // Function called when the selector is actioned
				layer.setVisible(
					!selectNames[0] || // No selector name
					selectVectorLayer(selectNames[0]).length // By default, visibility depends on the first selector only
				);
				source.refresh();
			},
			strategy: ol.loadingstrategy.all,
			projection: 'EPSG:4326', // Received projection
			zIndex: 100, // Above the background layers
			// convertProperties: function(properties, options) {}, // Convert some server properties to the one used by this package
			// altLayer: Another layer to add to the map with this one (for resolution depending layers)
			...opt,

			// Default style options
			styleOptionsDisplay: function(feature, properties, layer, resolution) {
				return {
					...styleOptionsIcon(...arguments), // Default style
					...functionLike(opt.styleOptionsDisplay, ...arguments),
				};
			},
			styleOptionsHover: function(feature, properties, layer, resolution) {
				//TODO BUG label is under other layers
				return { // Each of these options can overwrite the previous
					...functionLike(options.styleOptionsDisplay, ...arguments), // Non hover style
					...styleOptionsLabelFull(...arguments), // Default hovering
					...functionLike(opt.styleOptionsHover, ...arguments), // Overwrite when hovering
				};
			},
		},
		// Other cons
		selectNames = (options.selectName || '').split(','),
		statusEl = document.getElementById(selectNames[0] + '-status'), // XHR download tracking
		format = new ol.format.GeoJSON(),
		source = new ol.source.Vector({
			url: sourceUrl,
			format: format,
			...options,
		}),
		layer = new ol.layer.Vector({
			source: source,
			style: (feature, resolution) => [
				// One style with overwriting options
				new ol.style.Style(
					functionLike(options.styleOptionsDisplay, feature, feature.getProperties(), layer, resolution)
				),
				// Many styles to have several icons & labels
				...functionLike(options.stylesDisplay, feature, feature.getProperties(), layer, resolution),
			],
			...options,
		});

	layer.options = options; // Embark the options

	selectNames.map(name => selectVectorLayer(name, options.callBack)); // Setup the selector managers
	options.callBack(); // Init parameters depending on the selector

	layer.setMapInternal = function(map) {
		//HACK execute actions on Map init
		ol.layer.Vector.prototype.setMapInternal.call(this, map);

		// Add the alternate layer if any
		if (options.altLayer)
			map.addLayer(options.altLayer);

		// Add the hovering listener to the map (once for one map)
		addMapListener(map);
	};

	// Display loading status
	if (statusEl)
		source.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
			if (!statusEl.textContent.includes('error'))
				statusEl.innerHTML = '';

			//BEST status out of zoom bounds
			switch (evt.type) {
				case 'featuresloadstart':
					statusEl.innerHTML = '&#8987;';
					break;
				case 'featuresloaderror':
					statusEl.innerHTML = 'Erreur !';
			}
		});

	format.readFeatures = function(doc, opt) {
		const json = JSONparse(doc);

		// For all features
		json.features.map(jsonFeature => {
			// Generate a pseudo id if none
			// This is important for non duplication of displayed features when bbox zooming
			if (!jsonFeature.id)
				jsonFeature.id =
				jsonFeature.properties.id || // Takes the one in properties
				JSON.stringify(jsonFeature.properties).replace(/\D/g, '') % 987654; // Generate a pseudo id if none

			// Callback function to convert some server properties to the one displayed by this package
			jsonFeature.properties = {
				...jsonFeature.properties,
				...functionLike(options.convertProperties, jsonFeature.properties, options),
			};

			return jsonFeature;
		});

		return ol.format.GeoJSON.prototype.readFeatures.call(this, JSON.stringify(json), opt);
	};

	// Default url callback function for the layer
	function sourceUrl(extent, resolution, projection) {
		const bbox = ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(), // Map projection
				options.projection // Received projection
			)
			.map(c => c.toFixed(4)), // Round to 4 digits
			selections = selectNames.map(name => selectVectorLayer(name).join(',')), // Array of string: selected values separated with ,
			urlParams = functionLike(options.urlParams, options, bbox, selections, ...arguments),
			query = [];

		// Don't send bbox parameter if no extent is available
		if (urlParams.bbox && !isFinite(urlParams.bbox[0]))
			urlParams.bbox = null;

		for (let k in urlParams)
			if (k != 'path' && urlParams[k])
				query.push(k + '=' + urlParams[k]);

		return options.host + urlParams.path + '?' + query.join('&');
	}

	return layer;
}

/**
 * Clustering features
 */
function layerVectorCluster(opt) {
	const options = {
			distance: 30, // Minimum distance (pixels) between clusters
			density: 1000, // Maximum number of displayed clusters
			maxResolutionDegroup: 5, // Resolution below which a cluster display a group of icons
			stylesDisplay: stylesCluster, //TODO QUESTION how does it takes the heritage WriWri ?
			...opt,
		},
		layer = layerVector(options), // Creates the basic layer (with all the points)
		clusterSource = new ol.source.Cluster({
			source: layer.getSource(),
			geometryFunction: geometryFnc,
			createCluster: createCluster,
			...options,
		}),
		clusterLayer = new ol.layer.Vector({
			source: clusterSource,
			style: layer.getStyleFunction(),
			visible: layer.getVisible(),
			zIndex: layer.getZIndex(),
			...options,
		});

	clusterLayer.options = layer.options;
	clusterLayer.setMapInternal = layer.setMapInternal; //HACK execute actions on Map init

	// Propagate setVisible following the selector status
	layer.on('change:visible', () => clusterLayer.setVisible(layer.getVisible()));

	// Tune the clustering distance depending on the zoom level
	clusterLayer.on('prerender', evt => {
		let surface = evt.context.canvas.width * evt.context.canvas.height, // Map pixels number
			distanceMinCluster = Math.min(
				evt.frameState.viewState.resolution, // No clusterisation on low resolution zooms
				Math.max(options.distance, Math.sqrt(surface / options.density))
			);

		if (clusterSource.getDistance() != distanceMinCluster) // Only when changed
			clusterSource.setDistance(distanceMinCluster);
	});

	// Generate a center point to manage clusterisations
	function geometryFnc(feature) {
		const geometry = feature.getGeometry();

		if (geometry) {
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
	}

	// Generate the features to render the clusters
	function createCluster(point, features) {
		let nbClusters = 0,
			includeCluster = false,
			lines = [];

		features.forEach(f => {
			const properties = f.getProperties();

			nbClusters += parseInt(properties.cluster) || 1;
			if (properties.cluster)
				includeCluster = true;
			if (properties.name)
				lines.push(properties.name);
		});

		// Single feature : display it
		if (nbClusters == 1)
			return features[0];

		if (includeCluster || lines.length > 5)
			lines = ['Cliquer pour zoomer'];

		// Display a cluster point
		return new ol.Feature({
			geometry: point, // The gravity center of all the features into the cluster
			cluster: nbClusters, //TODO voir pourquoi on ne met pas ça dans properties
			id: features[0].getId(), // Pseudo id = the id of the first feature in the cluster
			name: lines.join('\n'),
			features: features,
		});
	}

	return clusterLayer;
}

// Add a listener to manage hovered features
function addMapListener(map) {
	if (typeof map.lastHoveredFeature == 'undefined') { // Once for a map
		map.lastHoveredFeature = null;

		map.on(['pointermove', 'click'], evt => {
			// Find the first hovered feature
			let hoveredLayer = null,
				hoveredFeature = map.forEachFeatureAtPixel(
					map.getEventPixel(evt.originalEvent),
					function(feature, layer) {
						if (layer && layer.options) {
							hoveredLayer = layer;
							return feature;
						}
					}, {
						hitTolerance: 6, // For lines / Default 0
					}
				),
				styledFeature = hoveredFeature, // The feature that will receive the style
				hoveredProperties = hoveredFeature ? hoveredFeature.getProperties() : {};

			// Setup the curseur
			map.getViewport().style.cursor = hoveredFeature &&
				(hoveredProperties.url || hoveredProperties.cluster) && !hoveredLayer.options.noClick ?
				'pointer' : '';

			// Detect feature of a disjoin cluster
			if (hoveredFeature && hoveredProperties.cluster &&
				map.getView().getResolution() < hoveredLayer.options.maxResolutionDegroup) {
				const hoveredFeaturePixel = map.getPixelFromCoordinate(
						hoveredFeature.getGeometry().getCoordinates()
					),
					// Calculate the feature index from the cursor position
					indexHovered = Math.max(0, Math.min(hoveredProperties.cluster - 1, Math.floor(
						(evt.originalEvent.x - hoveredFeaturePixel[0] + 8.4 * hoveredProperties.cluster - 6) / 16.8
					)));

				hoveredFeature = hoveredProperties.features[indexHovered];
			}

			// Change this feature only style (As the main style is a layer only style)
			if (map.lastHoveredFeature != hoveredFeature ) {
				if (map.lastStyledFeature)
					map.lastStyledFeature.setStyle(); // Erase previous hover style

				map.lastHoveredFeature = hoveredFeature;
				map.lastStyledFeature = styledFeature;

				if (styledFeature) {
					styledFeature.setStyle(
						(feature, resolution) => [
							new ol.style.Style({
								...functionLike(hoveredLayer.options.styleOptionsHover,
									hoveredFeature, hoveredFeature.getProperties(), hoveredLayer, resolution
								), //TODO suppress icon if cluster
								zIndex: 200, //TODO BUG zIndex not operating
							}),
							...functionLike(hoveredLayer.options.stylesDisplay,
								hoveredFeature, hoveredProperties, hoveredLayer, resolution
							),
						]);
				}
			}

			// Click on a feature
			if (evt.type == 'click' && hoveredFeature && !hoveredLayer.options.noClick) {
				const hoveredProperties = hoveredFeature.getProperties();

				if (hoveredProperties && hoveredProperties.url) {
					// Open a new tag
					if (evt.originalEvent.ctrlKey)
						window.open(hoveredProperties.url, '_blank').focus();
					else
						// Open a new window
						if (evt.originalEvent.shiftKey)
							window.open(hoveredProperties.url, '_blank', 'resizable=yes').focus();
						else
							// Go on the same window
							window.location.href = hoveredProperties.url;
				}
				// Cluster
				if (hoveredProperties.cluster)
					map.getView().animate({
						zoom: map.getView().getZoom() + 2,
						center: hoveredProperties.geometry.getCoordinates(),
					});
			}
		});

		// Leaving the map reset hovering
		window.addEventListener('mousemove', evt => {
			const divRect = map.getTargetElement().getBoundingClientRect();

			// The mouse is outside of the map
			if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				if (map.lastStyledFeature) {
					map.lastStyledFeature.setStyle();
					map.lastStyledFeature = null;
				}
		});
	}
}

/**
 * Manage a collection of checkboxes with the same name
 * There can be several selectors for one layer
 * A selector can be used by several layers
 * The checkbox without value check / uncheck the others
 * Current selection is saved in window.localStorage
 * name : input names
 * callBack : callback function (this reset the checkboxes)
 * You can force the values in window.localStorage[simplified name]
 * Return return an array of selected values
 */
function selectVectorLayer(name, callBack) {
	const selectEls = [...document.getElementsByName(name)],
		safeName = 'myol_' + name.replace(/[^a-z]/ig, ''),
		init = (localStorage[safeName] || '').split(',');

	// Init
	if (typeof callBack == 'function') {
		selectEls.forEach(el => {
			el.checked =
				init.includes(el.value) ||
				init.includes('all') ||
				init.join(',') == el.value;
			el.addEventListener('click', onClick);
		});
		onClick();
	}

	function onClick(evt) {
		// Test the "all" box & set other boxes
		if (evt && evt.target.value == 'all')
			selectEls
			.forEach(el => el.checked = evt.target.checked);

		// Test if all values are checked
		const allChecked = selectEls
			.filter(el => !el.checked && el.value != 'all');

		// Set the "all" box
		selectEls
			.forEach(el => {
				if (el.value == 'all')
					el.checked = !allChecked.length;
			});

		// Save the current status
		if (selection().length)
			localStorage[safeName] = selection().join(',');
		else
			delete localStorage[safeName];

		if (evt)
			callBack(selection());
	}

	function selection() {
		return selectEls
			.filter(el => el.checked && el.value != 'all')
			.map(el => el.value);
	}

	return selection();
}

/**
 * Some usefull style functions
 */
// Display a label (Used by cluster)
function styleOptionsIcon(feature, properties) {
	if (properties.icon && !ol.extent.getArea(feature.getGeometry().getExtent()))
		return {
			image: new ol.style.Icon({
				//TODO BUG general : send cookies to the server, event non secure		
				src: properties.icon,
			}),
		};
}

function styleOptionsLabel(feature, text, textStyleOptions) {
	const elLabel = document.createElement('span'),
		area = ol.extent.getArea(feature.getGeometry().getExtent()); // Detect lines or polygons

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = text;

	return {
		text: new ol.style.Text({
			text: elLabel.innerHTML,
			textBaseline: area ? 'middle' : 'bottom',
			offsetY: area ? 0 : -13, // Above the icon
			padding: [1, 1, -1, 3],
			font: '12px Verdana',
			fill: new ol.style.Fill({
				color: 'black',
			}),
			backgroundFill: new ol.style.Fill({
				color: 'white',
			}),
			backgroundStroke: new ol.style.Stroke({
				color: 'blue',
			}),
			...textStyleOptions,
		}),
	};
}

function styleOptionsLabelFull(feature, properties) {
	return styleOptionsLabel(
		feature,
		agregateText([
			properties.name,
			agregateText([
				properties.ele && properties.ele ? parseInt(properties.ele) + ' m' : null,
				properties.bed && properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : null,
			], ', '),
			properties.type,
			properties.attribution,
		]),
	);
}

// Simplify & agreagte an array of lines
function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}

function stylesCluster(feature, properties, layer, resolution) {
	let styles = [], // Need separate styles to display several icons / labels
		x = 0.85 + 0.35 * properties.cluster;

	if (properties.cluster) {
		if (resolution < layer.options.maxResolutionDegroup)
			// Spread icons under the label
			properties.features.forEach(f => {
				const image = layer.getStyleFunction()(f, resolution)[0].getImage();

				if (image) {
					image.setAnchor([x -= 0.7, 0.5]);
					styles.push(new ol.style.Style({
						image: image,
					}));
				}
			});
		else
			// Cluster circle with number inside
			styles.push(new ol.style.Style({
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
					text: properties.cluster.toString(),
					font: '12px Verdana',
				}),
			}));
	}
	return styles;
}

// Return the value of result of function with arguments
function functionLike(value, ...arguments) {
	return typeof value == 'function' ? value(...arguments) : value || [];
}