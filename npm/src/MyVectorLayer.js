/**
 * MyVectorLayer.js
 * Facilities to vector layers 
 */

// Openlayers
import 'ol/ol.css';
import Cluster from 'ol/source/Cluster.js';
import Feature from 'ol/Feature.js';
import GeoJSON from 'ol/format/GeoJSON.js';
import Icon from 'ol/style/Icon.js';
import Point from 'ol/geom/Point.js';
import VectorLayer from 'ol/layer/Vector.js';
import VectorSource from 'ol/source/Vector.js';
import {
	getCenter,
} from 'ol/extent.js';
import {
	bbox,
} from 'ol/loadingstrategy.js';
import {
	transformExtent,
} from 'ol/proj.js';
import {
	Circle,
	Fill,
	Stroke,
	Style,
	Text,
} from 'ol/style.js';


// geoJSON vector display
export class MyVectorSource extends VectorSource {
	constructor(opt) {
		const options = {
				strategy: bbox,
				bbox: bbox_,
				url: url_,
				format: new GeoJSON(),
				projection: 'EPSG:4326',
				...opt,
			},
			statusEl = document.getElementById(options.selectName + '-status');

		super(options);

		// Display loading status
		if (statusEl)
			this.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
				if (!statusEl.textContent.includes('error'))
					statusEl.innerHTML = '';

				switch (evt.type) {
					case 'featuresloadstart':
						statusEl.innerHTML = '&#8987;';
						break;
					case 'featuresloaderror':
						statusEl.innerHTML = 'Erreur !';
						//BEST status out of zoom bounds
				}
			});

		function bbox_(extent, _, mapProjection) {
			return transformExtent(
				extent,
				mapProjection,
				options.projection, // Received projection
			).map(c => c.toFixed(4)); // Round to 4 digits
		}

		function url_(extent, resolution, projection) {
			//TODO BUG pourquoi est-il appelé 2 fois à l'init ?
			const query = options.query(options, ...arguments),
				url = options.host + query._path;

			// Clean null & not relative parameters
			Object.keys(query).forEach(k => {
				if (!query[k] || k == '_path' || query[k] == 'on')
					delete query[k];
			});

			if (options.strategy == bbox)
				query.bbox = options.bbox(...arguments);

			return url + '?' + new URLSearchParams(query).toString();
		}
	}
}

/* Browser clustered source
   The layer use one source to get the data & a cluster source to manages clusters
*/
export class MyClusterSource extends Cluster {
	constructor(options) {
		// Wrapped source
		const wrappedSource = new MyVectorSource(options);

		// Cluster source
		super({
			source: wrappedSource,
			geometryFunction: geometryFunction_,
			createCluster: createCluster_,
		});

		// Redirect the refresh method to the wrapped source
		this.refresh = () => this.getSource().refresh();

		// Generate a center point where display the cluster
		function geometryFunction_(feature) {
			const geometry = feature.getGeometry();

			if (geometry) {
				const extent = feature.getGeometry().getExtent(),
					pixelSemiPerimeter = (extent[2] - extent[0] + extent[3] - extent[1]) / this.resolution;

				// Don't cluster lines or polygons whose the extent perimeter is more than 400 pixels
				if (pixelSemiPerimeter > 200)
					this.addFeature(feature);
				else
					return new Point(getCenter(feature.getGeometry().getExtent()));
			}
		}

		// Generate the features to render the cluster
		function createCluster_(point, features) {
			let nbClusters = 0,
				includeCluster = false,
				lines = [];

			features.forEach(f => {
				const properties = options.convertProperties(f.getProperties());

				lines.push(properties.name);
				nbClusters += parseInt(properties.cluster) || 1;
				if (properties.cluster)
					includeCluster = true;
			});

			// Single feature : display it
			if (nbClusters == 1)
				return features[0];

			if (includeCluster || lines.length > 5)
				lines = ['Cliquer pour zoomer'];

			// Display a cluster point
			return new Feature({
				id: features[0].getId(), // Pseudo id = the id of the first feature in the cluster
				name: agregateText(lines),
				geometry: point, // The gravity center of all the features in the cluster
				features: features,
				cluster: nbClusters, //BEST voir pourquoi on ne met pas ça dans properties
			});
		}
	}
}

