/**
 * Add some usefull controls
 * Need to include controls.css
 */

/**
 * Control button
 * Abstract definition to be used by other control buttons definitions
 */
//BEST left aligned buttons when screen vertical
function controlButton(options) {
	options = Object.assign({
		element: document.createElement('div'),
		buttonBackgroundColors: ['white', 'white'], // Also define the button states numbers
		className: 'myol-button',
		activate: function() {}, // Call back when the button is clicked. Argument = satus number (0, 1, ...)
	}, options);

	const control = new ol.control.Control(options),
		buttonEl = document.createElement('button');

	control.element.className = 'ol-button ol-unselectable ol-control ' + options.className;
	control.element.title = options.title; // {string} displayed when the control is hovered.
	if (options.label)
		buttonEl.innerHTML = options.label;
	if (options.label !== null)
		control.element.appendChild(buttonEl);

	buttonEl.addEventListener('click', function(evt) {
		evt.preventDefault();
		control.toggle();
	});

	// Add selectors below the button
	if (options.question) {
		control.questionEl = document.createElement('div');
		control.questionEl.innerHTML = options.question;
		control.questionEl.className = 'ol-control-hidden';

		control.element.appendChild(control.questionEl);
		control.element.onmouseover = function() {
			control.questionEl.className = 'ol-control-question';
		};
		control.element.onmouseout = function() {
			control.questionEl.className = 'ol-control-hidden';
		};
	}

	// Toggle the button status & aspect
	control.active = 0;
	control.toggle = function(newActive, group) {
		// Toggle by default
		if (typeof newActive == 'undefined')
			newActive = (control.active + 1);

		// Unselect all other controlButtons from the same group
		if (newActive && options.group)
			control.getMap().getControls().forEach(function(c) {
				if (c != control &&
					typeof c.toggle == 'function') // Only for controlButtons
					c.toggle(0, options.group);
			});

		// Execute the requested change
		if (control.active != newActive &&
			(!group || group == options.group)) { // Only for the concerned controls
			control.active = newActive % options.buttonBackgroundColors.length;
			buttonEl.style.backgroundColor = options.buttonBackgroundColors[control.active];
			options.activate(control.active);
		}
	};
	return control;
}

/**
 * No control
 * Can be added to controls:[] but don't display it
 * Requires controlButton
 */
function noControl() {
	return new ol.control.Control({
		element: document.createElement('div'),
	});
}

/**
 * Permalink control
 * "map" url hash or cookie = {map=<ZOOM>/<LON>/<LAT>/<LAYER>}
 * Don't set view when you declare the map
 */
