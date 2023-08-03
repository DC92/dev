/**
 * Controls.js
 * Add some usefull controls
 */

// Openlayers
import Attribution from 'ol/control/Attribution';
import Control from 'ol/control/Control';
import FullScreen from 'ol/control/FullScreen';
import MousePosition from 'ol/control/MousePosition';
import MouseWheelZoom from 'ol/interaction/MouseWheelZoom';
import ScaleLine from 'ol/control/ScaleLine';
import Zoom from 'ol/control/Zoom';
import * as coordinate from 'ol/coordinate';
import * as proj from 'ol/proj';
import * as sphere from 'ol/sphere';

// MyOl
import './MyControl.css';
import MyGeocoder from './MyGeocoder';
import MyGeolocation from './MyGeolocation';


/**
 * Control button
 * Abstract definition to be used by other control buttons definitions
 */
//BEST make it a class ... & others
export function myButton(opt) {
	const options = {
			element: document.createElement('div'),
			className: '',
			...opt,
		},
		control = new Control(options),
		buttonEl = document.createElement('button');

	// Add submenu below the button
	if (options.submenuEl)
		control.submenuEl = options.submenuEl;
	else if (options.submenuId)
		control.submenuEl = document.getElementById(options.submenuId);
	else {
		control.submenuEl = document.createElement('div');
		if (options.submenuHTML)
			control.submenuEl.innerHTML = options.submenuHTML;
	}

	// Display the button only if there are no label or submenu
	if (!options.label || !control.submenuEl || !control.submenuEl.innerHTML)
		return control;

	// Populate control & button
	buttonEl.setAttribute('type', 'button');
	buttonEl.innerHTML = options.label;
	control.element.appendChild(buttonEl);
	control.element.className = 'ol-control myol-button ' + options.className;

	// Add submenu
	control.element.appendChild(control.submenuEl);

	// Assign button actions
	control.element.addEventListener('mouseover', action);
	control.element.addEventListener('mouseout', action);
	buttonEl.addEventListener('click', action);

	function action(evt) {
		if (evt.type == 'mouseover')
			control.element.classList.add('myol-button-hover');
		else // mouseout | click
			control.element.classList.remove('myol-button-hover');

		if (evt.type == 'click') // Mouse click & touch
			control.element.classList.toggle('myol-button-selected');

		// Close other open buttons
		for (let el of document.getElementsByClassName('myol-button'))
			if (el != control.element)
				el.classList.remove('myol-button-selected');
	}

	// Close submenu when click or touch on the map
	document.addEventListener('click', evt => {
		const hoveredEl = document.elementFromPoint(evt.x, evt.y);

		if (hoveredEl && hoveredEl.tagName == 'CANVAS')
			control.element.classList.remove('myol-button-selected');
	});

	// Assign control.function to submenu elements events
	// with attribute ctrlOnClic="function" or ctrlOnChange="function"
	for (let el of control.submenuEl.getElementsByTagName('*'))
		['OnClick', 'OnChange'].forEach(evtName => {
			const evtFnc = el.getAttribute('ctrl' + evtName);
			if (evtFnc)
				el[evtName.toLowerCase()] = function(evt) {
					// Check at execution time if control.function() is defined
					//BEST Functions declared within loops referencing an outer scoped variable may lead to confusing semantics.
					if (typeof control[evtFnc] == 'function')
						control[evtFnc](evt);

					return false; // Don't continue on href
				};
		});

	return control;
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
export function permalink(opt) {
	const options = {
			//BEST init with bbox option
			init: true, // {true | false} use url hash or localStorage to position the map.
			setUrl: false, // {true | false} Change url hash when moving the map.
			display: false, // {true | false} Display permalink link the map.
			hash: '?', // {?, #} the permalink delimiter after the url
			...opt,
		},
		control = new Control({
			element: document.createElement('div'),
			render: render,
		}),
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

	if (options.display) {
		control.element.className = 'myol-permalink';
		aEl.innerHTML = 'Permalink';
		aEl.title = 'Generate a link with map zoom & position';
		control.element.appendChild(aEl);
	}

	function render(evt) { //HACK to get map object
		const view = evt.map.getView();

		// Set center & zoom at the init
		if (options.init) {
			options.init = false; // Only once

			view.setZoom(urlMod.match(/zoom=([0-9\.]+)/)[1]);

			view.setCenter(proj.transform([
				urlMod.match(/lon=(-?[0-9\.]+)/)[1],
				urlMod.match(/lat=(-?[0-9\.]+)/)[1],
			], 'EPSG:4326', 'EPSG:3857'));
		}

		// Set the permalink with current map zoom & position
		if (view.getCenter()) {
			const ll4326 = proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
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
	return control;
}

/**
 * Control to display the mouse position
 */
export function mousePosition(options) {
	return new MousePosition({
		projection: 'EPSG:4326',
		className: 'myol-coordinate',
		placeholder: String.fromCharCode(0), // Hide control when mouse is out of the map

		coordinateFormat: function(mouse) {
			//BEST find better than window.gpsValues to share info
			if (window.gpsValues && window.gpsValues.position) {
				const ll4326 = proj.transform(window.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
					distance = sphere.getDistance(mouse, ll4326);

				return distance < 1000 ?
					(Math.round(distance)) + ' m' :
					(Math.round(distance / 10) / 100) + ' km';
			} else
				return coordinate.createStringXY(4)(mouse);
		},
		...options,
	});
}

/**
 * Control to display the length & height difference of an hovered line
 */
export function lengthLine() {
	const control = myButton(); //HACK button not visible

	control.element.className = 'myol-length-line';

	control.setMap = function(map) { //HACK execute actions on Map init
		Control.prototype.setMap.call(this, map);

		map.on('pointermove', evt => {
			control.element.innerHTML = ''; // Clear the measure if hover no feature

			// Find new features to hover
			map.forEachFeatureAtPixel(evt.pixel, calculateLength, {
				hitTolerance: 6, // Default is 0
			});
		});
	};

	function getFlatCoordinates(geometry) {
		let fcs = [];

		if (geometry.stride == 3)
			fcs = geometry.flatCoordinates;

		if (geometry.getType() == 'GeometryCollection')
			for (let g of geometry.getGeometries())
				fcs.push(...getFlatCoordinates(g));

		return fcs;
	}

	//BEST calculate distance to the ends
	function calculateLength(feature) {
		if (feature) {
			let geometry = feature.getGeometry(),
				length = sphere.getLength(geometry),
				fcs = getFlatCoordinates(geometry),
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
				control.element.innerHTML =
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
	return control;
}

/**
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */
export function tilesBuffer(opt) {
	const options = {
			depth: 3,
			...opt,
		},
		control = myButton(); //HACK no button

	control.setMap = function(map) { //HACK execute actions on Map init
		Control.prototype.setMap.call(this, map);

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
 * Print control
 */
export function print(options) {
	const control = myButton({
		label: '&#x1F5A8;',
		className: 'myol-button-print',
		submenuHTML: '<p>Pour imprimer la carte:</p>' +
			'<p>-Choisir portrait ou paysage,</p>' +
			'<p>-zoomer et déplacer la carte dans le format,</p>' +
			'<p>-imprimer.</p>' +
			'<label><input type="radio" name="myol-po" value="0" ctrlonchange="resizeDraftPrint">Portrait A4</label>' +
			'<label><input type="radio" name="myol-po" value="1" ctrlonchange="resizeDraftPrint">Paysage A4</label>' +
			'<a onclick="window.printMap()">Imprimer</a>' +
			'<a onclick="location.reload()">Annuler</a>',
		...options,
	});

	control.resizeDraftPrint = function() {
		const map = control.getMap(),
			mapEl = map.getTargetElement(),
			poElcs = document.querySelectorAll('input[name=myol-po]:checked'),
			orientation = poElcs.length ? parseInt(poElcs[0].value) : 0;

		mapEl.style.maxHeight = mapEl.style.maxWidth =
			mapEl.style.float = 'none';
		mapEl.style.width = orientation == 0 ? '208mm' : '295mm';
		mapEl.style.height = orientation == 0 ? '295mm' : '208mm';
		map.setSize([mapEl.clientWidth, mapEl.clientHeight]);

		// Set portrait / landscape
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
		map.addInteraction(new MouseWheelZoom({
			maxDelta: 0.1,
		}));

		// To return without print
		document.addEventListener('keydown', function(evt) {
			if (evt.key == 'Escape')
				setTimeout(function() { // Delay reload for FF & Opera
					location.reload();
				});
		});
	};

	window.printMap = function() { //BEST resorb window
		control.resizeDraftPrint();
		control.getMap().once('rendercomplete', function() {
			window.print();
			location.reload();
		});
	};

	return control;
}

export function Load(opt) {
	//BEST export / import names and links
	//BEST Chemineur symbols in MyOl => translation sym (export symbols GPS ?)
	//BEST misc formats
	const options = {
			label: '&#x1F4C2;',
			submenuHTML: '<p>Importer un fichier au format GPX:</p>' +
				'<input type="file" accept=".gpx" ctrlOnChange="loadFile" />',
			...opt,
		},
		control = myButton(options);

	control.loadURL = async function(evt) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', evt.target.href);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200)
				loadText(xhr.responseText);
		};
		xhr.send();
	};

	// Load file at init
	if (options.initFile) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', options.initFile);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200)
				loadText(xhr.responseText);
		};
		xhr.send();
	}

	// Load file on demand
	control.loadFile = function(evt) {
		const reader = new FileReader();

		if (evt.type == 'change' && evt.target.files)
			reader.readAsText(evt.target.files[0]);
		reader.onload = function() {
			loadText(reader.result);
		};
	};

	function loadText(text) {
		const map = control.getMap(),
			format = new format.GPX(),
			features = format.readFeatures(text, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn Editor that we uploaded some features
				features: features,
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const gpxSource = new VectorSource({
					format: format,
					features: features,
				}),
				gpxLayer = new VectorLayer({
					source: gpxSource,
					style: function(feature) {
						const properties = feature.getProperties();

						return new style.Style({
							stroke: new style.Stroke({
								color: 'blue',
								width: 3,
							}),
							image: properties.sym ? new Icon({
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
							}) : null,
						});
					},
				});
			map.addLayer(gpxLayer);
		}

		// Zoom the map on the added features
		const extent = olExtent.createEmpty();

		for (let f in features) //BEST try to create a geometry
			olExtent.extend(extent, features[f].getGeometry().getExtent());

		if (olExtent.isEmpty(extent))
			alert('Fichier GPX vide');
		else
			map.getView().fit(
				extent, {
					maxZoom: 17,
					size: map.getSize(), //BEST necessary ?
					padding: [5, 5, 5, 5],
				});

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	}

	return control;
}

/**
 * File downloader control
 */
//BEST BUG incompatible with clusters
export function Download(opt) {
	const options = {
			label: '&#x1f4e5;',
			className: 'myol-button-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a ctrlOnClick="download" id="GPX" mime="application/gpx+xml">GPX</a>' +
				'<a ctrlOnClick="download" id="KML" mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a ctrlOnClick="download" id="GeoJSON" mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature
			...opt,
		},
		control = myButton(options),
		hiddenEl = document.createElement('a');

	hiddenEl.target = '_self';
	hiddenEl.style = 'display:none';
	document.body.appendChild(hiddenEl);

	control.download = function(evt) {
		const formatName = evt.target.id,
			mime = evt.target.getAttribute('mime'),
			format = new olFormat[formatName](),
			map = control.getMap();
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (options.savedLayer)
			getFeatures(options.savedLayer);
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

		const data = format.writeFeatures(features, {
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
			.replace(/(<[a-z]+BoundaryIs)/g, '\n\t\t\t$1'),

			file = new Blob([data], {
				type: mime,
			});

		hiddenEl.download = options.fileName + '.' + formatName.toLowerCase();
		hiddenEl.href = URL.createObjectURL(file);
		hiddenEl.click();

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	};

	return control;
}

/**
 * Help control
 * Display help contained in <TAG id="<options.submenuId>">
 */
//BEST make it a class
export function Help(options) {
	return myButton({
		label: '?',
		...options,
	});
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
		new Zoom(options.Zoom),
		new FullScreen(options.FullScreen),
		new MyGeocoder(options.Geocoder),
		new MyGeolocation(options.Geolocation),
		new Load(options.load),
		new Download(options.download),
		print(options.Print),
		Help(options.Help),

		// Bottom left
		lengthLine(options.LengthLine),
		mousePosition(options.Mouseposition),
		new ScaleLine(options.ScaleLine),

		// Bottom right
		permalink(options.Permalink),
		new Attribution(options.Attribution),

		...options.supplementaryControls
	];
}