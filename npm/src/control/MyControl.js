/**
 * Controls.js
 * Add some usefull controls without buttons
 */

import ol from '../../src/ol';
import './MyControl.css';
import * as base from './MyBaseControl.js';
import MyGeocoder from './MyGeocoder';

/**
 * Control button
 * Abstract class to be used by other control buttons definitions
 */
export class MyButton extends base.MyBaseControl {
	constructor(options) {
		// MyButton options
		// className : to be added to the control.element
		// label : one unicode character to decorate the button
		// subMenuId : id of an existing html containing the scrolling menu 
		// subMenuHTML : html code of the scrolling menu 
		super(options);

		// Add submenu below the button
		if (this.options.subMenuId)
			this.subMenuEl = document.getElementById(this.options.subMenuId);
		else {
			this.subMenuEl = document.createElement('div');
			if (this.options.subMenuHTML)
				this.subMenuEl.innerHTML = this.options.subMenuHTML;
		}

		// Display the button only if there are no label or submenu
		if (this.options.label && this.subMenuEl && this.subMenuEl.innerHTML) {
			// Create a button
			const buttonEl = document.createElement('button');
			buttonEl.setAttribute('type', 'button');
			buttonEl.innerHTML = this.options.label;
			buttonEl.addEventListener('click', evt => this.buttonAction(evt));

			// Populate the control
			this.element.className = 'ol-control myol-button' + (this.options.className ? ' ' + this.options.className : '');
			this.element.appendChild(buttonEl); // Add the button
			this.element.appendChild(this.subMenuEl); // Add the submenu
			this.element.addEventListener('mouseover', evt => this.buttonAction(evt));
			this.element.addEventListener('mouseout', evt => this.buttonAction(evt));

			// Close the submenu when click or touch on the map
			document.addEventListener('click', evt => {
				const el = document.elementFromPoint(evt.x, evt.y);

				if (el && el.tagName == 'CANVAS')
					this.element.classList.remove('myol-button-selected');
			});
		}
	}

	buttonAction(evt) {
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
export default MyButton;

/**
 * Geolocation control
 * Display status, altitude & speed
 */
//BEST separate file with import / export
export class MyGeolocation extends MyButton {
	constructor(options) {
		const subMenu = location.href.match(/(https|localhost)/) ?
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
			// MyButton options
			className: 'myol-button-gps',
			label: '&#8853;',
			subMenuHTML: subMenu,
			//TODO subMenuId: 'myol-gps',

			// ol.Geolocation options
			// https://www.w3.org/TR/geolocation/#position_options_interface
			enableHighAccuracy: true,
			maximumAge: 1000,
			timeout: 1000,

			...options,
		});

		// Add status display element
		this.statusEl = document.createElement('p');
		this.element.appendChild(this.statusEl);

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el => {
				el.addEventListener('change', evt => this.action(evt));
			});

		// Graticule
		this.graticuleFeature = new ol.Feature(); //BEST Use layer Graticule
		this.northGraticuleFeature = new ol.Feature();