function controlPermalink(options) {
	options = Object.assign({
		init: true, // {true | false} use url hash or "controlPermalink" cookie to position the map.
		setUrl: false, // Change url hash to position the map.
		display: false, // Display link the map.
		hash: '?', // {?, #} the permalink delimiter
	}, options);
	const aEl = document.createElement('a'),
		control = new ol.control.Control({
			element: document.createElement('div'), //HACK no button
			render: render,
		}),
		zoomMatch = location.href.match(/zoom=([0-9]+)/),
		latLonMatch = location.href.match(/lat=([-0-9\.]+)&lon=([-.0-9]+)/);
	let params = (
			';map=' + options.forced + // Forced
			location.href + // Priority to ?map=6/2/47 or #map=6/2/47
			(zoomMatch && latLonMatch ? // Old format ?zoom=6&lat=47&lon=5
				';map=' + zoomMatch[1] + '/' + latLonMatch[2] + '/' + latLonMatch[1] :
				'') +
			document.cookie + // Then the cookie
			';map=' + options.mapDefault + // Optional default
			';map=6/2/47') // General default
		.match(/map=([0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/); // map=<ZOOM>/<LON>/<LAT>

	if (options.display) {
		control.element.className = 'ol-permalink';
		aEl.innerHTML = 'Permalink';
		aEl.title = 'Generate a link with map zoom & position';
		control.element.appendChild(aEl);
	}

	if (typeof options.initialCenter == 'function') {
		options.initialCenter([parseFloat(params[2]), parseFloat(params[3])]);
	}

	function render(evt) {
		const view = evt.map.getView();

		// Set center & zoom at the init
		if (options.init &&
			params) { // Only once
			view.setZoom(params[1]);
			view.setCenter(ol.proj.transform([parseFloat(params[2]), parseFloat(params[3])], 'EPSG:4326', 'EPSG:3857'));
			params = null;
		}

		// Set the permalink with current map zoom & position
		if (view.getCenter()) {
			const ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
				newParams = [
					parseInt(view.getZoom()), // Zoom
					Math.round(ll4326[0] * 100000) / 100000, // Lon
					Math.round(ll4326[1] * 100000) / 100000, // Lat
				];

			if (options.display)
				aEl.href = options.hash + 'map=' + newParams.join('/');
			if (options.setUrl)
				location.href = '#map=' + newParams.join('/');
			document.cookie = 'map=' + newParams.join('/') + ';path=/; SameSite=Strict';
		}
	}
	return control;
}

/**
 * Control to display the mouse position
 */
function controlMousePosition() {
	return new ol.control.MousePosition({
		coordinateFormat: ol.coordinate.createStringXY(5),
		projection: 'EPSG:4326',
		className: 'ol-coordinate',
		undefinedHTML: String.fromCharCode(0), //HACK hide control when mouse is out of the map
	});
}

/**
 * Control to display the length of an hovered line
 * option hoverStyle style the hovered feature
 */
function controlLengthLine() {
	const control = new ol.control.Control({
		element: document.createElement('div'), // div to display the measure
	});
	control.element.className = 'ol-length-line';

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		map.on('pointermove', function(evt) {
			control.element.innerHTML = ''; // Clear the measure if hover no feature

			// Find new features to hover
			map.forEachFeatureAtPixel(evt.pixel, calculateLength, {
				hitTolerance: 6, // Default is 0
			});
		});
	};

	//BEST calculate distance to the ends
	function calculateLength(feature) {
		// Display the line length
		if (feature) {
			const length = ol.sphere.getLength(feature.getGeometry());
			if (length >= 100000)
				control.element.innerHTML = (Math.round(length / 1000)) + ' km';
			else if (length >= 10000)
				control.element.innerHTML = (Math.round(length / 100) / 10) + ' km';
			else if (length >= 1000)
				control.element.innerHTML = (Math.round(length / 10) / 100) + ' km';
			else if (length >= 1)
				control.element.innerHTML = (Math.round(length)) + ' m';
		}
		return false; // Continue detection (for editor that has temporary layers)
	}
	return control;
}

/**
 * Control to display set preload of depth upper level tiles or depthFS if we are on full screen mode
 * This prepares the browser to become offline on the same session
 */
function controlTilesBuffer(depth, depthFS) {
	const control = new ol.control.Control({
		element: document.createElement('div'), //HACK no button
	});

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		// Change preload when the window expand to fullscreen
		map.on('precompose', function() {
			map.getLayers().forEach(function(layer) {
				const fs = document.webkitIsFullScreen || // Edge, Opera
					document.msFullscreenElement ||
					document.fullscreenElement; // Chrome, FF, Opera

				if (typeof layer.setPreload == 'function')
					layer.setPreload(fs ? depthFS || depth || 1 : depth || 1);
			});
		});
	};

	return control;
}

/**
 * Full window polyfill for non full screen browsers (iOS)
 */
function controlFullScreen(options) {
	let pseudoFullScreen = !(
		document.body.webkitRequestFullscreen || // What is tested by ol.control.FullScreen
		(document.body.msRequestFullscreen && document.msFullscreenEnabled) ||
		(document.body.requestFullscreen && document.fullscreenEnabled)
	);

	// Force the control button display if no full screen is supported
	if (pseudoFullScreen) {
		document.body.msRequestFullscreen = true; // What is tested by ol.control.FullScreen
		document.msFullscreenEnabled = true;
	}

	// Call the former control constructor
	const control = new ol.control.FullScreen(Object.assign({
		label: '', //HACK Bad presentation on IE & FF
		tipLabel: 'Plein écran',
	}, options));

	// Add some tricks when the map is known !
	control.setMap = function(map) {
		ol.control.FullScreen.prototype.setMap.call(this, map);

		const el = map.getTargetElement();
		if (pseudoFullScreen) {
			el.requestFullscreen = toggle; // What is called first by ol.control.FullScreen
			document.exitFullscreen = toggle;
		} else {
			document.addEventListener('webkitfullscreenchange', toggle, false); // Edge, Safari
			document.addEventListener('MSFullscreenChange', toggle, false); // I.E.
		}

		function toggle() {
			if (pseudoFullScreen) // Toggle the simulated isFullScreen & the control button
				document.webkitIsFullScreen = !document.webkitIsFullScreen;
			const isFullScreen = document.webkitIsFullScreen ||
				document.fullscreenElement ||
				document.msFullscreenElement;
			el.classList[isFullScreen ? 'add' : 'remove']('ol-pseudo-fullscreen');
			//BEST IE : Warning : L’objet ne gère pas la propriété ou la méthode « handleFullScreenChange_ »
			control.handleFullScreenChange_(); // Change the button class & resize the map
		}
	};
	return control;
}

