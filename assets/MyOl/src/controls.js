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
		className: 'ol-button',
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
	control.state = 0;

	control.toggle = function(newActive, group) {
		// Toggle by default
		if (newActive === undefined)
			newActive = control.state + 1;

		// Unselect all other controlButtons from the same group
		if (newActive && options.group)
			control.getMap().getControls().forEach(function(c) {
				if (c != control &&
					typeof c.toggle == 'function') // Only for controlButtons
					c.toggle(0, options.group);
			});

		// Execute the requested change
		if (control.state != newActive &&
			(!group || group == options.group)) { // Only for the concerned controls
			control.state = newActive % options.buttonBackgroundColors.length;
			buttonEl.style.backgroundColor = options.buttonBackgroundColors[control.state];
			options.activate(control.state);
		}
	};

	return control;
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
function controlPermalink(options) {
	options = Object.assign({
		init: true, // {true | false} use url hash or localStorage to position the map.
		setUrl: false, // {true | false} Change url hash when moving the map.
		display: false, // {true | false} Display permalink link the map.
		hash: '?', // {?, #} the permalink delimiter after the url
	}, options);
	const aEl = document.createElement('a'),
		control = new ol.control.Control({
			element: document.createElement('div'), //HACK no button
			render: render,
		});

	if (options.display) {
		control.element.className = 'ol-permalink';
		aEl.innerHTML = 'Permalink';
		aEl.title = 'Generate a link with map zoom & position';
		control.element.appendChild(aEl);
	}

	function render(evt) {
		const view = evt.map.getView();

		// Set center & zoom at the init
		if (options.init) {
			options.init = false; // Only once

			view.setZoom(parseFloat(localStorage.myol_zoom) || 6);
			view.setCenter(ol.proj.transform([
				parseFloat(localStorage.myol_lon) || 2,
				parseFloat(localStorage.myol_lat) || 47
			], 'EPSG:4326', 'EPSG:3857'));
		}

		// Set the permalink with current map zoom & position
		if (view.getCenter()) {
			const ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
				newParams = 'zoom=' + Math.round(view.getZoom() * 10) / 10 +
				'&lon=' + Math.round(ll4326[0] * 1000) / 1000 +
				'&lat=' + Math.round(ll4326[1] * 1000) / 1000;

			localStorage.myol_zoom = view.getZoom();
			localStorage.myol_lon = ll4326[0];
			localStorage.myol_lat = ll4326[1];

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
function controlMousePosition() {
	return new ol.control.MousePosition({
		projection: 'EPSG:4326',
		className: 'ol-coordinate',
		undefinedHTML: String.fromCharCode(0), //HACK hide control when mouse is out of the map

		coordinateFormat: function(mouse) {
			if (ol.gpsPosition) {
				const ll4326 = ol.proj.transform(ol.gpsPosition, 'EPSG:3857', 'EPSG:4326'),
					distance = ol.sphere.getDistance(mouse, ll4326);

				return distance < 1000 ?
					(Math.round(distance)) + ' m' :
					(Math.round(distance / 10) / 100) + ' km';
			} else
				return ol.coordinate.createStringXY(4)(mouse);
		},
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

			control.element.innerHTML = length < 1000 ?
				(Math.round(length)) + ' m' :
				(Math.round(length / 10) / 100) + ' km';
		}
		return false; // Continue detection (for editor that has temporary layers)
	}
	return control;
}

/**
 * Control to display set preload of depth upper level tiles
 * This prepares the browser to become offline
 */
function controlTilesBuffer(depth) {
	const control = new ol.control.Control({
		element: document.createElement('div'), //HACK no button
	});

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		// Action on each layer
		//TODO too much load on basic browsing
		map.on('precompose', function() {
			map.getLayers().forEach(function(layer) {
				if (typeof layer.setPreload == 'function')
					layer.setPreload(depth);
			});
		});
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

	if (typeof Geocoder != 'function') // Vérify if geocoder is available
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
	const buttonEl = geocoder.element.firstElementChild.firstElementChild;
	buttonEl.innerHTML = '&#x1F50D;';
	buttonEl.title = options.title;
	geocoder.element.appendChild(buttonEl);

	return geocoder;
}

/**
 * GPS control
 * Requires controlButton
 */
function controlGPS() {
	let view, geolocation, nbLoc, position, heading, accuracy, altitude, speed;

	// Display status, altitude & speed
	const displayEl = document.createElement('div'),

		control = controlButton({
			className: 'ol-button ol-gps',
			label: '&#x2295;',
			buttonBackgroundColors: [ // Define 4 states button
				'white', // 0 : inactive
				'orange', // 1 : waiting physical GPS sensor position & altitude
				'lime', // 2 : active, centered & oriented
				'grey', // 3 : active, do not centered nor oriented
				//BEST No orange wait position when no real GPS captor
			],
			title: 'Centrer sur la position GPS',
			activate: function(state) {
				if (geolocation) {
					geolocation.setTracking(state !== 0);
					graticuleLayer.setVisible(state !== 0);
					nbLoc = 0;
					if (!state && view) {
						view.setRotation(0, 0); // Set north to top
						displayEl.innerHTML = '';
						displayEl.classList.remove('ol-control-gps');
					}
				}
				ol.gpsPosition = null;
			}
		}),

		// Graticule
		graticuleFeature = new ol.Feature(),
		northGraticuleFeature = new ol.Feature(),
		graticuleLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [graticuleFeature, northGraticuleFeature],
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

	control.element.appendChild(displayEl);

	graticuleFeature.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#000',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	northGraticuleFeature.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#c00',
			lineDash: [16, 14],
			width: 1,
		}),
	}));

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		view = map.getView();
		map.addLayer(graticuleLayer);

		geolocation = new ol.Geolocation({
			projection: view.getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 1000,
			},
		});

		// Trigger position
		geolocation.on('change:position', renderPosition);
		map.on('moveend', renderPosition); // Refresh graticule after map zoom
		function renderPosition() {
			position = geolocation.getPosition();
			accuracy = geolocation.getAccuracyGeometry();
			renderGPS();
		}

		// Triggers data display
		geolocation.on(['change:altitude', 'change:speed', 'change:tracking'], function() {
			speed = Math.round(geolocation.getSpeed() * 36) / 10;
			altitude = geolocation.getAltitude();
			renderGPS();
		});

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener('deviceorientationabsolute', function(evt) {
			if (evt.absolute) { // Breaks support for non-absolute browsers, like firefox mobile
				heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
				renderGPS();
			}
		});

		geolocation.on('error', function(error) {
			alert('Geolocation error: ' + error.message);
		});
	};

	function renderGPS() {
		// Display data under the button
		let displays = [];

		if (control.state) {
			if (altitude)
				displays.push(Math.round(altitude) + ' m');

			if (!isNaN(speed))
				displays.push(speed + ' km/h');

			if (altitude === undefined)
				displays = ['GPS sync...'];
			else if (control.state == 1)
				control.toggle(); // Go directly to state 2
		}

		displayEl.innerHTML = displays.join(', ');

		if (displays.length)
			displayEl.classList.add('ol-control-gps');
		else
			displayEl.classList.remove('ol-control-gps');

		// Render position & graticule
		if (control.state && position &&
			(control.state > 1 || altitude !== undefined)) { // Position on GPS signal only on state 1
			const map = control.getMap(),
				// Estimate the viewport size to draw visible graticule
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

			graticuleFeature.setGeometry(new ol.geom.GeometryCollection(geometry));
			northGraticuleFeature.setGeometry(new ol.geom.GeometryCollection(northGeometry));

			// The accuracy circle
			const accuracy = geolocation.getAccuracyGeometry();
			if (accuracy)
				geometry.push(accuracy);

			if (control.state == 2) {
				// Center the map
				view.setCenter(position);

				if (!nbLoc) { // Only the first time after activation
					view.setZoom(17); // Zoom on the area

					map.dispatchEvent({
						type: 'myol:ongpsactivate',
					});
				}

				nbLoc++;

				// Orientation
				if (heading)
					view.setRotation(
						Math.PI / 180 * (heading - screen.orientation.angle), // Delivered ° reverse clockwize
						0
					);
			}

			// For other controls usage
			ol.gpsPosition = position;
		}
	}

	return control;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//BEST export / import names and links