		this.graticuleLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [this.graticuleFeature, this.northGraticuleFeature],
			}),
			zIndex: 300, // Above the features
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
			this.action(evt);
		});
	}

	setMap(map) {
		super.setMap(map);

		map.addLayer(this.graticuleLayer);
		map.on('moveend', evt => this.action(evt)); // Refresh graticule after map zoom

		this.geolocation = new ol.Geolocation({
			projection: map.getView().getProjection(),
			trackingOptions: this.options,
			...this.options,
		});
		this.geolocation.on('change', evt => this.action(evt));
		this.geolocation.on('error', error => {
			console.log('Geolocation error: ' + error.message);
		});
	}

	action(evt) {
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
export class Load extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '&#128194;',
			subMenuHTML: '<p>Importer un fichier de points ou de traces</p>' +
				'<input type="file" accept=".gpx,.kml,.geojson" />',

			// Load options
			// initFileUrl, url of a gpx file to be uploaded at the init

			...options ||= {}, //HACK default when options is undefined
		});

		// Register action listeners
		this.element.querySelectorAll('input')
			.forEach(el => {
				el.addEventListener('change', evt => this.action(evt));
			});

		// Load file at init
		if (options.initFileUrl) {
			const xhr = new XMLHttpRequest();
			xhr.open('GET', options.initFileUrl);
			xhr.onreadystatechange = () => {
				if (xhr.readyState == 4 && xhr.status == 200)
					this.loadText(xhr.responseText, 'GPX');
			};
			xhr.send();
		}

		this.reader = new FileReader();
	}

	action(evt) {
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
					style: feature => {
						const properties = feature.getProperties();

						return new ol.style.Style({
							stroke: new ol.style.Stroke({
								color: 'blue',
								width: 2,
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
//BEST BUG incompatible with clusters
export class Download extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '&#128229;',
			subMenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a mime="application/gpx+xml">GPX</a>' +
				'<a mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature

			...options,
		});

		this.hiddenEl = document.createElement('a');
		this.hiddenEl.target = '_self';
		this.hiddenEl.style = 'display:none';
		document.body.appendChild(this.hiddenEl);

		// Register action listeners
		this.element.querySelectorAll('a')
			.forEach(el => {
				el.addEventListener('click', evt => this.action(evt));
			});
	}

	action(evt) {
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
			map.getLayers().forEach(getFeatures); //BEST what about (args)

		function getFeatures(savedLayer) { //BEST put in method
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
							features.push(new ol.Feature(new ol.geom.LineString(coords)));
						else
							// MultiPolygon
							coords.forEach(subCoords =>
								features.push(new ol.Feature(new ol.geom.LineString(subCoords)))
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
			.replace(/<[a-z]*>(0|null|[[object Object]|[NTZa:-]*)<\/[a-z]*>/g, '')
			.replace(/<Data name="[a-z_]*"\/>|<Data name="[a-z_]*"><\/Data>|,"[a-z_]*":""/g, '')
			.replace(/<Data name="copy"><value>[a-z_.]*<\/value><\/Data>|,"copy":"[a-z_.]*"/g, '')
			.replace(/(<\/gpx|<\/?wpt|<\/?trk>|<\/?rte>|<\/kml|<\/?Document)/g, '\n$1')
			.replace(/(<\/?Placemark|POINT|LINESTRING|POLYGON|<Point|"[a-z_]*":|})/g, '\n$1')
			.replace(/(<name|<ele|<sym|<link|<type|<rtept|<\/?trkseg|<\/?ExtendedData)/g, '\n\t$1')
			.replace(/(<trkpt|<Data|<LineString|<\/?Polygon|<Style)/g, '\n\t\t$1')
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1')
			.replace(/ ([cvx])/g, '\n\t$1'),

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
			// MyButton options
			label: '&#128424;',
			className: 'myol-button-print',
			subMenuHTML: '<p>Pour imprimer la carte:</p>' +
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
				el.addEventListener('click', evt => this.action(evt));
			});

		// To return without print
		document.addEventListener('keydown', evt => {
			if (evt.key == 'Escape')
				setTimeout(() => { // Delay reload for FF & Opera
					location.reload();
				});
		});
	}

	action(evt) {
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
 * Display help contained in <TAG id="<options.subMenuId>">
 */
export class Help extends MyButton {
	constructor(options) {
		super({
			// MyButton options
			label: '?',
			subMenuId: 'myol-help',

			...options,
		});
	}
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

		// Bottom left
		new base.LengthLine(options.lengthLine),
		new base.MyMousePosition(options.myMouseposition),
		new ol.control.ScaleLine(options.scaleLine),

		// Bottom right
		new base.Permalink(options.permalink),
		new ol.control.Attribution(options.attribution),

		...options.supplementaryControls,
	];
}