/**
 * Geocoder
 * Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
 */
function controlGeocoder(options) {
	options = Object.assign({
		title: 'Recherche sur la carte',
	}, options);

	if (typeof Geocoder != 'function' || // Vérify if geocoder is available
		document.documentMode) // Not supported in I.E.
		return new ol.control.Control({
			element: document.createElement('div'), //HACK no button
		});

	const geocoder = new Geocoder('nominatim', {
		provider: 'osm',
		lang: 'fr-FR',
		autoComplete: false, // Else keep list of many others
		keepOpen: true, // Else bug "no internet"
		placeholder: options.title, // Initialization of the input field
	});

	// Move the button at the same level than the other control's buttons
	geocoder.container.firstElementChild.firstElementChild.title = options.title;
	geocoder.container.appendChild(geocoder.container.firstElementChild.firstElementChild);

	return geocoder;
}

/**
 * GPS control
 * Requires controlButton
 */
function controlGPS() {
	let view, geolocation, nbLoc, position, altitude;

	//Button
	const button = controlButton({
		className: 'myol-button ol-gps',
		buttonBackgroundColors: ['white', '#ef3', '#bbb'], // Define 3 states button
		title: 'Centrer sur la position GPS',
		activate: function(active) {
			geolocation.setTracking(active !== 0);
			graticuleLayer.setVisible(active !== 0);
			nbLoc = 0;
			if (!active) {
				view.setRotation(0, 0); // Set north to top
				displayEl.innerHTML = '';
				displayEl.classList.remove('ol-control-gps');
			}
		}
	});

	// Display status, altitude & speed
	const displayEl = document.createElement('div');
	button.element.appendChild(displayEl);

	function displayValues() {
		const displays = [],
			speed = Math.round(geolocation.getSpeed() * 36) / 10;

		if (button.active) {
			altitude = geolocation.getAltitude();
			if (altitude) {
				displays.push(Math.round(altitude) + ' m');
				if (!isNaN(speed))
					displays.push(speed + ' km/h');
				//BEST GPS average inertial counter to get better speed
			} else
				displays.push('GPS sync...');
			//TODO GPS position initiale quand PC fixe ?
		}
		displayEl.innerHTML = displays.join(', ');
		if (displays.length)
			displayEl.classList.add('ol-control-gps');
		else
			displayEl.classList.remove('ol-control-gps');
	}

	// Graticule
	const graticule = new ol.Feature(),
		northGraticule = new ol.Feature(),
		graticuleLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [graticule, northGraticule]
			}),
			style: new ol.style.Style({
				fill: new ol.style.Fill({
					color: 'rgba(128,128,255,0.2)'
				}),
				stroke: new ol.style.Stroke({
					color: '#20b',
					lineDash: [16, 14],
					width: 1
				})
			})
		});

	northGraticule.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#c00',
			lineDash: [16, 14],
			width: 1
		})
	}));

	function renderReticule() {
		position = geolocation.getPosition();
		if (button.active && position && altitude) {
			const map = button.getMap(),
				// Estimate the viewport size
				hg = map.getCoordinateFromPixel([0, 0]),
				bd = map.getCoordinateFromPixel(map.getSize()),
				far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10,

				// The graticule
				geometry = [
					new ol.geom.MultiLineString([
						[
							[position[0] - far, position[1]],
							[position[0] + far, position[1]]
						],
						[
							[position[0], position[1]],
							[position[0], position[1] - far]
						],
					]),
				],

				// Color north in red
				northGeometry = [
					new ol.geom.LineString([
						[position[0], position[1]],
						[position[0], position[1] + far]
					]),
				];

			graticule.setGeometry(new ol.geom.GeometryCollection(geometry));
			northGraticule.setGeometry(new ol.geom.GeometryCollection(northGeometry));

			// The accurate circle
			const accuracy = geolocation.getAccuracyGeometry();
			if (accuracy)
				geometry.push(accuracy);

			// Center the map
			if (button.active == 1) {
				view.setCenter(position);

				if (!nbLoc) // Only the first time after activation
					view.setZoom(17); // Zoom on the area
				nbLoc++;
			}
		}
		displayValues();
	}

	button.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		view = map.getView();
		map.addLayer(graticuleLayer);

		geolocation = new ol.Geolocation({
			projection: view.getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
			},
		});

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener(
			'deviceorientationabsolute',
			function(evt) {
				const heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
				if (button.active == 1 &&
					altitude && // Only if true GPS position
					event.absolute) // Breaks support for non-absolute browsers, like firefox mobile
					view.setRotation(
						Math.PI / 180 * (heading - screen.orientation.angle), // Delivered ° reverse clockwize
						0
					);
			}
		);

		map.on('moveend', renderReticule); // Refresh graticule after map zoom
		geolocation.on(['change:altitude', 'change:speed', 'change:tracking'], displayValues);
		geolocation.on('change:position', renderReticule);
		geolocation.on('error', function(error) {
			alert('Geolocation error: ' + error.message);
		});
		//BEST GPS tap on map = distance from GPS calculation
	};

	return button;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//BEST misc formats