//BEST Chemineur dans MyOl => Traduction sym (symbole export GPS ?)
//BEST misc formats
function controlLoadGPX(options) {
	options = Object.assign({
		label: '&#x1F4C2;',
		title: 'Visualiser un fichier GPX sur la carte',
		activate: function() {
			inputEl.click();
		},
	}, options);

	const inputEl = document.createElement('input'),
		format = new ol.format.GPX(),
		reader = new FileReader(),
		control = controlButton(options);

	inputEl.type = 'file';
	inputEl.addEventListener('change', function() {
		if (inputEl.files)
			reader.readAsText(inputEl.files[0]);
	});

	reader.onload = function() {
		const map = control.getMap(),
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
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + properties.sym + '.svg',
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
		if (ol.extent.isEmpty(extent))
			alert('Fichier GPX vide');
		else
			map.getView().fit(extent, {
				maxZoom: 17,
				size: map.getSize(),
				padding: [5, 5, 5, 5],
			});
	};
	return control;
}

/**
 * File downloader control
 * Requires controlButton
 */
function controlDownload(options) {
	options = Object.assign({
		label: '&#x1F4E5;',
		buttonBackgroundColors: ['white'],
		className: 'ol-button ol-download',
		title: 'Cliquer sur un format ci-dessous\n' +
			'pour obtenir un fichier contenant\n' +
			'les éléments visibles dans la fenêtre.\n' +
			'(la liste peut être incomplète pour les grandes zones)',
		question: '<span/>', // Invisible but generates a questionEl <div>
		fileName: document.title || 'openlayers',
		activate: download,
	}, options);

	const hiddenEl = document.createElement('a'),
		control = controlButton(options);
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
		control.questionEl.appendChild(el);
	}

	function download() { //formatName, mime
		const formatName = this.textContent || 'GPX', //BEST get first value as default
			mime = this.id,
			format = new ol.format[formatName](),
			map = control.getMap();
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
					if (!layer.marker_) //BEST find a better way to don't save the cursor
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

		hiddenEl.download = options.fileName + '.' + formatName.toLowerCase();
		hiddenEl.href = URL.createObjectURL(file);
		hiddenEl.click();
	}
	return control;
}