// Facilities added vector layer
export class MyVectorLayer extends VectorLayer {
	constructor(opt) {
		const options = {
			// Mandatory
			// host: '//chemineur.fr/',
			// query: () => ({_path: '...'}),
			convertProperties: () => {}, // Translate properties to standard MyOl
			stylesOptions: basicStylesOptions, // (feature, resolution, hover, layer)

			// Generic
			selector: opt.selectName ? new Selector(opt.selectName) : null,
			style: style_,

			// Browser cluster options
			browserClusterMinResolution: 50, // Resolution above which the browser clusterises

			...opt,
		};

		super({
			source: options.browserClusterMinResolution ?
				new MyClusterSource(options) : new MyVectorSource(options),
			...options,
		});

		const layer = this; // For use in functions
		this.options = options; // Mem for further use

		if (options.selectName)
			options.selector.setCallBack(selection => this.refresh(selection.length));

		function style_(feature, resolution, hoveredFeature) {
			const properties = feature.getProperties(),
				stylesOptionsFunction = properties.cluster ?
				clusterStylesOptions :
				options.stylesOptions;

			// Function returning an array of styles options
			return stylesOptionsFunction(feature, resolution, hoveredFeature, layer)
				.map(so => new Style(so)); // Transform into an array of Style objects
		}
	}

	//HACK execute actions on Map init
	setMapInternal(map) {
		if (this.options.altLayer)
			map.addLayer(this.options.altLayer);

		attachMouseListener(map);

		return super.setMapInternal(map);
	}

	// Refresh the layer when the url need to change
	refresh(visible) {
		this.setVisible(visible);
		if (visible)
			this.getSource().refresh();

		if (this.options.altLayer)
			this.options.altLayer.refresh(visible);
	}
}

/* Server clustered source
   This uses one layer to display the normal data at low resolutions
   and another to get and display the clusters delivered by the server at hight resolutions
*/
export class ServerClusterVectorLayer extends MyVectorLayer {
	constructor(opt) {
		const options = {
				serverClusterMinResolution: 100, // Resolution above which we ask clusters to the server
				...opt,
			},

			// High resolutions layer
			hightResolutionsLayer = new MyVectorLayer({
				...options,
				minResolution: options.serverClusterMinResolution,
			});

		// Low resolutions layer
		super({
			...options,
			maxResolution: options.serverClusterMinResolution,
			altLayer: hightResolutionsLayer,
		});
	}
}

/**
 * Manage a collection of checkboxes with the same name
 * name : name of all the rlated checkboxes
 * The checkbox without value (all) check / uncheck the others
 * Check all the checkboxes check the checkbox without value (all)
 * Current selection is saved in window.localStorage
 * You can force the values in window.localStorage[simplified name]
 * callBack(selection) : function to call at init or clock
 * getSelection() : returns an array of selected values
 * If there are no checkbox with this name, return []
 * If no name is specified, return [true]
 */
export class Selector {
	constructor(name, callBack) {
		if (name) {
			this.safeName = 'myol_' + name.replace(/[^a-z]/ig, '');
			this.init = (localStorage[this.safeName] || '').split(',');
			this.selectEls = [...document.getElementsByName(name)];
			this.selectEls.forEach(el => {
				el.checked =
					this.init.includes(el.value) ||
					this.init.includes('all') ||
					this.init.join(',') == el.value;
				el.addEventListener('click', evt => this.onClick(evt));
			});
			this.onClick(); // Init with "all"
		}
		this.callBack = callBack;
	}

