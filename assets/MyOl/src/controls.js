/**
 * Add some usefull controls
 * Need to include controls.css
 */

/**
 * Control button
 * Abstract definition to be used by other control buttons definitions
 */
//BEST left aligned buttons when screen vertical
function controlButton(opt) {
	const options = Object.assign({
			element: document.createElement('div'),
			buttonBackgroundColors: ['white', 'white'], // Also define the button states numbers
			className: 'ol-button',
			activate: function() {}, // Call back when the button is clicked. Argument = satus number (0, 1, ...)
		}, opt),
		control = new ol.control.Control(options),
		buttonEl = document.createElement('button');

	// Populate control & button
	control.element.className = 'ol-control ' + options.className;
	if (options.label)
		buttonEl.innerHTML = options.label;
	if (options.label !== null)
		control.element.appendChild(buttonEl);

	// Assign button actions
	control.element.addEventListener('mouseover', function() {
		control.element.classList.add('ol-display-submenu');
	});
	control.element.addEventListener('mouseout', function() {
		control.element.classList.remove('ol-display-submenu');
	});
	control.element.addEventListener('touchend', function(evt) {
		if (control.element.isEqualNode(evt.target.parentElement))
			control.element.classList.toggle('ol-display-submenu');
	});

	// Add submenu below the button
	control.submenuEl = options.submenuEl || document.createElement('div');
	control.element.appendChild(control.submenuEl);
	if (options.submenuHTML)
		control.submenuEl.innerHTML = options.submenuHTML;

	// Assign control.function to submenu elements events with attribute onChange="function" or onClickOrTouch="function"
	for (let el of control.submenuEl.getElementsByTagName('*')) {
		const action = el.getAttribute('onChange') || el.getAttribute('onClickOrTouch');

		if (action)
			el.onclick = el.ontouch = el.onchange =
			function(evt) {
				// Check it at execution time to have control[action] defined
				if (typeof control[action] == 'function')
					control[action](evt);
			};
	}

	return control;
}

/**
 * Permalink control
 * "map" url hash or localStorage: zoom=<ZOOM> lon=<LON> lat=<LAT>
 * Don't set view when you declare the map
 */