/**
 * Print control
 * Requires controlButton
 */
function controlPrint() {
	const control = controlButton({
		className: 'ol-button ol-print',
		title: 'Pour imprimer la carte:\n' +
			'choisir l‘orientation,\n' +
			'zoomer et déplacer,\n' +
			'cliquer sur l‘icône imprimante.',
		question: '<input type="radio" name="print-orientation" id="ol-po0" value="0" />' +
			'<label for="ol-po0">Portrait A4</label><br />' +
			'<input type="radio" name="print-orientation" id="ol-po1" value="1" />' +
			'<label for="ol-po1">Paysage A4</label>',
		activate: function() {
			resizeDraft(control.getMap());
			control.getMap().once('rendercomplete', function() {
				window.print();
				location.reload();
			});
		},
	});

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		const poEls = document.getElementsByName('print-orientation');

		for (let i in poEls)
			poEls[i].onchange = resizeDraft;
	};

	function resizeDraft() {
		const map = control.getMap(),
			mapEl = map.getTargetElement(),
			poElcs = document.querySelectorAll('input[name=print-orientation]:checked'),
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
		map.addInteraction(new ol.interaction.MouseWheelZoom({
			maxDelta: 0.1,
		}));

		// To return without print
		document.addEventListener('keydown', function(evt) {
			if (evt.key == 'Escape')
				setTimeout(function() { // Delay reload for FF & Opera
					location.reload();
				});
		});
	}

	return control;
}

/**
 * Controls examples
 */
function controlsCollection(options) {
	options = options || {};

	return [
		// Top left
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		controlGeocoder(),
		controlGPS(options.controlGPS),
		controlLoadGPX(),
		controlDownload(options.controlDownload),
		controlPrint(),

		// Bottom left
		controlLengthLine(),
		controlMousePosition(),
		new ol.control.ScaleLine(),

		// Bottom right
		controlPermalink(options.permalink),
		new ol.control.Attribution(),
	];
}