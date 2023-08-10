/**
 * Controls.js
 * Add some usefull controls
 */

import ol from '../../src/ol';
import MyGeocoder from './MyGeocoder';
import './MyControl.css';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class MyButton extends ol.control.Control {
	constructor(options) {
		super({
			element: document.createElement('div'),
			className: '',
			...options ||= {},
		});

		this.options = options; // Mem for further use

		// Add submenu below the button
		if (options.submenuEl)
			this.submenuEl = options.submenuEl;
		else if (options.submenuId)
			this.submenuEl = document.getElementById(options.submenuId);
		else {
			this.submenuEl = document.createElement('div');
			if (options.submenuHTML)
				this.submenuEl.innerHTML = options.submenuHTML;
		}

		// Display the button only if there are no label or submenu
		if (options.label && this.submenuEl && this.submenuEl.innerHTML) {
			// Create a button
			const buttonEl = document.createElement('button');
			buttonEl.setAttribute('type', 'button');
			buttonEl.innerHTML = options.label;
			buttonEl.addEventListener('click', evt => this.onChange(evt));

			// Populate the control
			this.element.className = 'ol-control myol-button ' + options.className;
			this.element.addEventListener('mouseover', evt => this.onChange(evt));
			this.element.addEventListener('mouseout', evt => this.onChange(evt));
			this.element.appendChild(buttonEl); // Add the button
			this.element.appendChild(this.submenuEl); // Add the submenu

			// Close the submenu when click or touch on the map
			document.addEventListener('click', evt => {
				const el = document.elementFromPoint(evt.x, evt.y);

				if (el && el.tagName == 'CANVAS')
					this.element.classList.remove('myol-button-selected');
			});
		}
	}

	onChange(evt) {
		if (evt.type == 'mouseover')
			this.element.classList.add('myol-button-hover');
		else // mouseout | click
			this.element.classList.remove('myol-button-hover');

		if (evt.type == 'click') // Mouse click & touch
			this.element.classList.toggle('myol-button-selected');

		// Close other open buttons
		for (let el of document.getElementsByClassName('myol-button'))
			if (el != this.element)
				el.classList.remove('myol-button-selected');
	}
}

/**
 * Geolocation control
 * Display status, altitude & speed
 */
export class MyGeolocation extends MyButton {
	constructor(opt) {
		const options = {
				...opt,
			},
			subMenu = location.href.match(/(https|localhost)/) ?
			//BEST use .html content / option
			'<p>Localisation GPS:</p>' +
			'<label>' +
			'<input type="radio" name="myol-gps-source" value="0" checked="checked" />' +
			'Inactif</label><label>' +
			'<input type="radio" name="myol-gps-source" value="1" />' +
			'Position GPS <span>(1) extérieur</span></label><label>' +
			'<input type="radio" name="myol-gps-source" value="2" />' +
			'Position GPS ou IP <span>(2) intérieur</span></label><hr><label>' +
			'<input type="radio" name="myol-gps-display" value="0" checked="checked" />' +
			'Graticule, carte libre</label><label>' +
			'<input type="radio" name="myol-gps-display" value="1" />' +
			'Centre la carte, nord en haut</label><label>' +
			'<input type="radio" name="myol-gps-display" value="2" />' +
			'Centre et oriente la carte <span>(3)</span></label>' +

			'<hr /><p>(1) plus précis en extérieur mais plus lent à initialiser, ' +
			'nécessite un capteur et une réception GPS.</p>' +
			'<p>(2) plus précis et rapide en intérieur ou en zone urbaine ' +
			'mais peut être très erroné en extérieur à l&apos;initialisation. ' +
			'Utilise les position des points WiFi proches en plus du GPS dont il peut se passer.</p>' +
			'<p>(3) nécessite un capteur magnétique et un explorateur le supportant.</p>' :

			// Si on est en http
			'<p>L&apos;utilisation du GPS nécessite https</p>' +
			'<a href="' + document.location.href.replace('http:', 'https:') + '">Passer en https<a>';

		super({
			className: 'myol-button-gps',
			label: '&#x2295;',
			submenuHTML: subMenu,
			...options,
		});

		// Add status display element
		this.statusEl = document.createElement('p');
		this.element.appendChild(this.statusEl);

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el => {
				el.onchange ||= evt => this.onChange(evt);
			});

