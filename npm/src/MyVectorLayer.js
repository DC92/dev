/**
 * MyVectorLayer.js
 * Facilities to vector layers
 */

import 'ol/ol.css';
//TODO verify if all are used
import Cluster from 'ol/source/Cluster';
import Feature from 'ol/Feature';
import GeoJSON from 'ol/format/GeoJSON';
import Point from 'ol/geom/Point';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import * as extent from 'ol/extent';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as style from 'ol/style';

// MyOl
import * as stylesOptions from './stylesOptions';


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
				strategy: loadingstrategy.bbox,
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

			if (options.strategy == loadingstrategy.bbox)
				args.bbox = options.bbox(...arguments);

			// Clean null & not relative parameters
			Object.keys(args).forEach(k => {
				if (k == '_path' || args[k] == 'on' || !args[k] || !args[k].toString())
					delete args[k];
			});

			return url + '?' + new URLSearchParams(args).toString();
		}

		function bbox_(extent, resolution, mapProjection) {
			return proj.transformExtent(
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

		// Generate a center point where to display the cluster
		function geometryFunction_(feature) {
			const geometry = feature.getGeometry();

			if (geometry) {
				const ex = feature.getGeometry().getExtent(),
					featurePixelPerimeter = (ex[2] - ex[0] + ex[3] - ex[1]) *
					2 / this.resolution;

				// Don't cluster lines or polygons whose the extent perimeter is more than x pixels
				if (featurePixelPerimeter > options.browserClusterFeaturelMaxPerimeter)
					this.addFeature(feature);
				else
					return new Point(extent.getCenter(feature.getGeometry().getExtent()));
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
				name: stylesOptions.agregateText(lines),
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
			//browserClusterMinDistance:50, // (pixels) distance above which the browser clusterises
			//browserClusterFeaturelMaxPerimeter: 300, // (pixels) perimeter of a line or poly above which we do not cluster

			source: options.browserClusterMinDistance ?
				new MyClusterSource(options) : // Use a cluster source and a vector source to manages clusters
				new MyVectorSource(options), // or a vector source to get the data
			maxResolution: options.serverClusterMinResolution,

			...options,
		});

		this.options = options; // Mem for further use
	}

	reload(visible) {
		this.setVisible(visible);
		this.getSource().refresh();
	}
}

class MyServerClusterVectorLayer extends MyBrowserClusterVectorLayer {
	constructor(options) {
		//serverClusterMinResolution: 100, // (map units per pixel) resolution above which we ask clusters to the server

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

	// Propagate the reload to the altLayer
	reload(visible) {
		super.reload(visible);

		if (this.altLayer)
			this.altLayer.reload(visible);
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

			basicStylesOptions: stylesOptions.basic, // (feature, layer)
			clusterStylesOptions: stylesOptions.cluster,
			spreadClusterStylesOptions: stylesOptions.spreadCluster,
			hoverStylesOptions: stylesOptions.hover,
			style: style_,

			...opt,
		};

		super(options);

		this.selector = new Selector(options.selectName, selection => this.reload());
		this.setVisible(this.selector.getSelection().length); // Hide the layer if no selection at the init //TODO BUG ne cache pas AltLayer !

		const layer = this;

		function style_(feature, resolution) {
			const sof = !feature.getProperties().cluster ? options.basicStylesOptions :
				resolution > options.spreadClusterMaxResolution ? options.spreadClusterStylesOptions :
				options.clusterStylesOptions;

			// Function returning an array of styles options
			return sof(feature, layer)
				.map(so => new style.Style(so)); // Transform into an array of Style objects
		}
	}

	reload() {
		super.reload(this.selector.getSelection().length);
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
					extent.getCenter(hoveredFeature.getGeometry().getExtent())
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
				const f = hoveredSubFeature.clone();

				f.setStyle(
					new style.Style(hoveredLayer.options.hoverStylesOptions(f, hoveredLayer))
				);

				source.clear();
				source.addFeature(f);

				map.getViewport().style.cursor =
					hoveredProperties.link || hoveredProperties.cluster ?
					'pointer' :
					'';
			}
		}
		// Reset hoverLayer, style & cursor
		else {
			source.clear();
			map.getViewport().style.cursor = '';
		}

		// Mem hovered feature for next change
		map.lastHoveredSubFeature = hoveredSubFeature;
	}
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