function controlPermalink(opt) {
	const options = Object.assign({
			init: true, // {true | false} use url hash or localStorage to position the map.
			setUrl: false, // {true | false} Change url hash when moving the map.
			display: false, // {true | false} Display permalink link the map.
			hash: '?', // {?, #} the permalink delimiter after the url
		}, opt),
		control = new ol.control.Control({
			element: document.createElement('div'),
			render: render,
		}),
		aEl = document.createElement('a'),
		// Get best value for all params
		urlMod =
		// From the url ? or #
		location.href.replace(
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
		control.element.className = 'ol-permalink';
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
		buttonEl = geocoder.element.firstElementChild.firstElementChild;

	// Move the button at the same level than the other control's buttons
	buttonEl.innerHTML = '&#128269;';
	geocoder.element.appendChild(buttonEl);

	// Allow open on hover
	geocoder.element.addEventListener('pointerover', function(evt) {
		if (evt.pointerType == 'mouse')
			geocoder.element.firstElementChild.classList.add('gcd-gl-expanded');
	});
	geocoder.element.addEventListener('pointerout', function(evt) {
		if (evt.pointerType == 'mouse')
			geocoder.element.firstElementChild.classList.remove('gcd-gl-expanded');
	});

	return geocoder;
}

/**
 * GPS control
 * Requires controlButton
 */
function controlGPS() {
	const subMenu = location.href.match(/(https|localhost)/) ?
		'<p>Localisation GPS:</p>' +
		'<input type="radio" name="ol-gps" id="ol-gps0" value="0" checked="checked"' +
		' onChange="changeOptions" />' +
		'<label for="ol-gps0">Inactif</label><br />' +
		'<input type="radio" name="ol-gps" id="ol-gps1" value="2" onChange="changeOptions" />' +
		'<label for="ol-gps1">Suivre la position GPS</label><br />' +
		'<input type="radio" name="ol-gps" id="ol-gps2" value="1" onChange="changeOptions" />' +
		'<label for="ol-gps2">Suivre la position WiFi (1)</label><br />' +
		'<input type="checkbox" name="ol-follow" value="1" onChange="changeOptions" />' +
		'<label for="ol-follow">Centrer la carte</label><br />' +
		'<input type="checkbox" name="ol-rotate" value="1" onChange="changeOptions" />' +
		'<label for="ol-rotate">Orienter la carte</label>' +
		'<p>(1) peut être plus rapide et plus précise en intérieur.</p>' :
		// Si on est en http
		'<p>L\'utilisation du GPS nécéssite de passer en https: <a href="' +
		document.location.href.replace('http:', 'https:') +
		'">OK<a> ?</p>',

		// Display status, altitude & speed
		control = controlButton({
			className: 'ol-button ol-button-gps',
			label: '&#8853;', // x2295
			submenuHTML: '<div id="ol-gps-status" class="ol-display-under"></div>' + subMenu,
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
		}),
		displayEl = document.createElement('div');

	let view, geolocation, nbLoc, position, heading, accuracy, altitude, speed;

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
			heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
			renderGPS();
		});

		geolocation.on('error', function(error) {
			console.log('Geolocation error: ' + error.message);
		});
	};

	control.changeOptions = function() {
		// Tune geolocation
		geolocation.setTracking(getState());
		graticuleLayer.setVisible(getState());
		nbLoc = 0;
		ol.gpsPosition = null;
		if (view && !getState())
			view.setRotation(0, 0); // Reset north to top

		// Close the submenu
		control.element.classList.remove('ol-display-submenu');

		renderGPS();
	};

	function renderGPS() {
		// Recheck follow & rotate at state 0
		if (!getState())
			document.getElementsByName('ol-follow')[0].checked =
			document.getElementsByName('ol-rotate')[0].checked = true;

		// Don't rotate if map don't follow
		if (!getState('follow'))
			document.getElementsByName('ol-rotate')[0].checked = false;

		// Render position & graticule
		if (getState() && position &&
			(altitude !== undefined || getState() == 2) // Position on GPS signal only on state 1
		) {
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

			if (getState('follow')) {
				// Center the map
				view.setCenter(position);

				if (!++nbLoc) // Only the first time after activation
					view.setZoom(17); // Zoom on the area
			}

			// Orientation
			if (getState('rotate'))
				view.setRotation(
					heading ?
					Math.PI / 180 * (heading - screen.orientation.angle) // Delivered ° reverse clockwize
					:
					0);

			// For other controls usage
			ol.gpsPosition = position;
		}

		// Display data under the button
		let status = 'GPS sync...';

		if (altitude)
			status = Math.round(altitude) + ' m';
		if (!isNaN(speed))
			status += ' ' + speed + ' km/h';

		elStatus = document.getElementById('ol-gps-status');
		if (elStatus)
			elStatus.innerHTML = getState() ? status : '';
	}

	function getState(name) {
		const options = document.getElementsByName('ol-' + (name || 'gps'));

		for (let o = 0; o < options.length; o++)
			if (options[o].checked) {
				return parseInt(options[o].value);
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
	const control = controlButton(Object.assign({
			label: '&#128194;',
			submenuHTML: '<p>Importer un fichier au format GPX:</p>' +
				'<input type="file" accept=".gpx" onChange="loadFile" />',
		}, options)),
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
		control.element.classList.remove('ol-display-submenu');
	};

	return control;
}

/**
 * File downloader control
 * Requires controlButton
 */
function controlDownload(opt) {
	const options = Object.assign({
			label: '&#128229;',
			buttonBackgroundColors: ['white'],
			className: 'ol-button ol-download',
			submenuHTML: '<p>Cliquer sur un format ci-dessous pour obtenir un fichier ' +
				'contenant les éléments visibles dans la fenêtre:</p>' +
				'<p><a onChange="download" id="GPX" mime="application/gpx+xml">GPX</a></p>' +
				'<p><a onChange="download" id="KML" mime="vnd.google-earth.kml+xml">KML</a></p>' +
				'<p><a onChange="download" id="GeoJSON" mime="application/json">GeoJSON</a></p>',
			fileName: document.title || 'openlayers', //BEST name from feature
		}, opt),
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
		control.element.classList.remove('ol-display-submenu');
	};

	return control;
}

/**
 * Print control
 * Requires controlButton
 */
function controlPrint() {
	const control = controlButton({
		label: '&#128424;',
		className: 'ol-button ol-print',
		submenuHTML: '<p>Imprimer la carte:</p>' +
			'<p>-portrait ou paysage,</p>' +
			'<p>-zoomer et déplacer,</p>' +
			'<p>-imprimer.</p>' +
			'<input type="radio" name="print-orientation" id="ol-po0" value="0" onChange="resizeDraftPrint" />' +
			'<label for="ol-po0">Portrait A4</label><br />' +
			'<input type="radio" name="print-orientation" id="ol-po1" value="1" onChange="resizeDraftPrint" />' +
			'<label for="ol-po1">Paysage A4</label>' +
			'<p><a onClickOrTouch="printMap">Imprimer</a></p>' +
			'<p><a onclick="location.reload()">Annuler</a></p>',
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

	control.printMap = function() {
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