function controlLoadGPX(options) {
	options = Object.assign({
		label: '\u25b2',
		title: 'Visualiser un fichier GPX sur la carte',
		activate: function() {
			inputEl.click();
		},
	}, options);

	const inputEl = document.createElement('input'),
		format = new ol.format.GPX(),
		reader = new FileReader(),
		button = controlButton(options);

	inputEl.type = 'file';
	inputEl.addEventListener('change', function() {
		reader.readAsText(inputEl.files[0]);
	});

	reader.onload = function() {
		const map = button.getMap(),
			features = format.readFeatures(reader.result, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn layerEditGeoJson that we uploaded some features
				features: features,
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const source = new ol.source.Vector({
					format: format,
					features: features,
				}),
				layer = new ol.layer.Vector({
					source: source,
					style: function(feature) {
						const properties = feature.getProperties(),
							styleOptions = {
								stroke: new ol.style.Stroke({
									color: 'blue',
									width: 2,
								}),
							};

						if (properties.sym)
							styleOptions.image = new ol.style.Icon({
								//TODO+ voir les ref sym
								//TODO+ chemineur.fr
								src: '//c92.fr/test/chem5/ext/Dominique92/GeoBB/icones/' + properties.sym + '.png',
								imgSize: [24, 24], // IE compatibility //BEST automatic detect
							});

						return new ol.style.Style(styleOptions);
					},
				});
			map.addLayer(layer);
		}

		// Zoom the map on the added features
		const extent = ol.extent.createEmpty();
		for (let f in features)
			ol.extent.extend(extent, features[f].getGeometry().getExtent());
		map.getView().fit(extent, {
			maxZoom: 17,
			size: map.getSize(),
			padding: [5, 5, 5, 5],
		});
	};
	return button;
}

/**
 * File downloader control
 * Requires controlButton
 */
