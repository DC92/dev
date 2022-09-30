/**
 * Add some usefull controls
 * Need to include controls.css
 */

/**
 * Control button
 * Abstract definition to be used by other control buttons definitions
 */
function controlButton(opt) {
	const options = {
			element: document.createElement('div'),
			className: '',
			...opt
		},
		control = new ol.control.Control(options),
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

	// Display the button only if there are label & submenu
	if (!options.label || !control.submenuEl || !control.submenuEl.innerHTML)
		return control;

	// Populate control & button
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

	// Close submenu when click or touch somewhere else
	document.addEventListener('click', function(evt) {
		if (document.elementFromPoint(evt.x, evt.y).tagName == 'CANVAS')
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
function controlMousePosition(options) {
	return new ol.control.MousePosition({
		projection: 'EPSG:4326',
		className: 'myol-coordinate',
		undefinedHTML: String.fromCharCode(0), //HACK hide control when mouse is out of the map

		coordinateFormat: function(mouse) {
			//BEST find better than ol.gpsValues to share info
			if (ol.gpsValues && ol.gpsValues.position) {
				const ll4326 = ol.proj.transform(ol.gpsValues.position, 'EPSG:3857', 'EPSG:4326'),
					distance = ol.sphere.getDistance(mouse, ll4326);

				return distance < 1000 ?
					(Math.round(distance)) + ' m' :
					(Math.round(distance / 10) / 100) + ' km';
			} else
				return ol.coordinate.createStringXY(4)(mouse);
		},
		...options
	});
}

/**
 * Control to display the length of an hovered line
 * option hoverStyle style the hovered feature
 */
function controlLengthLine() {
	const control = controlButton(); //HACK button not visible

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
function controlTilesBuffer(opt) {
	const options = {
			depth: 3,
			...opt
		},
		control = controlButton(); //HACK no button

	control.setMap = function(map) { //HACK execute actions on Map init
		ol.control.Control.prototype.setMap.call(this, map);

		// Action on each layer
		//BEST too much load on basic browsing
		map.on('precompose', function() {
			map.getLayers().forEach(function(layer) {
				if (typeof layer.setPreload == 'function')
					layer.setPreload(options.depth);
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
	if (typeof Geocoder != 'function') // Vérify if geocoder is available
		return controlButton(); //HACK no button

	const geocoder = new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'fr-FR',
			autoComplete: false, // Else keep list of many others
			keepOpen: true, // Else bug "no internet"
			placeholder: 'Recherche par nom sur la carte', // Initialization of the input field
			...options
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
	//BEST stay open on click on the button
	if (controlEl) {
		geocoder.element.addEventListener('pointerover', function(evt) {
			if (evt.pointerType == 'mouse')
				controlEl.classList.add('gcd-gl-expanded');

			// Close other opened buttons
			for (let el of document.getElementsByClassName('myol-button-selected'))
				el.classList.remove('myol-button-selected');
		});
		geocoder.element.addEventListener('pointerout', function(evt) {
			if (evt.pointerType == 'mouse')
				controlEl.classList.remove('gcd-gl-expanded');
		});
	}

	return geocoder;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//BEST export / import names and links
//BEST Chemineur symbols in MyOl => translation sym (export symbols GPS ?)
//BEST misc formats
function controlLoadGPX(options) {
	const control = controlButton({
		label: '&#x1F4C2;',
		submenuHTML: '<p>Importer un fichier au format GPX:</p>' +
			'<input type="file" accept=".gpx" ctrlOnChange="loadFile" />',
		...options
	});

	control.loadURL = async function(evt) {
		const xhr = new XMLHttpRequest();
		xhr.open('GET', evt.target.href);
		xhr.onreadystatechange = function() {
			if (xhr.readyState == 4 && xhr.status == 200)
				loadText(xhr.responseText);
		};
		xhr.send();
	};

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
			format = new ol.format.GPX(),
			features = format.readFeatures(text, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload', // Warn layerEditGeoJson that we uploaded some features
				features: features,
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const gpxSource = new ol.source.Vector({
					format: format,
					features: features,
				}),
				gpxLayer = new ol.layer.Vector({
					source: gpxSource,
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
			map.addLayer(gpxLayer);
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
	}

	return control;
}

/**
 * File downloader control
 * Requires controlButton
 */
//BEST BUG incompatible with clusters
function controlDownload(opt) {
	const options = {
			label: '&#x1f4e5;',
			className: 'myol-button-download',
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

		function getFeatures(savedLayer) {
			if (savedLayer.getSource() && savedLayer.getSource().forEachFeatureInExtent) // For vector layers only
				savedLayer.getSource().forEachFeatureInExtent(extent, function(feature) {
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
							)
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
 * Print control
 * Requires controlButton
 */
function controlPrint(options) {
	const control = controlButton({
		label: '&#x1F5A8;',
		className: 'myol-button-print',
		submenuHTML: '<p>Pour imprimer la carte:</p>' +
			'<p>-Choisir portrait ou paysage,</p>' +
			'<p>-zoomer et déplacer la carte dans le format,</p>' +
			'<p>-imprimer.</p>' +
			'<label for="myol-po0">' +
			'<input type="radio" name="myol-po" id="myol-po0" value="0" ctrlonchange="resizeDraftPrint">Portrait A4' +
			'</label>' +
			'<label for="myol-po1">' +
			'<input type="radio" name="myol-po" id="myol-po1" value="1" ctrlonchange="resizeDraftPrint">Paysage A4' +
			'</label>' +
			'<a onclick="printMap()">Imprimer</a>' +
			'<a onclick="location.reload()">Annuler</a>',
		...options
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
 * Help control
 * Requires controlButton
 * Display help contained in <TAG id="<options.submenuId>">
 */
function controlHelp(options) {
	return controlButton({
		label: '?',
		...options
	});
}

/**
 * Controls examples
 */
function controlsCollection(opt) {
	options = {
		supplementaryControls: [],
		...opt
	};

	return [
		// Top left
		new ol.control.Zoom(options.Zoom),
		new ol.control.FullScreen(options.FullScreen),
		controlGeocoder(options.Geocoder),
		controlGPS(options.GPS),
		controlLoadGPX(options.LoadGPX),
		controlDownload(options.Download),
		controlPrint(options.Print),
		controlHelp(options.Help),

		// Bottom left
		controlLengthLine(options.LengthLine),
		controlMousePosition(options.Mouseposition),
		new ol.control.ScaleLine(options.ScaleLine),

		// Bottom right
		controlPermalink(options.Permalink),
		new ol.control.Attribution(options.Attribution),

		...options.supplementaryControls
	];
}