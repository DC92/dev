/**
 * Add some usefull controls
 * Need to include controls.css
 */

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
function controlPermalink(opt) {
	const options = {
			init: true, // {true | false} use url hash or localStorage to position the map.
			setUrl: false, // {true | false} Change url hash when moving the map.
			display: false, // {true | false} Display permalink link the map.
			hash: '?', // {?, #} the permalink delimiter after the url
			...opt
		},
		control = new ol.control.Control({
			element: document.createElement('div'),
			render: render,
		}),
		aEl = document.createElement('a'),
		urlMod = location.href.replace( // Get value from params with priority url / ? / #
			/map=([0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/, // map=<zoom>/<lon>/<lat>
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

			view.setCenter(ol.proj.transform([
				urlMod.match(/lon=([-0-9\.]+)/)[1],
				urlMod.match(/lat=([-0-9\.]+)/)[1],
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
	return control;
}

/**
 * Control to display the mouse position
 */
function controlMousePosition() {
	return new ol.control.MousePosition({
		projection: 'EPSG:4326',
		className: 'myol-coordinate',
		undefinedHTML: String.fromCharCode(0), //HACK hide control when mouse is out of the map

		coordinateFormat: function(mouse) {
			if (ol.gpsValues && ol.gpsValues.position) {
				const ll4326 = ol.proj.transform(ol.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
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
	control.element.className = 'myol-length-line';

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

			if (length) {
				control.element.innerHTML =
					length < 1000 ?
					(Math.round(length)) + ' m' :
					(Math.round(length / 10) / 100) + ' km';

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
function controlGeocoder() {
	if (typeof Geocoder != 'function') // Vérify if geocoder is available
		return new ol.control.Control({
			element: document.createElement('div'), //HACK no button
		});

	const geocoder = new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'fr-FR',
			autoComplete: false, // Else keep list of many others
			keepOpen: true, // Else bug "no internet"
			placeholder: 'Recherche par nom sur la carte', // Initialization of the input field
		}),
		controlEl = geocoder.element.firstElementChild,
		buttonEl = controlEl ? controlEl.firstElementChild : null;

	// Move the button at the same level than the other control's buttons
	if (buttonEl) {
		buttonEl.innerHTML = '&#x1F50D;';
		geocoder.element.appendChild(buttonEl);
		geocoder.element.classList.add('ol-control');
	}

	// Allow open on hover
	if (controlEl) {
		geocoder.element.addEventListener('pointerover', function(evt) {
			if (evt.pointerType == 'mouse')
				controlEl.classList.add('gcd-gl-expanded');
		});
		geocoder.element.addEventListener('pointerout', function(evt) {
			if (evt.pointerType == 'mouse')
				controlEl.classList.remove('gcd-gl-expanded');
		});
	}

	return geocoder;
}

/**
 * Control button
 * Abstract definition to be used by other control buttons definitions
 */
//BEST left aligned buttons when screen vertical
function controlButton(opt) {
	const options = {
			element: document.createElement('div'),
			className: 'myol-button',
			...opt
		},
		control = new ol.control.Control(options),
		buttonEl = document.createElement('button');

	// Neutral: not displayed
	if (!options.label)
		return control;

	// Populate control & button
	control.element.className = 'ol-control ' + options.className;
	buttonEl.innerHTML = options.label;
	control.element.appendChild(buttonEl);

	// Assign button actions
	control.element.addEventListener('mouseover', function() {
		control.element.classList.add('myol-display-submenu');
	});
	control.element.addEventListener('mouseout', function() {
		control.element.classList.remove('myol-display-submenu');
	});
	control.element.addEventListener('touchend', function(evt) {
		if (control.element.isEqualNode(evt.target.parentElement))
			control.element.classList.toggle('myol-display-submenu');
	});

	// Add submenu below the button
	if (options.submenuEl)
		control.submenuEl = options.submenuEl;
	else {
		control.submenuEl = document.createElement('div');
		if (options.submenuHTML)
			control.submenuEl.innerHTML = options.submenuHTML;
	}
	control.element.appendChild(control.submenuEl);

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
				};
		});

	return control;
}

/**
 * GPS control
 * Requires controlButton
 */
function controlGPS() {
	const subMenu = location.href.match(/(https|localhost)/) ?
		'<p>Localisation GPS:</p>' +
		'<input type="radio" name="myol-gps-source" id="myol-gps-source0" value="0" ctrlOnChange="renderGPS" checked="checked" />' +
		'<label for="myol-gps-source0">Inactif</label><br />' +
		'<input type="radio" name="myol-gps-source" id="myol-gps-source1" value="1" ctrlOnChange="renderGPS" />' +
		'<label for="myol-gps-source1">Position GPS <span>(1) extérieur</span></label><br />' +
		'<input type="radio" name="myol-gps-source" id="myol-gps-source2" value="2" ctrlOnChange="renderGPS" />' +
		'<label for="myol-gps-source2">Position GPS ou IP <span>(2) intérieur</span></label><hr />' +

		'<input type="radio" name="myol-gps-display" id="myol-gps-display0" value="0" ctrlOnChange="renderGPS" checked="checked" />' +
		'<label for="myol-gps-display0">Carte libre</label><br />' +
		'<input type="radio" name="myol-gps-display" id="myol-gps-display1" value="1" ctrlOnChange="renderGPS" />' +
		'<label for="myol-gps-display1">Centre la carte, nord en haut</label><br />' +
		'<input type="radio" name="myol-gps-display" id="myol-gps-display2" value="2" ctrlOnChange="renderGPS" />' +
		'<label for="myol-gps-display2">Centre et oriente la carte <span>(3)</span></label><hr />' +

		'<p>(1) plus précis en extérieur mais plus lent à initialiser, ' +
		'nécessite un capteur et une réception GPS.</p>' +
		'<p>(2) plus précis et rapide en intérieur ou en zone urbaine ' +
		'mais peut être très erroné en extérieur à l&apos;initialisation. ' +
		'Utilise les position des points WiFi proches en plus du GPS dont il peut se passer.</p>' +
		'<p>(3) nécessite un capteur magnétique et un explorateur le supportant.' +
		'</p>' :
		// Si on est en http
		'<p>L&apos;utilisation du GPS nécessite https</p>' +
		'<a href="' + document.location.href.replace('http:', 'https:') + '">Passer en https<a>',

		// Display status, altitude & speed
		control = controlButton({
			className: 'myol-button myol-button-gps',
			label: '&#x2295;',
			submenuHTML: '<div id="myol-gps-status" class="myol-display-under"></div>' + subMenu,
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

	let geolocation;
	ol.gpsValues = {}; // Store the measures for internal use & other controls

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		map.addLayer(graticuleLayer);
		map.on('moveend', control.renderGPS); // Refresh graticule after map zoom

		geolocation = new ol.Geolocation({
			projection: map.getView().getProjection(),
			trackingOptions: {
				enableHighAccuracy: true,
				maximumAge: 1000,
				timeout: 1000,
			},
		});
		geolocation.on('change', control.renderGPS);
		geolocation.on('error', function(error) {
			console.log('Geolocation error: ' + error.message);
		});

		// Browser heading from the inertial & magnetic sensors
		window.addEventListener('deviceorientationabsolute', function(evt) {
			ol.gpsValues.heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
			control.renderGPS(evt);
		});
	};

	control.renderGPS = function(evt) {
		const sourceLevelEl = document.querySelector('input[name="myol-gps-source"]:checked'),
			displayLevelEl = document.querySelector('input[name="myol-gps-display"]:checked'),
			display0El = document.getElementById('myol-gps-display0'),
			display2El = document.getElementById('myol-gps-display2'),
			sourceLevel = sourceLevelEl ? parseInt(sourceLevelEl.value) : 0, // On/off, GPS, +|WiFi
			displayLevel = displayLevelEl ? parseInt(displayLevelEl.value) : 0, // Graticule & sourceLevel
			statusEl = document.getElementById('myol-gps-status'),
			map = control.getMap(),
			view = map ? map.getView() : null;

		// Tune the tracking level
		if (evt.target.name == 'myol-gps-source') {
			geolocation.setTracking(sourceLevel > 0);
			graticuleLayer.setVisible(sourceLevel > 0);
			ol.gpsValues = {}; // Reset the values
			if (!sourceLevel && display0El)
				display0El.checked = true;
			if (sourceLevel && displayLevel == 0 && display2El)
				display2El.checked = true;
		}

		// Get geolocation values
		['Position', 'AccuracyGeometry', 'Speed', 'Altitude'].forEach(valueName => {
			const value = geolocation['get' + valueName]();
			if (value)
				ol.gpsValues[valueName.toLowerCase()] = value;
		});

		// L'état 1 ne prend que les positions du GPS (qui ont une altitude)
		if (sourceLevel == 1 && !ol.gpsValues.altitude)
			ol.gpsValues.position = null;

		// Render position & graticule
		if (map && view && sourceLevel && ol.gpsValues.position) {
			// Estimate the viewport size to draw visible graticule
			const p = ol.gpsValues.position,
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
			if (ol.gpsValues.accuracygeometry)
				geometry.push(ol.gpsValues.accuracygeometry);

			graticuleFeature.setGeometry(new ol.geom.GeometryCollection(geometry));
			northGraticuleFeature.setGeometry(new ol.geom.GeometryCollection(northGeometry));

			// Center the map
			if (displayLevel > 0)
				view.setCenter(p);

			// Orientation
			if (!sourceLevel || displayLevel == 1)
				view.setRotation(0);
			else if (ol.gpsValues.heading && displayLevel == 2)
				view.setRotation(
					Math.PI / 180 * (ol.gpsValues.heading - screen.orientation.angle) // Delivered ° reverse clockwize
				);

			// Zoom on the area
			if (!ol.gpsValues.isZoomed) { // Only the first time after activation
				ol.gpsValues.isZoomed = true;
				view.setZoom(17);
			}
		}

		// Display data under the button
		let status = ol.gpsValues.position ? '' : 'GPS sync...';
		if (ol.gpsValues.altitude)
			status = Math.round(ol.gpsValues.altitude) + ' m';
		if (ol.gpsValues.speed)
			status += ' ' + (Math.round(ol.gpsValues.speed * 36) / 10) + ' km/h';
		if (statusEl)
			statusEl.innerHTML = sourceLevel ? status : '';

		// Close the submenu
		if (evt.target.name) // Only when an input is hit
			control.element.classList.remove('myol-display-submenu');
	};

	return control;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//BEST export / import names and links
//BEST Chemineur dans MyOl => Traduction sym (symbole export GPS ?)
//BEST misc formats
function controlLoadGPX(opt) {
	const options = {
			label: '&#x1F4C2;',
			submenuHTML: '<p>Importer un fichier au format GPX:</p>' +
				'<input type="file" accept=".gpx" ctrlOnChange="loadFile" />',
			...opt
		},
		control = controlButton(options),
		reader = new FileReader(),
		format = new ol.format.GPX();

	control.loadFile = function(evt) {
		if (evt.type == 'change' && evt.target.files)
			reader.readAsText(evt.target.files[0]);
	};

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
									width: 3,
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

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	};

	return control;
}

/**
 * File downloader control
 * Requires controlButton
 */
//TODO incompatible avec clusters
//TODO BUG n'exporte pas les polygones !
function controlDownload(opt) {
	const options = {
			label: '&#x1f4e5;',
			className: 'myol-button myol-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<a ctrlOnClick="download" id="GPX" mime="application/gpx+xml">GPX</a>' +
				'<a ctrlOnClick="download" id="KML" mime="vnd.google-earth.kml+xml">KML</a>' +
				'<a ctrlOnClick="download" id="GeoJSON" mime="application/json">GeoJSON</a>',
			fileName: document.title || 'openlayers', //BEST name from feature
			...opt
		},
		control = controlButton(options),
		hiddenEl = document.createElement('a');

	hiddenEl.target = '_self';
	hiddenEl.style = 'display:none';
	document.body.appendChild(hiddenEl);

	control.download = function(evt) {
		const formatName = evt.target.id,
			mime = evt.target.getAttribute('mime'),
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

		// Close the submenu
		control.element.classList.remove('myol-display-submenu');
	};

	return control;
}

/**
 * Print control
 * Requires controlButton
 */
function controlPrint() {
	const control = controlButton({
		label: '&#x1F5A8;',
		className: 'myol-button',
		submenuHTML: '<p>Pour imprimer la carte:</p>' +
			'<p>-Choisir portrait ou paysage,</p>' +
			'<p>-zoomer et déplacer la carte dans le format,</p>' +
			'<p>-imprimer.</p>' +
			'<input type="radio" name="print-orientation" id="myol-po0" value="0" ctrlOnChange="resizeDraftPrint" />' +
			'<label for="myol-po0">Portrait A4</label><br />' +
			'<input type="radio" name="print-orientation" id="myol-po1" value="1" ctrlOnChange="resizeDraftPrint" />' +
			'<label for="myol-po1">Paysage A4</label>' +
			'<a onclick="printMap()">Imprimer</a>' +
			'<a onclick="location.reload()">Annuler</a>',
	});

	control.resizeDraftPrint = function() {
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
	};

	printMap = function() {
		control.resizeDraftPrint();
		control.getMap().once('rendercomplete', function() {
			window.print();
			location.reload();
		});
	};

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
		controlButton(), // Neutral: not displayed
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