	onClick(evt) {
		// Test the "all" box & set other boxes
		if (evt && evt.target.value == 'all')
			this.selectEls
			.forEach(el => el.checked = evt.target.checked);

		// Test if all values are checked
		const allChecked = this.selectEls
			.filter(el => !el.checked && el.value != 'all');

		// Set the "all" box
		this.selectEls
			.forEach(el => {
				if (el.value == 'all')
					el.checked = !allChecked.length;
			});

		// Save the current status
		if (this.safeName && this.getSelection() && this.getSelection().length)
			localStorage[this.safeName] = this.getSelection().join(',');
		else
			delete localStorage[this.safeName];

		if (evt)
			this.setCallBack(this.callBack); // Call callBack
	}

	setCallBack(callBack) {
		this.callBack = callBack;
		if (typeof this.callBack == 'function')
			callBack(this.getSelection());
	}

	getSelection() {
		if (this.safeName)
			return this.selectEls
				.filter(el => el.checked && el.value != 'all')
				.map(el => el.value);
		else
			return [true];
	}
}

// Hover & click management
function attachMouseListener(map) {
	// Attach one hover & click listener to each map
	if (!(map.getListeners() || []).includes(mouseListener)) { // Only once for each map
		map.on(['pointermove', 'click'], mouseListener);
		window.addEventListener('mousemove', evt => {
			// Leaving the map reset hovering
			const divRect = map.getTargetElement().getBoundingClientRect();

			// The mouse is outside of the map
			if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				mouseListener({
					map: map,
					originalEvent: {
						clientX: 10000, // Outside of the map
						clientY: 10000,
					},
				});
		});
	}
}

function mouseListener(evt) {
	const map = evt.map;

	// Find the first hovered feature & layer
	let hoveredLayer = null,
		hoveredFeature = map.forEachFeatureAtPixel(
			map.getEventPixel(evt.originalEvent),
			function(feature, layer) {
				if (layer && layer.options) {
					hoveredLayer = layer;
					return feature; // And stop the search
				}
			}, {
				hitTolerance: 6, // For lines / Default 0
			}
		),
		hoveredSubFeature = hoveredFeature,
		hoveredSubProperties = {};

	if (hoveredFeature) {
		// Find sub-feature from a detailed cluster
		const hoveredProperties = hoveredFeature.getProperties(),
			featurePosition = map.getPixelFromCoordinate(
				getCenter(hoveredFeature.getGeometry().getExtent())
			),
			deltaXCursor = evt.originalEvent.layerX - featurePosition[0];

		if (hoveredProperties.features)
			hoveredProperties.features.forEach(f => {
				if (deltaXCursor < f.getProperties().xRight)
					hoveredSubFeature = f;
			});

		if (hoveredSubFeature)
			hoveredSubProperties = hoveredLayer.options.convertProperties(hoveredSubProperties);

		if (evt.type == 'click') {
			if (hoveredSubProperties.link) {
				// Open a new tag
				if (evt.originalEvent.ctrlKey)
					window.open(hoveredSubProperties.link, '_blank').focus();
				else
					// Open a new window
					if (evt.originalEvent.shiftKey)
						window.open(hoveredSubProperties.link, '_blank', 'resizable=yes').focus();
					else
						// Go on the same window
						window.location.href = hoveredSubProperties.link;
			}
			// Cluster
			if (hoveredProperties.cluster)
				map.getView().animate({
					zoom: map.getView().getZoom() + 2,
					center: hoveredProperties.geometry.getCoordinates(),
				});
		} else
			// Hover
			if (map.lastHoveredFeature != hoveredSubFeature) {
				map.getViewport().style.cursor =
					hoveredSubProperties.link || hoveredProperties.cluster ? 'pointer' : '';

				// Remove previous style
				if (map.lastHoveredFeature)
					map.lastHoveredFeature.setStyle();

				// Set the feature style to the style function with the hoveredFeature set
				//TODO zIndex
				hoveredFeature.setStyle((feature, resolution) =>
					hoveredLayer.getStyleFunction()(feature, resolution, hoveredSubFeature)
				);
			}
	} else {
		map.getViewport().style.cursor = '';
		if (map.lastHoveredFeature)
			map.lastHoveredFeature.setStyle();
	}
	map.lastHoveredFeature = hoveredFeature;
	map.lastHoveredSubFeature = hoveredSubFeature;
}

