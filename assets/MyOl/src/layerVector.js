/**
 * This file adds some facilities to ol.layer.Vector
 */

/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 *
 * Options:
 * selectorName : <input name="SELECTORNAME"> url arguments selector
   can be several SELECTORNAME1,SELECTORNAME2,...
   display loading status <TAG id="SELECTOR_NAME-status"></TAG>
 * urlArgsFunction: function(layer_options, bbox, selections, extent, resolution, projection)
   returning an object describing the args. The .url member defines the url
 * convertProperties: function(properties, feature, options) convert some server properties to the one displayed by this package
 * styleOptionsFunction: function(feature, properties, options) returning options of the style of the features
 * styleOptionsClusterFunction: function(feature, properties, options) returning options of the style of the cluster bullets
 * hoverStyleOptionsFunction: function(feature, properties, options) returning options of the style when hovering the features
 * source.Vector options : format, strategy, attributions, ...
 */
function layerVector(opt) {
	const options = {
			selectorName: '',
			callBack: function() {
				layer.setVisible(
					selector(selectorsName[0]).length || // By default, visibility depends on the first selector only
					!options.selectorName // No selector at all
				);
				source.refresh();
			},
			styleOptionsClusterFunction: styleOptionsCluster,
			...opt
		},
		selectorsName = options.selectorName.split(','),
		format = new ol.format.GeoJSON(),
		source = new ol.source.Vector({
			url: url,
			format: format,
			strategy: ol.loadingstrategy.bbox,
			...options
		}),
		layer = new ol.layer.Vector({
			source: source,
			style: style,
			zIndex: 10, // Features : above the base layer (zIndex = 1)
			...options
		}),
		statusEl = document.getElementById(selectorsName[0] + '-status'); // XHR download tracking

	// Embark hover style to render hovering
	layer.hoverStyleOptionsFunction = options.hoverStyleOptionsFunction;

	// Setup the selector managers
	selectorsName.map(name => selector(name, options.callBack));

	// Init parameters depending on the selector
	options.callBack();

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

	// Default url callback function for the layer
	function url(extent, resolution, projection) {
		const args = options.urlArgsFunction(
				options, // Layer options
				ol.proj.transformExtent( // BBox
					extent,
					projection.getCode(), // Map projection
					'EPSG:4326' // Received projection
				)
				.map(c => c.toFixed(4)), // Round to 4 digits
				selectorsName.map(name => selector(name).join(',')), // Array of string: selected values separated with ,
				extent,
				resolution
			),
			query = [];

		// Add a version param depending on last change date to reload if modified
		if (sessionStorage.myol_lastChangeTime)
			args.v = parseInt((sessionStorage.myol_lastChangeTime % 100000000) / 10000);

		for (const a in args)
			if (a != 'url' && args[a])
				query.push(a + '=' + args[a]);

		return args.url + '?' + query.join('&');
	}

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
			if (feature.geometry.type == 'Point ') {
				const rnd = (feature.id / 3.14).toString().split('.');

				feature.geometry.coordinates[0] += ('0.0000' + rnd[0]) - 0.00005;
				feature.geometry.coordinates[1] += ('0.0000' + rnd[1]) - 0.00005;
			}
			return feature;
		});

		return ol.format.GeoJSON.prototype.readFeatures.call(this, JSON.stringify(json), opt);
	};

	// Style callback function for the layer
	function style(feature) {
		const properties = feature.getProperties(),
			styleOptionsFunction = properties.features || properties.cluster ?
			options.styleOptionsClusterFunction :
			options.styleOptionsFunction;

		if (typeof styleOptionsFunction == 'function')
			return new ol.style.Style(
				styleOptionsFunction(
					feature,
					properties
				)
			);
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
			...opt
		},
		layer = layerVector(options), // Basic layer (with all the points)
		clusterSource = new ol.source.Cluster({
			source: layer.getSource(),
			geometryFunction: geometryFunction,
			createCluster: createCluster,
			distance: options.distance,
		}),
		clusterLayer = new ol.layer.Vector({
			source: clusterSource,
			style: clusterStyle,
			visible: layer.getVisible(),
			zIndex: layer.getZIndex(),
			...options
		});

	clusterLayer.hoverStyleOptionsFunction = options.hoverStyleOptionsFunction;

	// Propagate setVisible following the selector status
	layer.on('change:visible', function() {
		clusterLayer.setVisible(this.getVisible());
	});

	// Tune the clustering distance depending on the zoom level
	clusterLayer.on('prerender', function(evt) { // Warning : only once for a map
		const surface = evt.context.canvas.width * evt.context.canvas.height, // Map pixels number
			distanceMinCluster = Math.min(
				evt.frameState.viewState.resolution, // No clusterisation on low resolution zooms
				Math.max(options.distance, Math.sqrt(surface / options.density))
			);

		if (clusterSource.getDistance() != distanceMinCluster) // Only when changed
			clusterSource.setDistance(distanceMinCluster);
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
 * Some usefull style functions
 */

// Get icon from an URL
//BEST BUG general : send cookies to server, event non secure
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

		return styleOptionsIcon('//chemineur.fr/ext/Dominique92/GeoBB/icones/' + iconName + '.' + iconCanvasExt());
	}
}

