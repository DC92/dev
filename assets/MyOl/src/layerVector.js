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
			/* urlParams: { // Url parameters of the layer or function((layerOptions, bbox, selections, extent)
				path: '', // Url path of the layer
				key: value, // key=values pairs to add to the url as parameters
			}, */
			selectName: '',
			/* <input name="SELECT_NAME"> url arguments selector
				can be several SELECT_NAME_1,SELECT_NAME_2,...
				display loading status <TAG id="SELECT_NAME-status"></TAG>
				no selectName will display the layer
				no selector with selectName will hide the layer
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
			zIndex: 10, // Above the base layer (zIndex = 1)
			convertProperties: function(properties, feature, options) {}, // Convert some server properties to the one used by this package
			altLayer: null, // Another layer to add to the map with this one (for resolution depending layers)
			...opt,
			displayStyle: displayStyle,
			hoverStyle: hoverStyle,
			clusterStyle: clusterStyle,
		},
		selectNames = options.selectName.split(','),
		statusEl = document.getElementById(selectNames[0] + '-status'), // XHR download tracking
		format = new ol.format.GeoJSON(),
		source = new ol.source.Vector({
			url: url,
			format: format,
			...options,
		}),
		layer = new ol.layer.Vector({
			source: source,
			style: feature => new ol.style.Style({
				...options.displayStyle(feature, feature.getProperties(), layer),
				...options.clusterStyle(feature.getProperties()),
			}),
			...options,
		});

	layer.options = options;
	selectNames.map(name => selectVectorLayer(name, options.callBack)); // Setup the selector managers
	options.callBack(); // Init parameters depending on the selector

	layer.setMapInternal = function(map) {
		//HACK execute actions on Map init
		ol.layer.Vector.prototype.setMapInternal.call(this, map);

		// Add the alternate layer if any
		if (options.altLayer)
			map.addLayer(options.altLayer);

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
		json.features.map(feature => {
			// Generate a pseudo id if none
			if (!feature.id)
				feature.id = JSON.stringify(feature.properties).replace(/\D/g, '') % 987654;

			// Callback function to convert some server properties to the one displayed by this package
			if (typeof options.convertProperties == 'function')
				feature.properties = {
					...feature.properties,
					...options.convertProperties(feature.properties, options),
				};

			// Add +- 0.00005° (5m) random to each coordinate to separate the points having the same coordinates
			if (feature.geometry && feature.geometry.type == 'Point ') {
				const rnd = (feature.id / 3.14).toString().split('.');

				feature.geometry.coordinates[0] += ('0.0000' + rnd[0]) - 0.00005;
				feature.geometry.coordinates[1] += ('0.0000' + rnd[1]) - 0.00005;
			}
			return feature;
		});

		return ol.format.GeoJSON.prototype.readFeatures.call(this, JSON.stringify(json), opt);
	};

	// Default url callback function for the layer
	function url(extent, resolution, projection) {
		const bbox = ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(), // Map projection
				options.projection // Received projection
			)
			.map(c => c.toFixed(4)), // Round to 4 digits
			selections = selectNames.map(name => selectVectorLayer(name).join(',')), // Array of string: selected values separated with ,
			urlParams = typeof options.urlParams == 'function' ?
			options.urlParams(options, bbox, selections, extent) : //TODO resorb options
			options.urlParams,
			query = [];

		// Don't send bbox parameter if no extent is available
		if (urlParams.bbox && !isFinite(urlParams.bbox[0]))
			urlParams.bbox = null;

		for (let k in urlParams)
			if (k != 'path' && urlParams[k])
				query.push(k + '=' + urlParams[k]);

		return options.host + urlParams.path + '?' + query.join('&');
	}

	function displayStyle(feature, properties, layer) { // The style options
		return {
			image: properties.icon ? new ol.style.Icon({
				src: properties.icon,
			}) : null,
			...(typeof opt.displayStyle == 'function' ? opt.displayStyle(...arguments) : opt.displayStyle),
		};
	}

	function hoverStyle(feature, properties, layer) { // The hovering style options
		return {
			...styleLabel(feature, agregateText([
				properties.name,
				agregateText([
					properties.ele && properties.ele ? parseInt(properties.ele) + ' m' : '',
					properties.bed && properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : '',
				], ', '),
				properties.type ? properties.type : '',
				properties.attribution,
			])),
			zIndex: 20, // Above the main labels
			...(typeof opt.hoverStyle == 'function' ? opt.hoverStyle(...arguments) : opt.hoverStyle),
		};
	}

	function clusterStyle(properties) { // The clusters options
		if (properties.cluster)
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
					text: properties.cluster.toString(),
					font: '14px Calibri,sans-serif',
				}),
			};
	}

	return layer;
}

/**
 * Clustering features
 */