/**
 * Some usefull style functions
 */
export function basicStylesOptions(feature, resolution, hover, layer) {
	const properties = layer.options.convertProperties(feature.getProperties());

	return [{
		image: properties.icon ? new Icon({
			src: properties.icon,
		}) : null,

		...labelStylesOptions(...arguments),

		stroke: new Stroke({
			color: hover ? 'red' : 'blue',
			width: 2,
		}),

		fill: new Fill({
			color: 'rgba(0,0,256,0.3)',
		}),
	}];
}

export function labelStylesOptions(feature, _, hover, layer) {
	const properties = layer.options.convertProperties(feature.getProperties()),
		elLabel = document.createElement('span'),
		isPoint = !properties.geometry || properties.geometry.getType() == 'Point';

	if (properties.cluster)
		properties.attribution = null;

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = hover ? agregateText([
		properties.name,
		agregateText([
			properties.ele && properties.ele ? parseInt(properties.ele) + ' m' : null,
			properties.bed && properties.bed ? parseInt(properties.bed) + '\u255E\u2550\u2555' : null,
		], ', '),
		properties.type,
		properties.attribution,
	]) : properties.label || null;

	if (elLabel.innerHTML)
		return {
			text: new Text({
				text: elLabel.innerHTML,
				//BEST line & poly label following the cursor
				textBaseline: isPoint ? 'bottom' : 'middle',
				offsetY: isPoint ? -13 : 0, // Above the icon
				padding: [1, 1, -1, 3],
				font: '12px Verdana',
				overflow: hover,
				fill: new Fill({
					color: 'black',
				}),
				backgroundFill: new Fill({
					color: 'white',
				}),
				backgroundStroke: new Stroke({
					color: 'blue',
				}),
			}),
		};
}

export function clusterStylesOptions(feature, resolution, hoverfeature, layer) {
	const properties = layer.options.convertProperties(feature.getProperties()),
		so = [];

	// Hi resolution : circle
	if (resolution > layer.options.browserClusterMinResolution) {
		if (hoverfeature)
			so.push(labelStylesOptions(...arguments));

		so.push({
			image: new Circle({
				radius: 14,
				stroke: new Stroke({
					color: 'blue',
				}),
				fill: new Fill({
					color: 'white',
				}),
			}),
			text: new Text({
				text: properties.cluster.toString(),
				font: '12px Verdana',
			}),
			//TODO text zIndex ?
		});
	} else {
		// Low resolution : separated icons
		//TODO detecte cluster bien à gauche du dernier
		let x = 0.95 + 0.45 * properties.cluster;

		properties.features.forEach(f => {
			const styles = layer.getStyleFunction()(f, resolution, hoverfeature);

			if (styles.length) {
				const image = styles[0].getImage();

				if (image) {
					image.setAnchor([x -= 0.9, 0.5]);
					f.setProperties({ // Mem the shift for hover detection
						xRight: x * image.getImage().width,
					}, true);
					so.push({
						image: image,
					});
				}
			}
		});

		so.push(labelStylesOptions(hoverfeature || feature, resolution, hoverfeature, layer));
	}
	return so;
}

/**
  Styles Options are an array of objects containing style options
  When concatenate, the first stylesOptions object is merged while the others are added
*/
export function concatenateStylesOptions() { //TODO DELETE
	// First argument becomes the base of the result
	const r = [...arguments[0]];

	// Others arguments are added
	for (var i = 1; i < arguments.length; i++) {
		// First stylesOptions are concatenated
		r[0] = {
			...r[0],
			...arguments[i][0],
		};

		// Other stylesOptions are added
		for (var j = 1; j < arguments[i].length; j++) {
			r.push(arguments[i][j]);
		}
	}
	return r;
}

// Simplify & aggregate an array of lines
function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}