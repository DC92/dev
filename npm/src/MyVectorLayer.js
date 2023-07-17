/**
 * MyVectorLayer.js
 * Facilities to vector layers 
 */

import 'ol/ol.css';
//TODO verify if all is used
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


/**
 * GeoJSON vector display
 * url calculation
 * display the loading status
 */
class MyVectorSource extends VectorSource {
	constructor(opt) {
		const options = {
				// host: '',
				// query: (extent, resolution, mapProjection) => ({_path: '...'}), // this = options
				url: url_, // (extent, resolution, mapProjection)
				strategy: bbox,
				bbox: bbox_, // (extent, resolution, mapProjection)
				projection: 'EPSG:4326',
				...opt,
			},
			statusEl = document.getElementById(options.selectName + '-status');

		super({
			format: new GeoJSON({
				dataProjection: options.projection,
			}),
			...options,
		});

		// Display loading status
		if (statusEl)
			this.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], evt => {
				if (!statusEl.textContent.includes('error'))
					statusEl.innerHTML = '';

				switch (evt.type) {
					case 'featuresloadstart':
						statusEl.innerHTML = '&#8987;';
						break;
					case 'featuresloaderror':
						statusEl.innerHTML = '&#9888;';
						//BEST status out of zoom bounds
				}
			});

		function url_() {
			const args = options.query(...arguments),
				url = options.host + args._path; // Mem _path

			if (options.strategy == bbox)
				args.bbox = options.bbox(...arguments);

			// Clean null & not relative parameters
			Object.keys(args).forEach(k => {
				if (k == '_path' || args[k] == 'on' || !args[k] || !args[k].toString())
					delete args[k];
			});

			return url + '?' + new URLSearchParams(args).toString();
		}

		function bbox_(extent, resolution, mapProjection) {
			return transformExtent(
				extent,
				mapProjection,
				options.projection, // Received projection
			).map(c => c.toPrecision(6)); // Limit the number of digits
		}
	}
}

/**
 * Cluster source to manage clusters in the browser
 */