function layerVectorCluster(opt) {
	const options = {
			distance: 30, // Minimum distance between clusters
			density: 1000, // Maximum number of displayed clusters
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
		const surface = evt.context.canvas.width * evt.context.canvas.height, // Map pixels number
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
			cluster: nbClusters,
			id: features[0].id, // Pseudo id = the id of the first feature in the cluster
			name: lines.join('\n'),
		});
	}

	return clusterLayer;
}

// Add a listener to manage hovered features
function addMapListener(map) {
	if (typeof map.lastHoveredFeature == 'undefined') { // Once for a map
		map.lastHoveredFeature = null;

		map.on(['pointermove', 'click'], evt => {
			// Detect hovered fature
			let hoveredLayer = null;
			const hoveredFeature = map.forEachFeatureAtPixel(
				map.getEventPixel(evt.originalEvent),
				function(f, l) {
					hoveredLayer = l;
					return f;
				}, {
					hitTolerance: 6, // Default 0
				}
			);

			// Setup the curseur
			map.getViewport().style.cursor = hoveredFeature && !hoveredLayer.options.noClick ? 'pointer' : '';

			// Change this feature only style (As the main style is a layer only style)
			if (map.lastHoveredFeature != hoveredFeature) {
				if (map.lastHoveredFeature)
					map.lastHoveredFeature.setStyle(null);

				if (hoveredFeature) {
					hoveredFeature.setStyle([
						new ol.style.Style({
							...hoveredLayer.options.displayStyle(hoveredFeature, hoveredFeature.getProperties(), hoveredLayer),
							// The hovering style can overload some styles options
							...hoveredLayer.options.hoverStyle(hoveredFeature, hoveredFeature.getProperties(), hoveredLayer),
						}),
						new ol.style.Style( // Need a separate style because of text option on the both
							hoveredLayer.options.clusterStyle(hoveredFeature.getProperties()),
						),
					]);
				}
				map.lastHoveredFeature = hoveredFeature;
			}

			// Click on a feature
			if (evt.type == 'click' && !hoveredLayer.options.noClick) {
				const hoveredProperties = hoveredFeature.getProperties();
				if (hoveredProperties.url) {
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
function styleLabel(feature, text, styleOptions) {
	const elLabel = document.createElement('span'),
		area = ol.extent.getArea(feature.getGeometry().getExtent()), // Detect lines or polygons
		//BEST on peut aussi détecter la présence d'une icone
		styleTextOptions = {
			textBaseline: area ? 'middle' : 'bottom',
			offsetY: area ? 0 : -14, // Above the icon
			padding: [1, 1, 0, 3],
			font: '14px Calibri,sans-serif',
			fill: new ol.style.Fill({
				color: 'black',
			}),
			backgroundFill: new ol.style.Fill({
				color: 'white',
			}),
			backgroundStroke: new ol.style.Stroke({
				color: 'blue',
			}),
			...styleOptions,
		};

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = text;
	styleTextOptions.text = elLabel.innerHTML;

	return {
		text: new ol.style.Text(styleTextOptions),
	};
}

// Simplify & agreagte an array of lines
function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}