// Display a label with some data about the feature
function styleOptionsFullLabel(feature, properties) {
	let text = [],
		line = [];

	// Cluster
	if (properties.features || properties.cluster) {
		let includeCluster = !!properties.cluster;

		for (let f in properties.features) {
			const name = properties.features[f].getProperties().name;
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
		// 1st line
		if (properties.name)
			text.push(properties.name);

		// 2nd line
		if (properties.ele)
			line.push(parseInt(properties.ele) + ' m');
		if (properties.capacity)
			line.push(parseInt(properties.capacity) + '\u255E\u2550\u2555');
		if (line.length)
			text.push(line.join(', '));

		// 3rd line
		if (typeof properties.type == 'string' && properties.type)
			text.push(
				properties.type[0].toUpperCase() +
				properties.type.substring(1).replace('_', ' ')
			);

		// 4rd line
		if (properties.attribution)
			text.push('&copy;' + properties.attribution);
	}

	return styleOptionsLabel(text.join('\n'), feature, properties, true);
}

// Display a label with only the name
function styleOptionsLabel(text, feature, properties, important) {

	const elLabel = document.createElement('span'),
		area = ol.extent.getArea(feature.getGeometry().getExtent()), // Detect lines or polygons
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
				width: important ? 1 : 0.3,
			}),
			overflow: important,
		};

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = text;
	styleTextOptions.text = elLabel.innerHTML;

	return {
		text: new ol.style.Text(styleTextOptions),
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

/**
 * Global hovering functions layer
   To be declared & added once for a map
 */
function layerHover() {
	const source = new ol.source.Vector(),
		layer = new ol.layer.Vector({
			source: source,
		});

	layer.setMapInternal = function(map) { //HACK execute actions on Map init
		ol.layer.Vector.prototype.setMapInternal.call(this, map);

		map.on(['pointermove', 'click'], (evt) => {
			// Find hovered feature
			const found = map.forEachFeatureAtPixel(
				map.getEventPixel(evt.originalEvent),
				function(hoveredFeature, hoveredLayer) {
					const hoveredProperties = hoveredFeature.getProperties();

					// Click on a feature
					if (evt.type == 'click') {
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
						else if (hoveredProperties.features)
							map.getView().animate({
								zoom: map.getView().getZoom() + 2,
								center: hoveredProperties.geometry.getCoordinates(),
							});
					}

					// Over the hover (Label ?)
					if (hoveredLayer.ol_uid == layer.ol_uid)
						return true; // Don't undisplay it

					// Hover a feature
					if (typeof hoveredLayer.hoverStyleOptionsFunction == 'function') {
						source.clear();
						source.addFeature(hoveredFeature);
						layer.setStyle(new ol.style.Style(
							hoveredLayer.hoverStyleOptionsFunction(
								hoveredFeature,
								hoveredProperties
							)
						));
						layer.setZIndex(hoveredLayer.getZIndex() + 2); // Tune the hoverLayer zIndex just above the hovered layer

						return hoveredFeature; // Don't continue
					}
				}, {
					hitTolerance: 6, // Default 0
				}
			);

			// Erase existing hover if nothing found
			map.getViewport().style.cursor = found ? 'pointer' : '';
			if (!found)
				source.clear();
		});
	};

	// Leaving the map reset hovering
	window.addEventListener('mousemove', function(evt) {
		const divRect = layer.get('map').getTargetElement().getBoundingClientRect();

		// The mouse is outside of the map
		if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
			evt.clientY < divRect.top || divRect.bottom < evt.clientY)
			source.clear();
	});

	return layer;
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
function selector(name, callBack) {
	const selectorEls = [...document.getElementsByName(name)],
		safeName = 'myol_' + name.replace(/[^a-z]/ig, ''),
		init = (localStorage[safeName] || '').split(',');

	// Init
	if (typeof callBack == 'function') {
		selectorEls.forEach(el => {
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
			selectorEls
			.forEach(el => el.checked = evt.target.checked);

		// Test if all values are checked
		const allChecked = selectorEls
			.filter(el => !el.checked && el.value != 'all');

		// Set the "all" box
		selectorEls
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
		return selectorEls
			.filter(el => el.checked && el.value != 'all')
			.map(el => el.value);
	}

	return selection();
}