class MyClusterSource extends Cluster {
	constructor(options) {
		super({
			distance: options.browserClusterMinDistance,
			source: new MyVectorSource(options), // Origin of mfeatures to cluster
			geometryFunction: geometryFunction_,
			createCluster: createCluster_,
		});

		// Generate a center point where display the cluster
		function geometryFunction_(feature) {
			const geometry = feature.getGeometry();

			if (geometry) {
				const extent = feature.getGeometry().getExtent(),
					featurePixelPerimeter = (extent[2] - extent[0] + extent[3] - extent[1]) *
					2 / this.resolution;

				// Don't cluster lines or polygons whose the extent perimeter is more than x pixels
				if (featurePixelPerimeter > options.browserClusterFeaturelMaxPerimeter)
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

		// Redirect the refresh method to the wrapped source
		//TODO BUG duplicate call at init & selector
		this.refresh = () => this.getSource().refresh();
	}
}

/**
 * Browser & server clustered layer
 */
class MyBrowserClusterVectorLayer extends VectorLayer {
	constructor(options) {
		super({
			//browserClusterMinDistance:50, // Distance above which the browser clusterises
			//browserClusterFeaturelMaxPerimeter: 300, // Perimeter (in pixels) of a line or poly above which we do not cluster

			source: options.browserClusterMinDistance ?
				new MyClusterSource(options) : // Use a cluster source and a vector source to manages clusters
				new MyVectorSource(options), // or a vector source to get the data
			maxResolution: options.serverClusterMinResolution,

			...options,
		});

		this.options = options; // Mem for further use //TODO true ???
	}

	// Hide or call the url when the selection changes
	refresh(visible, reload) {
		this.setVisible(visible);

		if (visible && reload)
			this.getSource().refresh();
	}
}

class MyServerClusterVectorLayer extends MyBrowserClusterVectorLayer {
	constructor(options) {
		//serverClusterMinResolution: 100, // Resolution above which we ask clusters to the server

		// Low resolutions layer to display the normal data
		super(options);

		// High resolutions layer to get and display the clusters delivered by the server at hight resolutions
		if (options.serverClusterMinResolution)
			this.altLayer = new MyBrowserClusterVectorLayer({
				maxResolution: undefined,
				minResolution: options.serverClusterMinResolution,
				...options,
			});
	}

	setMapInternal(map) { //HACK execute actions on Map init
		if (this.altLayer)
			map.addLayer(this.altLayer);

		return super.setMapInternal(map);
	}

	// Propagate the refresh to the altLayer
	refresh(visible, reload) {
		super.refresh(visible, reload);

		if (this.altLayer)
			this.altLayer.refresh(visible, reload);
	}
}

/**
 * Facilities added vector layer
 * Style features
 * Layer & features selector
 */
export class MyVectorLayer extends MyServerClusterVectorLayer {
	constructor(opt) {
		const options = {
			convertProperties: p => p, // Default : translate properties to standard MyOl (to be used in styles)

			basicStylesOptions: basicStylesOptions, // (feature, resolution, options)
			clusterStylesOptions: clusterStylesOptions, // (feature, resolution, options)
			spreadClusterStylesOptions: spreadClusterStylesOptions, // (feature, resolution, options)
			hoverStylesOptions: hoverStylesOptions, // (feature, resolution, options)
			style: style_,

			...opt,
		};

		function style_(feature, resolution) {
			const stylesOptionsFunction = !feature.getProperties().cluster ?
				options.basicStylesOptions :
				resolution > options.spreadClusterMaxResolution ?
				options.spreadClusterStylesOptions :
				options.clusterStylesOptions;

			// Function returning an array of styles options
			return stylesOptionsFunction(feature, resolution, options)
				.map(so => new Style(so)); // Transform into an array of Style objects
		}

		super(options);

		this.selector = new Selector(options.selectName, selection => {
			this.refresh(selection.length, true)
		});

		this.refresh(this.selector.getSelection().length); // Hide the layer if no selection at the init
	}
}

/**
 * Hover & click management
 * Display the hovered feature with the hover style
 * Go to the link property when click a feature
 */
export class HoverLayer extends VectorLayer {
	constructor() {
		super({
			source: new VectorSource(),
			zIndex: 200,
		});
	}

	// Attach an hover & click listener to the map
	setMapInternal(map) { //HACK execute actions on Map init
		// Basic listeners
		map.on(['pointermove', 'click'], evt => this.mouseListener(evt));

		// Leaving the map reset hovering
		window.addEventListener('mousemove', evt => {
			const divRect = map.getTargetElement().getBoundingClientRect();

			// The mouse is outside of the map
			if (evt.clientX < divRect.left || divRect.right < evt.clientX ||
				evt.clientY < divRect.top || divRect.bottom < evt.clientY)
				this.getSource().clear()
		});

		return super.setMapInternal(map);
	}

	mouseListener(evt) {
		const map = evt.map,
			source = this.getSource();

		// Find the first hovered feature & layer
		let hoveredLayer = null,
			hoveredFeature = map.forEachFeatureAtPixel(
				map.getEventPixel(evt.originalEvent),
				function(f, l) {
					if (l && l.options) {
						hoveredLayer = l;
						return f; // Return feature & stop the search
					}
				}, {
					hitTolerance: 6, // For lines / Default 0
				}
			),
			hoveredSubFeature = hoveredFeature;

		if (hoveredFeature) {
			const hoveredProperties = hoveredLayer.options.convertProperties(
					hoveredFeature.getProperties()
				),
				featurePosition = map.getPixelFromCoordinate(
					getCenter(hoveredFeature.getGeometry().getExtent())
				);

			// Find sub-feature from a spread cluster
			if (hoveredProperties.cluster) {
				hoveredProperties.features.every(f => {
					const p = f.getProperties();

					// Only for spread clusters
					if (p.xLeft)
						hoveredSubFeature = f;

					// Stop when found
					return evt.originalEvent.layerX >
						featurePosition[0] + p.xLeft;
				});
			}

			const hoveredSubProperties = hoveredLayer.options.convertProperties(
				hoveredSubFeature.getProperties()
			);

			// Click
			if (evt.type == 'click') {
				// Click cluster
				if (hoveredProperties.cluster)
					map.getView().animate({
						zoom: map.getView().getZoom() + 2,
						center: hoveredProperties.geometry.getCoordinates(),
					});
				// Click link
				else if (hoveredSubProperties.link) {
					// Open a new tag
					if (evt.originalEvent.ctrlKey)
						window.open(hoveredSubProperties.link, '_blank').focus();
					else
						// Open a new window
						if (evt.originalEvent.shiftKey)
							window.open(hoveredSubProperties.link, '_blank', 'resizable=yes').focus();
						// Go on the same window
						else
							window.location.href = hoveredSubProperties.link;
				}
			}
			// Hover
			else if (hoveredSubFeature != map.lastHoveredSubFeature) {
				// Add the hovered feature to the hoverLayer
				source.clear();
				source.addFeature(hoveredSubFeature);

				// Set style
				this.setStyle(new Style(
					labelStylesOptions(hoveredSubFeature, undefined, true, hoveredLayer)
				));

				// Set cursor
				map.getViewport().style.cursor =
					hoveredProperties.link || hoveredProperties.cluster ?
					'pointer' :
					'';
			}
		}
		// Reset hoverLayer, style & cursor
		else {
			source.clear();
			//TODO ? this.setStyle();
			map.getViewport().style.cursor = '';
		}

		// Mem hovered feature for next change
		map.lastHoveredSubFeature = hoveredSubFeature;
	}
}

/**
 * Some usefull style functions
 */
export function basicStylesOptions(feature, resolution, options) {
	const properties = options.convertProperties(feature.getProperties());

	return [{
		image: properties.icon ? new Icon({
			src: properties.icon,
		}) : null,

		...labelStylesOptions(...arguments),

		stroke: new Stroke({
			color: 'blue',
			width: 2,
		}),

		fill: new Fill({
			color: 'rgba(0,0,256,0.3)',
		}),
	}];
}

export function labelStylesOptions(feature, resolution, options) {
	const hover = null; //TODO

	const properties = options.convertProperties(feature.getProperties()),
		elLabel = document.createElement('span');

	if (properties.cluster)
		properties.attribution = null;

	//HACK to render the html entities in the canvas
	elLabel.innerHTML = hover ? agregateText([ //TODO put that on convertProperties ???
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
				textBaseline: properties.icon ? 'bottom' : 'middle',
				offsetY: properties.icon ? -13 : 0, // Above the icon
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
			zIndex: 100,
		};
}

export function clusterStylesOptions(feature) {
	return [{
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
			text: feature.getProperties().cluster.toString(),
			font: '12px Verdana',
		}),
	}];
}

export function spreadClusterStylesOptions(feature, resolution, options) {
	let properties = feature.getProperties(),
		x = 0.95 + 0.45 * properties.cluster,
		so = [];

	if (properties.features)
		properties.features.forEach(f => {
			const stylesOptions = options.basicStylesOptions(...arguments);

			if (stylesOptions.length) {
				const image = stylesOptions[0].image;

				if (image) {
					image.setAnchor([x -= 0.9, 0.5]);
					f.setProperties({ // Mem the shift for hover detection
						xLeft: (1 - x) * image.getImage().width,
					}, true);
					so.push({
						image: image,
					});
				}
			}
		});

	so.push(labelStylesOptions(...arguments));

	return so;
}

export function hoverStylesOptions(feature, resolution, options) {
	//TODO
}

// Simplify & aggregate an array of lines
function agregateText(lines, glue) {
	return lines
		.filter(Boolean) // Avoid empty lines
		.map(l => l.toString().replace('_', ' ').trim())
		.map(l => l[0].toUpperCase() + l.substring(1))
		.join(glue || '\n');
}

/**
 * Manage a collection of checkboxes with the same name
 * name : name of all the related input checkbox
 * The checkbox without value (all) check / uncheck the others
 * Check all the checkboxes check the checkbox without value (all)
 * Current selection is saved in window.localStorage
 * You can force the values in window.localStorage[simplified name]
 * callBack(selection) : function to call at init or click
 * getSelection() : returns an array of selected values
 * If no name is specified or there are no checkbox with this name, return []
 */
export class Selector {
	constructor(name, callBack) {
		if (name) {
			this.safeName = 'myol_' + name.replace(/[^a-z]/ig, '');
			this.init = (localStorage[this.safeName] || '').split(',');
			this.selectEls = [...document.getElementsByName(name)];
			this.selectEls.forEach(el => {
				el.addEventListener('click', evt => this.onClick(evt));
				el.checked =
					this.init.includes(el.value) ||
					this.init.includes('all') ||
					this.init.join(',') == el.value;
			});
			this.callBack = callBack;
			this.onClick(); // Init with "all"
		}
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
		if (this.safeName && this.getSelection().length)
			localStorage[this.safeName] = this.getSelection().join(',');
		else
			delete localStorage[this.safeName];

		if (evt && typeof this.callBack == 'function')
			this.callBack(this.getSelection());
	}

	getSelection() {
		if (this.selectEls)
			return this.selectEls
				.filter(el => el.checked && el.value != 'all')
				.map(el => el.value);

		return [];
	}
}