		// Graticule
		this.graticuleFeature = new ol.Feature(); //BEST Use layer Graticule
		this.northGraticuleFeature = new ol.Feature();

		this.graticuleLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [this.graticuleFeature, this.northGraticuleFeature],
			}),
			zIndex: 20, // Above the features
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(128,128,255,0.2)',
				}),
				stroke: new ol.style.Stroke({
					color: '#20b',
					lineDash: [16, 14],
					width: 1,
				}),
			}),
		});

		this.graticuleFeature.setStyle(new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#000',
				lineDash: [16, 14],
				width: 1,
			}),
		}));

		this.northGraticuleFeature.setStyle(new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: '#c00',
				lineDash: [16, 14],
				width: 1,
			}),
		}));

		window.gpsValues = {}; // Store the measures for internal use & other controls

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener('deviceorientationabsolute', evt => {
			window.gpsValues.heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
			this.onChange(evt);
		});
	}

	setMap(map) {
		super.setMap(map);

		map.addLayer(this.graticuleLayer);
		map.on('moveend', evt => this.onChange(evt)); // Refresh graticule after map zoom

		this.geolocation = new ol.Geolocation({
			projection: map.getView().getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 1000,
				...this.options, //TODO séparer les options pour Geolocation / et autres
			},
		});
		this.geolocation.on('change', evt => this.onChange(evt));
		this.geolocation.on('error', function(error) {
			console.log('Geolocation error: ' + error.message);
		});
	}

	onChange(evt) {
		const sourceLevelEl = document.querySelector('input[name="myol-gps-source"]:checked'),
			displayLevelEl = document.querySelector('input[name="myol-gps-display"]:checked'),
			displayEls = document.getElementsByName('myol-gps-display'),
			sourceLevel = sourceLevelEl ? parseInt(sourceLevelEl.value) : 0, // On/off, GPS, GPS&WiFi
			displayLevel = displayLevelEl ? parseInt(displayLevelEl.value) : 0, // Graticule & sourceLevel
			map = this.getMap(),
			view = map ? map.getView() : null;

		// Tune the tracking level
		if (evt.target.name == 'myol-gps-source') {
			this.geolocation.setTracking(sourceLevel > 0);
			this.graticuleLayer.setVisible(false);
			window.gpsValues = {}; // Reset the values
			if (!sourceLevel)
				displayEls[0].checked = true;
			if (sourceLevel && displayLevel == 0)
				displayEls[2].checked = true;
		}

		// Get geolocation values
		['Position', 'AccuracyGeometry', 'Speed', 'Altitude'].forEach(valueName => {
			const value = this.geolocation['get' + valueName]();
			if (value)
				window.gpsValues[valueName.toLowerCase()] = value;
		});

		// State 1 only takes positions from the GPS (which have an altitude)
		if (sourceLevel == 1 && !window.gpsValues.altitude)
			window.gpsValues.position = null;

		// Render position & graticule
		if (map && view && sourceLevel && window.gpsValues.position) {
			// Estimate the viewport size to draw a visible graticule
			const p = window.gpsValues.position,
				hg = map.getCoordinateFromPixel([0, 0]),
				bd = map.getCoordinateFromPixel(map.getSize()),
				far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10,
				// The graticule
				geometry = [
					new ol.geom.MultiLineString([
						[
							[p[0] - far, p[1]],
							[p[0] + far, p[1]]
						],
						[
							[p[0], p[1]],
							[p[0], p[1] - far]
						],
					]),
				],
				// Color north in red
				northGeometry = [
					new ol.geom.LineString([
						[p[0], p[1]],
						[p[0], p[1] + far]
					]),
				];

			// The accuracy circle
			if (window.gpsValues.accuracygeometry)
				geometry.push(window.gpsValues.accuracygeometry);

			this.graticuleFeature.setGeometry(new ol.geom.GeometryCollection(geometry));
			this.northGraticuleFeature.setGeometry(new ol.geom.GeometryCollection(northGeometry));

			// Center the map
			if (displayLevel > 0)
				view.setCenter(p);

			// Orientation
			if (!sourceLevel || displayLevel == 1)
				view.setRotation(0);
			else if (window.gpsValues.heading && displayLevel == 2)
				view.setRotation(
					Math.PI / 180 * (window.gpsValues.heading - screen.orientation.angle) // Delivered ° reverse clockwize
				);

			// Zoom on the area
			if (!window.gpsValues.isZoomed) { // Only the first time after activation
				window.gpsValues.isZoomed = true;
				view.setZoom(17);

				// Close submenu when GPS locates
				this.element.classList.remove('myol-button-hover');
				this.element.classList.remove('myol-button-selected');
			}
			this.graticuleLayer.setVisible(true);
		} else
			view.setRotation(0); // Return to inactive state

		// Display data under the button
		let status = window.gpsValues.position ? '' : 'Sync...';
		if (window.gpsValues.altitude) {
			status = Math.round(window.gpsValues.altitude) + ' m';
			if (window.gpsValues.speed)
				status += ' ' + (Math.round(window.gpsValues.speed * 36) / 10) + ' km/h';
		}
		if (this.statusEl)
			this.statusEl.innerHTML = sourceLevel ? status : '';

		// Close the submenu
		if (evt.target.name) // Only when an input is hit
			this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * GPX file loader control
 */
//TODO dont work
export class Load extends MyButton {
	constructor(options) {
		super({
			label: '&#x1F4C2;',
			submenuHTML: '<p>Importer un fichier de points ou de traces</p>' +
				'<input type="file" accept=".gpx,.kml,.geojson" />',
			...options ||= {},
		});

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el => {
				el.onchange ||= evt => this.onChange(evt);
			});

		// Load file at init
		if (options.initFile) {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', options.initFile);
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4 && xhr.status == 200)
					this.loadText(xhr.responseText, 'GPX');
			};
			xhr.send();
		}

		this.reader = new FileReader();
	}

	onChange(evt) {
		if (evt.target.files) {
			this.reader.readAsText(evt.target.files[0]);

			this.reader.onload = () => {
				this.loadText(
					this.reader.result,
					evt.target.files[0].name.split('.').pop().toUpperCase()
				);
			};
		}
	}

	loadText(text, formatName) {
		const map = this.getMap(),
			loadFormat = new ol.format[formatName in ol.format ? formatName : 'GeoJSON'](),
			receivedLat = text.match(/lat="-?([0-9]+)/), // Received projection depending on the first value
			receivedProjection = receivedLat && receivedLat.length && parseInt(receivedLat[1]) > 100 ? 'EPSG:3857' : 'EPSG:4326',
			features = loadFormat.readFeatures(text, {
				dataProjection: receivedProjection,
				featureProjection: 'EPSG:3857', // Map projection
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn Editor that we uploaded some features
				features: features,
			});

		if (added !== false) { // If none used the feature
			// Display the track on the map
			const gpxSource = new ol.source.Vector({
					format: loadFormat,
					features: features,
				}),
				gpxLayer = new ol.layer.Vector({
					source: gpxSource,
					style: function(feature) {
						const properties = feature.getProperties();

						return new ol.style.Style({
							stroke: new ol.style.Stroke({
								color: 'blue',
								width: 3,
							}),
							image: properties.sym ? new ol.style.Icon({
								//TODO compléter chemineur avec les symboles standards
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
							}) : null,
						});
					},
				});

			map.addLayer(gpxLayer);

			// Zoom the map on the added features
			const fileExtent = gpxSource.getExtent();

			if (ol.extent.isEmpty(fileExtent))
				alert('Ce fichier ne comporte pas de points ni de trace');
			else
				map.getView().fit(
					fileExtent, {
						maxZoom: 17,
						padding: [5, 5, 5, 5],
					});
		}

		// Close the submenu
		this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * File downloader control
 */
//TODO dont work
//BEST BUG incompatible with clusters
export class Download extends MyButton {
	constructor(opt) {
		const options = {
			label: '&#x1f4e5;',
			className: 'myol-button-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a mime="application/gpx+xml">GPX</a>' +
				'<a mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature
			...opt,
		};

		super(options);

		this.hiddenEl = document.createElement('a');
		this.hiddenEl.target = '_self';
		this.hiddenEl.style = 'display:none';
		document.body.appendChild(this.hiddenEl);

		// Register action listeners
		this.element.querySelectorAll('a')
			.forEach(el => {
				el.onclick = evt => this.onClick(evt);
			});
	}

	onClick(evt) {
		const map = this.getMap(),
			formatName = evt.target.innerText,
			downloadFormat = new ol.format[formatName](),
			mime = evt.target.getAttribute('mime');
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (this.options.savedLayer)
			getFeatures(this.options.savedLayer);
		else
			map.getLayers().forEach(getFeatures);

		function getFeatures(savedLayer) {
			if (savedLayer.getSource() &&
				savedLayer.getSource().forEachFeatureInExtent) // For vector layers only
				savedLayer.getSource().forEachFeatureInExtent(extent, feature => {
					if (!savedLayer.getProperties().dragable) // Don't save the cursor
						features.push(feature);
				});
		}

		if (formatName == 'GPX')
			// Transform *Polygons in linestrings
			for (let f in features) {
				const geometry = features[f].getGeometry();

				if (geometry.getType().includes('Polygon')) {
					geometry.getCoordinates().forEach(coords => {
						if (typeof coords[0][0] == 'number')
							// Polygon
							features.push(new Feature(new LineString(coords)));
						else
							// MultiPolygon
							coords.forEach(subCoords =>
								features.push(new Feature(new LineString(subCoords)))
							);
					});
				}
			}

		const data = downloadFormat.writeFeatures(features, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
				decimals: 5,
			})
			// Beautify the output
			.replace(/<[a-z]*>(0|null|[\[object Object\]|[NTZa:-]*)<\/[a-z]*>/g, '')
			.replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
			.replace(/<Data name="copy"><value>[a-z_\.]*<\/value><\/Data>|,"copy":"[a-z_\.]*"/g, '')
			.replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
			.replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
			.replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
			.replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1')
			.replace(/ [cvx]/g, '\n\t$1'),

			file = new Blob([data], {
				type: mime,
			});

		this.hiddenEl.download = this.options.fileName + '.' + formatName.toLowerCase();
		this.hiddenEl.href = URL.createObjectURL(file);
		this.hiddenEl.click();

		// Close the submenu
		this.element.classList.remove('myol-display-submenu');
	}
}

/**
 * Print control
 */
export class Print extends MyButton {
	constructor(options) {
		super({
			label: '&#x1F5A8;',
			className: 'myol-button-print',
			submenuHTML: '<p>Pour imprimer la carte:</p>' +
				'<p>-Choisir portrait ou paysage,</p>' +
				'<p>-zoomer et déplacer la carte dans le format,</p>' +
				'<p>-imprimer.</p>' +
				'<label><input type="radio" value="0">Portrait A4</label>' +
				'<label><input type="radio" value="1">Paysage A4</label>' +
				'<a id="print">Imprimer</a>' +
				'<a onclick="location.reload()">Annuler</a>',
			...options,
		});

		// Register action listeners
		this.element.querySelectorAll('input,a')
			.forEach(el => {
				el.onclick ||= evt => this.onClick(evt);
			});

		// To return without print
		document.addEventListener('keydown', function(evt) {
			if (evt.key == 'Escape')
				setTimeout(function() { // Delay reload for FF & Opera
					location.reload();
				});
		});
	}

	onClick(evt) {
		const map = this.getMap(),
			mapEl = map.getTargetElement(),
			poElcs = this.element.querySelectorAll('input:checked'), // Selected orientation inputs
			orientation = poElcs.length ? parseInt(poElcs[0].value) : 0; // Selected orientation or portrait

		// Change map size & style
		mapEl.style.maxHeight = mapEl.style.maxWidth =
			mapEl.style.float = 'none';
		mapEl.style.width = orientation == 0 ? '208mm' : '295mm';
		mapEl.style.height = orientation == 0 ? '295mm' : '208mm';
		map.setSize([mapEl.clientWidth, mapEl.clientHeight]);

		// Set style portrait / landscape
		const styleSheet = document.createElement('style');
		styleSheet.type = 'text/css';
		styleSheet.innerText = '@page {size: ' + (orientation == 0 ? 'portrait' : 'landscape') + '}';
		document.head.appendChild(styleSheet);

		// Hide all but the map
		document.body.appendChild(mapEl);
		for (let child = document.body.firstElementChild; child !== null; child = child.nextSibling)
			if (child.style && child !== mapEl)
				child.style.display = 'none';

		// Finer zoom not dependent on the baselayer's levels
		map.getView().setConstrainResolution(false);
		map.addInteraction(new ol.interaction.MouseWheelZoom({
			maxDelta: 0.1,
		}));

		// Finally print if required
		if (evt.target.id == 'print')
			map.once('rendercomplete', () => {
				window.print();
				location.reload();
			});
	}
}

/**
 * Help control
 * Display help contained in <TAG id="<options.submenuId>">
 */
export class Help extends MyButton {
	constructor(options) {
		super({
			label: '?',
			submenuId: 'myol-help',
			...options,
		});
	}
}

/**
 * Control to display the length & height difference of an hovered line
 */
export class LengthLine extends MyButton {
	constructor() {
		super(); //HACK button not visible

		this.element.className = 'myol-length-line';
	}

	setMap(map) {
		super.setMap(map);

		map.on('pointermove', evt => {
			this.element.innerHTML = ''; // Clear the measure if hover no feature

			// Find new features to hover
			map.forEachFeatureAtPixel(
				evt.pixel,
				feature => this.calculateLength(feature), {
					hitTolerance: 6, // Default is 0
				});
		});
	}

	//BEST calculate distance to the ends
	calculateLength(feature) {
		if (feature) {
			let geometry = feature.getGeometry(),
				length = ol.sphere.getLength(geometry),
				fcs = this.getFlatCoordinates(geometry),
				denivPos = 0,
				denivNeg = 0;

			// Height difference calculation
			for (let c = 5; c < fcs.length; c += 3) {
				const d = fcs[c] - fcs[c - 3];

				if (d > 0)
					denivPos += d;
				else
					denivNeg -= d;
			}

			// Display
			if (length) {
				this.element.innerHTML =
					// Line length
					length < 1000 ?
					(Math.round(length)) + ' m' :
					(Math.round(length / 10) / 100) + ' km' +
					// Height difference
					(denivPos ? ' +' + denivPos + ' m' : '') +
					(denivNeg ? ' -' + denivNeg + ' m' : '');

				return false; // Continue detection (for editor that has temporary layers)
			}
		}
	}

	getFlatCoordinates(geometry) {
		let fcs = [];

		if (geometry.stride == 3)
			fcs = geometry.flatCoordinates;

		if (geometry.getType() == 'GeometryCollection')
			for (let g of geometry.getGeometries())
				fcs.push(...this.getFlatCoordinates(g));

		return fcs;
	}
}

/**
 * Control to display the mouse position
 */
export class MyMousePosition extends ol.control.MousePosition {
	constructor(options) {
		super({
			projection: 'EPSG:4326',
			className: 'myol-coordinate',
			placeholder: String.fromCharCode(0), // Hide control when mouse is out of the map

			coordinateFormat: function(mouse) {
				//BEST find better than window.gpsValues to share info
				if (window.gpsValues && window.gpsValues.position) {
					const ll4326 = ol.proj.transform(window.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
						distance = ol.sphere.getDistance(mouse, ll4326);

					return distance < 1000 ?
						(Math.round(distance)) + ' m' :
						(Math.round(distance / 10) / 100) + ' km';
				} else
					return ol.coordinate.createStringXY(4)(mouse);
			},
			...options,
		});
	}
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
export class Permalink extends MyButton {
	constructor(opt) {
		const options = {
				//BEST init with bbox option
				init: true, // {true | false} use url hash or localStorage to position the map.
				setUrl: false, // {true | false} Change url hash when moving the map.
				display: false, // {true | false} Display permalink link the map.
				hash: '?', // {?, #} the permalink delimiter after the url
				...opt,
			},
			aEl = document.createElement('a'),
			urlMod = location.href.replace( // Get value from params with priority url / ? / #
				/map=([0-9\.]+)\/(-?[0-9\.]+)\/(-?[0-9\.]+)/, // map=<zoom>/<lon>/<lat>
				'zoom=$1&lon=$2&lat=$3' // zoom=<zoom>&lon=<lon>&lat=<lat>
			) +
			// Last values
			'zoom=' + localStorage.myol_zoom +
			'lon=' + localStorage.myol_lon +
			'lat=' + localStorage.myol_lat +
			// Default
			'zoom=6&lon=2&lat=47';

		super({
			element: document.createElement('div'),
			render: render,
		});

		if (options.display) {
			this.element.className = 'myol-permalink';
			aEl.innerHTML = 'Permalink';
			aEl.title = 'Generate a link with map zoom & position';
			this.element.appendChild(aEl);
		}

		function render(evt) { //HACK to get map object
			const view = evt.map.getView();

			// Set center & zoom at the init
			if (options.init) {
				options.init = false; // Only once

				view.setZoom(urlMod.match(/zoom=([0-9\.]+)/)[1]);

				view.setCenter(ol.proj.transform([
					urlMod.match(/lon=(-?[0-9\.]+)/)[1],
					urlMod.match(/lat=(-?[0-9\.]+)/)[1],
				], 'EPSG:4326', 'EPSG:3857'));
			}

			// Set the permalink with current map zoom & position
			if (view.getCenter()) {
				const ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
					newParams = 'map=' +
					(localStorage.myol_zoom = Math.round(view.getZoom() * 10) / 10) + '/' +
					(localStorage.myol_lon = Math.round(ll4326[0] * 10000) / 10000) + '/' +
					(localStorage.myol_lat = Math.round(ll4326[1] * 10000) / 10000);

				if (options.display)
					aEl.href = options.hash + newParams;

				if (options.setUrl)
					location.href = '#' + newParams;
			}
		}
	}
}

/**
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */
//TODO TEST
//TODO class
export function tilesBuffer(opt) {
	const options = {
			depth: 3,
			...opt,
		},
		control = new MyButton(); //HACK no button

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		// Action on each layer
		//BEST too much load on basic browsing
		map.on('precompose', () => {
			map.getLayers().forEach(layer => {
				if (typeof layer.setPreload == 'function')
					layer.setPreload(options.depth);
			});
		});
	};

	return control;
}

/**
 * Controls examples
 */
export function collection(opt) {
	const options = {
		supplementaryControls: [], //BEST resorb
		...opt,
	};

	return [
		// Top left
		new ol.control.Zoom(options.zoom),
		new ol.control.FullScreen(options.fullScreen),
		new MyGeocoder(options.geocoder),
		new MyGeolocation(options.geolocation),
		new Load(options.load),
		new Download(options.download),
		new Print(options.print),
		new Help(options.help),

		// Bottom left
		new LengthLine(options.lengthLine),
		new MyMousePosition(options.myMouseposition),
		new ol.control.ScaleLine(options.scaleLine),

		// Bottom right
		new Permalink(options.permalink),
		new ol.control.Attribution(options.attribution),

		...options.supplementaryControls
	];
}