function controlDownload(options) {
	options = Object.assign({
		label: '\u25bc',
		buttonBackgroundColors: ['white'],
		className: 'myol-button ol-download',
		title: 'Cliquer sur un format ci-dessous\n' +
			'pour obtenir un fichier contenant\n' +
			'les éléments visibles dans la fenêtre.\n' +
			'(la liste peut être incomplète pour les grandes zones)',
		question: '<span/>', // Invisible but generates a questionEl <div>
		fileName: document.title || 'openlayers',
		activate: download,
	}, options);

	const hiddenEl = document.createElement('a'),
		button = controlButton(options);
	hiddenEl.target = '_self';
	hiddenEl.style = 'display:none';
	document.body.appendChild(hiddenEl);

	const formats = {
		GPX: 'application/gpx+xml',
		KML: 'vnd.google-earth.kml+xml',
		GeoJSON: 'application/json',
	};
	for (let f in formats) {
		const el = document.createElement('p');
		el.onclick = download;
		el.innerHTML = f;
		el.id = formats[f];
		el.title = 'Obtenir un fichier ' + f;
		button.questionEl.appendChild(el);
	}

	function download() { //formatName, mime
		const formatName = this.textContent || 'GPX', //BEST get first value as default
			mime = this.id,
			format = new ol.format[formatName](),
			map = button.getMap();
		let features = [],
			extent = map.getView().calculateExtent();

		// Get all visible features
		if (options.savedLayer)
			getFeatures(options.savedLayer);
		else
			map.getLayers().forEach(getFeatures);

		function getFeatures(layer) {
			if (layer.getSource() && layer.getSource().forEachFeatureInExtent) // For vector layers only
				layer.getSource().forEachFeatureInExtent(extent, function(feature) {
					if (!layer.marker_) //BEST find a better way to don't save the cursors
						features.push(feature);
				});
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

		if (typeof navigator.msSaveBlob == 'function') // I.E./Edge
			navigator.msSaveBlob(file, options.fileName + '.' + formatName.toLowerCase());
		else {
			hiddenEl.download = options.fileName + '.' + formatName.toLowerCase();
			hiddenEl.href = URL.createObjectURL(file);
			hiddenEl.click();
		}
	}
	return button;
}

/**
 * Print control
 * Requires controlButton
 */
function controlPrint() {
	const button = controlButton({
		className: 'myol-button ol-print',
		title: 'Pour imprimer la carte:\n' +
			'choisir l‘orientation,\n' +
			'zoomer et déplacer,\n' +
			'cliquer sur l‘icône imprimante.',
		question: '<input type="radio" name="print-orientation" value="0" />Portrait A4<br>' +
			'<input type="radio" name="print-orientation" value="1" />Paysage A4',
		activate: function() {
			resizeDraft(button.getMap());
			button.getMap().once('rendercomplete', function() {
				window.print();
				location.reload();
			});
		},
	});

	button.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		const oris = document.getElementsByName('print-orientation');
		for (let i = 0; i < oris.length; i++) // Use « for » because of a bug in Edge / I.E.
			oris[i].onchange = resizeDraft;
	};

	function resizeDraft() {
		// Resize map to the A4 dimensions
		const map = button.getMap(),
			mapEl = map.getTargetElement(),
			oris = document.querySelectorAll("input[name=print-orientation]:checked"),
			orientation = oris.length ? oris[0].value : 0;
		mapEl.style.width = orientation === 0 ? '210mm' : '297mm';
		mapEl.style.height = orientation === 0 ? '290mm' : '209.9mm'; // -.1mm for Chrome landscape no marging bug
		map.setSize([mapEl.offsetWidth, mapEl.offsetHeight]);

		// Hide all but the map
		for (let child = document.body.firstElementChild; child !== null; child = child.nextSibling)
			if (child.style && child !== mapEl)
				child.style.display = 'none';

		// Raises the map to the top level
		document.body.appendChild(mapEl);
		document.body.style.margin = 0;
		document.body.style.padding = 0;

		document.addEventListener('keydown', function(evt) {
			if (evt.key == 'Escape')
				setTimeout(function() {
					window.location.reload();
				});
		});
	}
	return button;
}

/**
 * Controls examples
 */
function controlsCollection(options) {
	options = options || {};

	return [
		// Top left
		new ol.control.Zoom(),
		controlFullScreen(),
		controlGeocoder(),
		controlGPS(options.controlGPS),
		controlLoadGPX(),
		controlDownload(options.controlDownload),
		//controlPrint(), //BEST BUG : don't print full page

		// Bottom left
		controlLengthLine(),
		controlMousePosition(),
		new ol.control.ScaleLine(),

		// Bottom right
		controlPermalink(options.controlPermalink),
		new ol.control.Attribution(),
	];
}