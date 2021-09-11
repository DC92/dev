/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 * Based on https://openlayers.org
 *
 * This file has been generated Sat, 11 Sep 2021 13:23:17 +0000
 * by build.php from the src/... sources
 * Please dont modify it : modify src/... & rebuild it !
 */

/* FILE src/header.js */
// I.E. polyfills
// NO MORE : Need to transpile ol.js to ol-ie.js with: https://babeljs.io/repl (TARGETS = default)
// Need polyfill.js generate with https://polyfill.io/v3/url-builder/ includes append promise assign hypot
//BEST include src/polyfill.js with a tag

//HACK for some mobiles touch functions
if (navigator.userAgent.match(/iphone.+safari/i)) {
	const script = document.createElement('script');
	script.src = 'https://unpkg.com/elm-pep';
	document.head.appendChild(script);
}

/**
 * Display OL version
 */
try {
	new ol.style.Icon(); // Try incorrect action
} catch (err) { // to get Assert url
	ol.version = 'Ol ' + err.message.match('/v([0-9\.]+)/')[1];
	console.log(ol.version);
}

/**
 * Debug facilities on mobile
 */
//HACK use hash ## for error alerts
if (!window.location.hash.indexOf('##'))
	window.addEventListener('error', function(evt) {
		alert(evt.filename + ' ' + evt.lineno + ':' + evt.colno + '\n' + evt.message);
	});
//HACK use hash ### to route all console logs on alerts
if (window.location.hash == '###')
	console.log = function(message) {
		alert(message);
	};

//HACK Json parsing errors log
//BEST implement on layerVector.js & editor
function JSONparse(json) {
	try {
		return JSON.parse(json);
	} catch (returnCode) {
		console.log(returnCode + ' parsing : "' + json + '" ' + new Error().stack);
	}
}

//HACK warn layers when added to the map
//BEST DELETE
ol.Map.prototype.handlePostRender = function() {
	ol.PluggableMap.prototype.handlePostRender.call(this);

	const map = this;
	map.getLayers().forEach(function(layer) {
		if (!layer.map_) {
			layer.map_ = map;

			layer.dispatchEvent({
				type: 'myol:onadd',
				map: map,
			});
		}
	});

	// Save the js object into the DOM
	map.getTargetElement()._map = map;
};

/* FILE src/layerTileCollection.js */
/**
 * This module defines many WMTS EPSG:3857 tiles layers
 */

/**
 * Openstreetmap
 */
function layerOsm(url, attribution, maxZoom) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: url,
			maxZoom: maxZoom || 21,
			attributions: [
				attribution || '',
				ol.source.OSM.ATTRIBUTION,
			],
		}),
	});
}

function layerOsmOpenTopo() {
	return layerOsm(
		'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		'<a href="https://opentopomap.org">OpenTopoMap</a> ' +
		'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
		17
	);
}

function layerOsmMri() {
	return layerOsm(
		'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		'<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
	);
}

/**
 * Kompas (Austria)
 * Requires layerOsm
 */
function layerKompass(layer) {
	return layerOsm(
		//TODO BUG sur https://wri -> demande le lien https !
		'http://ec{0-3}.cdn.ecmaps.de/WmsGateway.ashx.jpg?' + // Not available via https
		'Experience=ecmaps&MapStyle=' + layer + '&TileX={x}&TileY={y}&ZoomLevel={z}',
		'<a href="http://www.kompass.de/livemap/">KOMPASS</a>'
	);
}

/**
 * Thunderforest
 * Requires layerOsm
 * var mapKeys.thunderforest = Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
 */
function layerThunderforest(layer) {
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.thunderforest ?
		null :
		layerOsm(
			'//{a-c}.tile.thunderforest.com/' + layer + '/{z}/{x}/{y}.png?apikey=' + mapKeys.thunderforest,
			'<a href="http://www.thunderforest.com">Thunderforest</a>'
		);
}

/**
 * Google
 */
function layerGoogle(layer) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: '//mt{0-3}.google.com/vt/lyrs=' + layer + '&hl=fr&x={x}&y={y}&z={z}',
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',
		})
	});
}
//BEST lien vers GGstreet

/**
 * Stamen http://maps.stamen.com
 */
function layerStamen(layer) {
	return new ol.layer.Tile({
		source: new ol.source.Stamen({
			layer: layer,
		})
	});
}

/**
 * IGN France
 * Doc on http://api.ign.fr
 * var mapKeys.ign = Get your own (free)IGN key at https://professionnels.ign.fr/user fot others than IGN V2 & photo
 */
function layerIGN(layer, format, key) {
	let IGNresolutions = [],
		IGNmatrixIds = [];
	for (let i = 0; i < 18; i++) {
		IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
		IGNmatrixIds[i] = i.toString();
	}
	return (typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.ign) &&
		(typeof key === 'undefined' || !key) ?
		null : // Don't display that one
		new ol.layer.Tile({
			source: new ol.source.WMTS({
				url: '//wxs.ign.fr/' + (key || mapKeys.ign) + '/wmts',
				layer: layer,
				matrixSet: 'PM',
				format: 'image/' + (format || 'jpeg'),
				tileGrid: new ol.tilegrid.WMTS({
					origin: [-20037508, 20037508],
					resolutions: IGNresolutions,
					matrixIds: IGNmatrixIds,
				}),
				style: 'normal',
				attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>',
			})
		});
}

/**
 * Layers with not all resolutions or area available
 * Virtual class
 * Display Stamen outside the layer zoom range or extend
 * Requires myol:onadd
 */
//BEST document all options in options = Object.assign
//BEST ?? use minResolution / maxResolution
function layerTileIncomplete(options) {
	const layer = options.extraLayer || layerStamen('terrain');
	options.sources[999999] = layer.getSource(); // Add extrabound source on the top of the list

	//HACK : Avoid to call the layer initiator if this layer is not required
	if (typeof options.addSources == 'function')
		layer.on('change:opacity', function() {
			if (layer.getOpacity())
				options.sources = Object.assign(
					options.sources,
					options.addSources()
				);
		});

	layer.once('myol:onadd', function(evt) {
		evt.map.on('moveend', change);
		evt.map.getView().on('change:resolution', change);
		change(); // At init
	});

	function change() {
		if (layer.getOpacity()) {
			const view = layer.map_.getView();
			let currentResolution = 999999; // Init loop at max resolution

			// Search for sources according to the map resolution
			if (ol.extent.intersects(options.extent, view.calculateExtent(layer.map_.getSize())))
				currentResolution = Object.keys(options.sources).filter(function(evt) { //HACK : use of filter to perform an action
					return evt > view.getResolution();
				})[0];

			// Update layer if necessary
			if (layer.getSource() != options.sources[currentResolution])
				layer.setSource(options.sources[currentResolution]);
		}
	}

	return layer;
}

/**
 * Swisstopo https://api.geo.admin.ch/
 * Requires layerTileIncomplete
 */
function layerSwissTopo(layer, extraLayer) {
	const projectionExtent = ol.proj.get('EPSG:3857').getExtent();
	let resolutions = [],
		matrixIds = [];
	for (let r = 0; r < 18; ++r) {
		resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}
	return layerTileIncomplete({
		extraLayer: extraLayer,
		extent: [664577, 5753148, 1167741, 6075303], // EPSG:21781 (Swiss CH1903 / LV03)
		sources: {
			500: new ol.source.WMTS(({
				crossOrigin: 'anonymous',
				url: '//wmts2{0-4}.geo.admin.ch/1.0.0/' + layer + '/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: new ol.tilegrid.WMTS({
					origin: ol.extent.getTopLeft(projectionExtent),
					resolutions: resolutions,
					matrixIds: matrixIds,
				}),
				requestEncoding: 'REST',
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>',
			}))
		},
	});
}

/**
 * Spain
 */
function layerSpain(serveur, layer) {
	return layerTileIncomplete({
		//extraLayer: extraLayer,
		extent: [-1036000, 4300000, 482000, 5434000],
		sources: {
			1000: new ol.source.XYZ({
				url: '//www.ign.es/wmts/' + serveur + '?layer=' + layer +
					'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
					'&style=default&tilematrixset=GoogleMapsCompatible' +
					'&TileMatrix={z}&TileCol={x}&TileRow={y}',
				attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',
			})
		},
	});
}

/**
 * Italy IGM
 * Requires layerTileIncomplete
 */
function layerIGM() {
	function igmSource(url, layer) {
		return new ol.source.TileWMS({
			url: 'http://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/' + url + '.map',
			params: {
				layers: layer,
			},
			attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer">IGM</a>',
		});
	}
	return layerTileIncomplete({
		extent: [660124, 4131313, 2113957, 5958411], // EPSG:6875 (Italie)
		sources: {
			100: igmSource('IGM_250000', 'CB.IGM250000'),
			25: igmSource('IGM_100000', 'MB.IGM100000'),
			5: igmSource('IGM_25000', 'CB.IGM25000'),
		},
	});
}

/**
 * Ordnance Survey : Great Britain
 * Requires layerTileIncomplete
 * var mapKeys.bing = Get your own (free) key at http://www.ordnancesurvey.co.uk/business-and-government/products/os-openspace/
 */
function layerOS() {
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.bing ?
		null :
		layerTileIncomplete({
			extent: [-841575, 6439351, 198148, 8589177], // EPSG:27700 (G.B.)
			sources: {},

			addSources: function() {
				return {
					50: new ol.source.BingMaps({
						imagerySet: 'OrdnanceSurvey',
						key: mapKeys.bing,
					})
				};
			},
		});
}

/**
 * Bing (Microsoft)
 * var mapKeys.bing = Get your own (free) key at http://www.ordnancesurvey.co.uk/business-and-government/products/os-openspace/
 */
function layerBing(subLayer) {
	const layer = new ol.layer.Tile();

	//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is required
	layer.on('change:opacity', function() {
		if (layer.getVisible() && !layer.getSource()) {
			layer.setSource(new ol.source.BingMaps({
				imagerySet: subLayer,
				key: mapKeys.bing,
			}));
		}
	});
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.bing ? null : layer;
}

/**
 * Tile layers examples
 */
function layersCollection() {
	return {
		'OpenTopo': layerOsmOpenTopo(),
		'OSM outdoors': layerThunderforest('outdoors'),
		'OSM transport': layerThunderforest('transport'),
		'MRI': layerOsmMri(),
		'OSM fr': layerOsm('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'Photo Google': layerGoogle('s'),
		'IGN TOP25': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS'), // Need an IGN key
		'IGN V2': layerIGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'png', 'pratique'), // 'pratique' is the free layer key
		'Photo IGN': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS', 'jpeg', 'pratique'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Swiss photo': layerSwissTopo('ch.swisstopo.swissimage'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Angleterre': layerOS(),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Espagne photo': layerSpain('pnoa-ma', 'OI.OrthoimageCoverage'),
	};
}

function layersDemo() {
	return Object.assign(layersCollection(), {
		'OSM': layerOsm('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'Hike & Bike': layerOsm(
			'http://{a-c}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
			'<a href="//www.hikebikemap.org/">hikebikemap.org</a>'
		), // Not on https
		'OSM cycle': layerThunderforest('cycle'),
		'OSM landscape': layerThunderforest('landscape'),
		'OSM trains': layerThunderforest('pioneer'),
		'OSM villes': layerThunderforest('neighbourhood'),
		'OSM contraste': layerThunderforest('mobile-atlas'),

		'Italie': layerIGM(),
		'Kompas': layerKompass('KOMPASS'),

		'Bing': layerBing('Road'),
		'Bing photo': layerBing('Aerial'),
		'Bing hybrid': layerBing('AerialWithLabels'),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google hybrid': layerGoogle('s,h'),
		'Stamen': layerStamen('terrain'),
		'Toner': layerStamen('toner'),
		'Watercolor': layerStamen('watercolor'),
		//BEST neutral layer

		// Need an IGN key
		'IGN Classique': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'IGN Standard': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		//403 'IGN Spot': layerIGN('ORTHOIMAGERY.ORTHO-SAT.SPOT.2017', 'png'),
		//Double 	'SCAN25TOUR': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR'),
		'IGN 1950': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS.1950-1965', 'png'),
		//Le style normal n'est pas geré	'Cadast.Exp': layerIGN('CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'png'),
		'Cadastre': layerIGN('CADASTRALPARCELS.PARCELS', 'png'),
		'IGN plan': layerIGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGN'),
		'IGN route': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.ROUTIER'),
		'IGN noms': layerIGN('GEOGRAPHICALNAMES.NAMES', 'png'),
		'IGN rail': layerIGN('TRANSPORTNETWORKS.RAILWAYS', 'png'),
		'IGN hydro': layerIGN('HYDROGRAPHY.HYDROGRAPHY', 'png'),
		'IGN forêt': layerIGN('LANDCOVER.FORESTAREAS', 'png'),
		'IGN limites': layerIGN('ADMINISTRATIVEUNITS.BOUNDARIES', 'png'),

		//Le style normal n'est pas geré 'SHADOW': layerIGN('ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW', 'png'),
		//Le style normal n'est pas geré 'PN': layerIGN('PROTECTEDAREAS.PN', 'png'),
		'PNR': layerIGN('PROTECTEDAREAS.PNR', 'png'),
		//403 'Avalanches': layerIGN('IGN avalanches', GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN'),
		'Etat major': layerIGN('GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40'),
		'ETATMAJOR10': layerIGN('GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR10'),
	});
}

/* FILE src/layerSwitcher.js */
/**
 * Layer switcher
 * Need to include layerSwitcher.css
 */
function controlLayerSwitcher(baseLayers, options) {
	baseLayers = baseLayers || layersCollection();
	options = options || {};

	const control = new ol.control.Control({
			element: document.createElement('div'),
		}),
		layerNames = Object.keys(baseLayers),
		match = document.cookie.match(/baselayer=([^;]+)/);

	var selectedBaseLayerName = match ? match[1] : layerNames[0],
		lastBaseLayerName = '',
		transparentBaseLayerName = '';

	// If the cookie doesn't correspond to an existing layer
	if (typeof baseLayers[selectedBaseLayerName] == 'undefined')
		selectedBaseLayerName = layerNames[0];

	// Build html transparency slider
	const rangeContainerEl = document.createElement('div');
	rangeContainerEl.innerHTML =
		'<input type="range" id="layerSlider" title="Glisser pour faire varier la tranparence">' +
		'<span>Ctrl+click: multicouches</span>';
	rangeContainerEl.firstChild.oninput = displayTransparencyRange;

	control.setMap = function(map) {
		ol.control.Control.prototype.setMap.call(this, map);

		// control.element is defined when attached to the map
		control.element.className = 'ol-control ol-control-switcher';
		control.element.innerHTML = '<button>\u2026</button>';
		control.element.appendChild(rangeContainerEl);
		control.element.onmouseover = function() {
			control.element.classList.add('ol-control-switcher-open');
		};

		// Hide the selector when the cursor is out of the selector
		map.on('pointermove', function(evt) {
			const max_x = map.getTargetElement().offsetWidth - control.element.offsetWidth - 20,
				max_y = control.element.offsetHeight + 20;

			if (evt.pixel[0] < max_x || evt.pixel[1] > max_y)
				control.element.classList.remove('ol-control-switcher-open');
		});

		// Build html baselayers selectors
		for (let name in baseLayers)
			if (baseLayers[name]) { // Don't dispatch null layers (whose declaraton failed)
				const layer = baseLayers[name];

				const selectionEl = document.createElement('div'),
					inputId = 'l' + layer.ol_uid + (name ? '-' + name : '');

				control.element.appendChild(selectionEl);
				selectionEl.innerHTML =
					'<input type="checkbox" name="baseLayer ' +
					'"id="' + inputId + '" value="' + name + '" ' + ' />' +
					'<label for="' + inputId + '">' + name + '</label>';
				selectionEl.firstChild.onclick = selectBaseLayer;
				layer.inputEl = selectionEl.firstChild; // Mem it for further ops

				layer.setVisible(false); // Don't begin to get the tiles yet
				map.addLayer(layer);
			}

		displayBaseLayers(); // Init layers

		// Attach html overlays selector
		const overlaySelector = document.getElementById(options.overlaySelectorId || 'overlay-selector');
		//TODO other id don't use the css
		if (overlaySelector)
			control.element.appendChild(overlaySelector);
	};

	function displayBaseLayers() {
		// Refresh layers visibility & opacity
		for (let name in baseLayers)
			if (baseLayers[name]) {
				baseLayers[name].inputEl.checked = false;
				baseLayers[name].setVisible(false);
				baseLayers[name].setOpacity(1);
			}

		// Baselayer default is the first of the selection
		if (!baseLayers[selectedBaseLayerName])
			selectedBaseLayerName = Object.keys(baseLayers)[0];

		baseLayers[selectedBaseLayerName].inputEl.checked = true;
		baseLayers[selectedBaseLayerName].setVisible(true);

		if (lastBaseLayerName) {
			baseLayers[lastBaseLayerName].inputEl.checked = true;
			baseLayers[lastBaseLayerName].setVisible(true);
		}
		displayTransparencyRange();
	}

	function displayTransparencyRange() {
		if (transparentBaseLayerName) {
			baseLayers[transparentBaseLayerName].setOpacity(
				rangeContainerEl.firstChild.value / 100
			);
			rangeContainerEl.className = 'double-layer';
		} else
			rangeContainerEl.className = 'single-layer';
	}

	function selectBaseLayer(evt) {
		// Set the baselayer cookie
		document.cookie = 'baselayer=' + this.value + '; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString();

		// Manage the double selection
		if (evt && evt.ctrlKey && this.value != selectedBaseLayerName) {
			lastBaseLayerName = selectedBaseLayerName;

			transparentBaseLayerName =
				layerNames.indexOf(lastBaseLayerName) > layerNames.indexOf(this.value) ?
				lastBaseLayerName :
				this.value;

			baseLayers[transparentBaseLayerName].inputEl.checked = true;
			rangeContainerEl.firstChild.value = 50;
		} else
			lastBaseLayerName =
			transparentBaseLayerName = '';

		selectedBaseLayerName = this.value;
		baseLayers[selectedBaseLayerName].inputEl.checked = true;

		displayBaseLayers();
	}

	return control;
}

/* FILE src/layerVector.js */
/**
 * This file adds some facilities to ol.layer.Vector
 */

/**
 * BBOX strategy when the url returns a limited number of features in the BBox
 * We do need to reload when the zoom in
 */
ol.loadingstrategy.bboxLimit = function(extent, resolution) {
	if (this.bboxLimitResolution > resolution) // When zoom in
		this.refresh(); // Force the loading of all areas
	this.bboxLimitResolution = resolution; // Mem resolution for further requests
	return [extent];
};

/**
 * Layer to display remote geoJson
 * Styles, icons & labels
 *
 * Options:
 * All source.Vector options : format, strategy, attributions, ...
 * urlFunction: function(options, bbox, selection, extent, resolution, projection)
 * selectorName : <input name="selectorName"> url arguments selector
 * styleOptions: Options of the style of the features (object = style options or function returning object)
 * hoverStyleOptions: Options of the style when hovering the features (object = style options or function returning object)
 * clusterStyleOptions : Options of the style of the cluster bullets (object = style options)
 *
 * GeoJson properties:
 * icon : url of an icon file
 * iconchem : url of an icon from chemineur.fr
 * name : label on top of the feature
 * type : cabane, ...
 * ele : elevation / altitude (meters)
 * bed : number of places to sleep
 * cluster: number of grouped features too close to be displayed alone
 * hover : label on hovering a feature
 * url: url to go if feature is clicked
 */
//TODO BUG I.E. SCRIPT5022: IndexSizeError
//TODO BUG battement si trop d'icônes
function layerVector(opt) {
	const options = Object.assign({
			zIndex: 1, // Above the base layer
			format: new ol.format.GeoJSON(),
			strategy: ol.loadingstrategy.bbox,
			displayProperties: function(properties) {
				return properties; // Blank default
			},
		}, opt),

		// Yellow label
		defaultStyleOptions = {
			textOptions: {
				textBaseline: 'bottom',
				offsetY: -13, // Balance the bottom textBaseline
				padding: [1, 3, 0, 3],
				font: '14px Calibri,sans-serif',
				backgroundFill: new ol.style.Fill({
					color: 'yellow',
				}),
			},
		},

		// Display hover feature can display with another format
		// In addition to defaultStyleOptions
		defaultHoverStyleOptions = {
			hover: true, // Select label | hover as text to be display
			textOptions: {
				overflow: true, // Force label display of little polygons
				backgroundStroke: new ol.style.Stroke({
					color: 'blue',
				}),
			},
		},

		// Cluster bullet
		defaultClusterStyleOptions = {
			image: new ol.style.Circle({
				radius: 14,
				stroke: new ol.style.Stroke({
					color: 'blue',
				}),
				fill: new ol.style.Fill({
					color: 'white',
				}),
			}),
			text: new ol.style.Text({
				font: '14px Calibri,sans-serif',
			}),
		},

		//HACK to render the html entities in canvas
		elLabel = document.createElement('span'),

		// Source & layer
		source = new ol.source.Vector(Object.assign({
				url: url,
			},
			options)),

		layer = new ol.layer.Vector(Object.assign({
				source: source,
				style: style,
			},
			options)),

		statusEl = document.getElementById(options.selectorName);

	if (statusEl)
		source.on(['featuresloadstart', 'featuresloadend', 'featuresloaderror'], function(evt) {
			if (!statusEl.textContent.includes('error'))
				statusEl.textContent = '';

			switch (evt.type) {
				case 'featuresloadstart':
					statusEl.textContent = 'Chargement...';
					break;
				case 'featuresloaderror':
					statusEl.textContent = 'Erreur !';
			}
		});

	// url callback function for the layer
	function url(extent, resolution, projection) {
		return options.urlFunction(
			options, // Layer options
			ol.proj.transformExtent( // BBox
				extent,
				projection.getCode(),
				'EPSG:4326' // Received projection
			).map(function(c) {
				return c.toFixed(4); // Round to 4 digits
			}),
			readCheckbox(options.selectorName),
			extent, resolution, projection
		);
	}

	// Modify a geoJson url argument depending on checkboxes
	if (options.selectorName)
		memCheckbox(options.selectorName, function(selection) {
			layer.setVisible(selection.length > 0);
			if (selection.length > 0)
				source.refresh();
		});

	// Callback function to define features displays from the properties received from the server
	if (typeof options.displayProperties == 'function')
		source.on('featuresloadend', function(evt) {
			for (let p in evt.features)
				evt.features[p].display = options.displayProperties(
					evt.features[p].getProperties(),
					evt.features[p],
					options
				);
		});

	// Style callback function for the layer
	function style(feature, resolution) {
		if (feature.display.cluster) // Grouped features
			// Cluster style
			return displayStyle(feature, resolution, [
				defaultClusterStyleOptions, options.clusterStyleOptions
			]);
		else
			// Basic display style
			return displayStyle(feature, resolution, [
				defaultStyleOptions, options.styleOptions
			]);
	}

	// Function to display different styles
	function displayStyle(feature, resolution, styles) {
		if (feature.display) {
			const styleOptions = {},
				textOptions = {};

			// Concatenate the list of styles & defaults
			for (let s in styles)
				if (styles[s]) {
					const style = typeof styles[s] == 'function' ?
						styles[s](feature) :
						styles[s];

					Object.assign(styleOptions, style);

					// Separately concatenate text options
					Object.assign(textOptions, style.textOptions);
				}

			//BEST faire une fonction plus générale pour les feature.display
			if (feature.display.iconchem)
				feature.display.icon =
				'//chemineur.fr/ext/Dominique92/GeoBB/icones/' + feature.display.iconchem + '.svg';

			if (feature.display.icon)
				//TODO add <sym> for Garmin upload
				styleOptions.image = new ol.style.Icon({
					src: feature.display.icon,
				});

			// Hover
			const hover = [],
				subHover = [];
			if (styleOptions.hover) { // When the function is called for hover
				if (feature.display.type)
					hover.push(feature.display.type.replace('_', ' '));
				if (feature.display.ele)
					subHover.push(feature.display.ele + 'm');
				if (feature.display.bed)
					subHover.push(feature.display.bed + '\u255E\u2550\u2555');
				if (subHover.length)
					hover.push(subHover.join(', '));
				if (feature.display.name)
					hover.push(feature.display.name);
			}

			elLabel.innerHTML = //HACK to render the html entities in canvas
				(styleOptions.hover ? feature.display.hover : feature.display.cluster) ||
				hover.join('\n') ||
				feature.display.name ||
				'';

			if (elLabel.innerHTML) {
				textOptions.text = elLabel.textContent[0].toUpperCase() + elLabel.textContent.substring(1);
				styleOptions.text = new ol.style.Text(textOptions);
			}

			return new ol.style.Style(styleOptions);
		}
	}

	// Display labels on hovering & click
	// on features of vector layers having the following properties :
	// hover : text on top of the picture
	// url : go to a new URL when we click on the feature

	//HACK to attach hover listeners when the map is defined
	ol.Map.prototype.render = function() {
		if (!this.hoverLayer && this.getView())
			initHover(this);

		return ol.PluggableMap.prototype.render.call(this);
	};

	let hoveredFeature;

	function initHover(map) {
		// Internal layer to temporary display the hovered feature
		const view = map.getView(),
			hoverSource = new ol.source.Vector();

		map.hoverLayer = new ol.layer.Vector({
			source: hoverSource,
			zIndex: 2, // Above the features
			style: function(feature, resolution) {
				return displayStyle(feature, resolution, [
					defaultStyleOptions, defaultHoverStyleOptions, options.hoverStyleOptions
				]);
			},
		});

		map.addLayer(map.hoverLayer);
		map.on(['pointermove', 'click'], hovermouseEvent);
		view.on('change:resolution', hovermouseEvent);

		function hovermouseEvent(evt) {
			// Get hovered feature
			const feature = !evt.originalEvent ? null :
				map.forEachFeatureAtPixel(
					map.getEventPixel(evt.originalEvent),
					function(feature) {
						return feature;
					});

			// Update the display of hovered feature
			if (hoveredFeature !== feature) {
				if (hoveredFeature)
					hoverSource.clear();

				if (feature)
					hoverSource.addFeature(feature);

				map.getViewport().style.cursor = feature ? 'pointer' : 'default';
				hoveredFeature = feature;
			}

			// Click actions
			if (feature && evt.type == 'click') {
				const features = feature.get('features') || [feature],
					display = features[0].display,
					geom = feature.getGeometry();

				if (display) {
					if (features.length == 1 && display.url) {
						// Single feature
						if (evt.originalEvent.ctrlKey)
							window.open(display.url, '_blank').focus();
						else
						if (evt.originalEvent.shiftKey)
							// To specify feature open a new window
							window.open(display.url, '_blank', 'resizable=yes').focus();
						else
							window.location = display.url;
					}
					// Cluster
					else if (geom)
						view.animate({
							zoom: view.getZoom() + 2,
							center: geom.getCoordinates(),
						});
				}
			}
		}
	}

	//HACK Save options for further use (layerVectorCluster)
	layer.options = options; //BEST avoid

	return layer;
}

/**
 * Cluster close features
 */
function layerVectorCluster(layer) {
	const options = Object.assign({
			strategy: ol.loadingstrategy.bbox,
			distance: 50, // Distance in pixels within which features will be clustered together.
		}, layer.options),

		// Clusterized source & layer
		clusterSource = new ol.source.Cluster({
			distance: options.distance,
			source: layer.getSource(),
			geometryFunction: function(feature) {
				// Generate a center point to manage clusterisations
				return new ol.geom.Point(
					ol.extent.getCenter(
						feature.getGeometry().getExtent()
					)
				);
			},
		}),
		clusterLayer = new ol.layer.Vector(Object.assign({
				source: clusterSource,
				style: clusterStyle,
				visible: layer.getVisible(), // Get the selector status 
			},
			options));

	//HACK propagate setVisible following the selector status
	layer.on('change:visible', function() {
		clusterLayer.setVisible(this.getVisible());
	});

	// Tune the clustering distance depending on the zoom level
	let previousResolution;
	clusterLayer.on('prerender', function(evt) {
		const resolution = evt.frameState.viewState.resolution,
			distance = resolution < 10 ? 0 : Math.min(options.distance, resolution);

		if (previousResolution != resolution) // Only when changed
			clusterSource.setDistance(distance);

		previousResolution = resolution;
	});

	// style callback function for the layer
	function clusterStyle(feature, resolution) {
		const features = feature.get('features'),
			style = layer.getStyleFunction();
		let clusters = 0, // Add number of clusters of server cluster groups
			names = [], // List of names of clustered features
			clustered = false; // The server send clusters

		if (features) {
			for (let f in features) {
				// Check if the server send clusters
				if (features[f].display.cluster)
					clustered = true;

				clusters += parseInt(features[f].display.cluster) || 1;

				if (features[f].display.name)
					names.push(features[f].display.name);
			}

			if (features.length > 1 || !names.length) {
				// Big cluster
				if (clusters > 5)
					names = []; // Don't display big list

				// Clusters
				feature.display = {
					cluster: clusters,
					hover: names.length ? names.join('\n') : 'Cliquer pour zoomer',
				};
			} else {
				// Single feature (point, line or poly)
				const featureAlreadyExists = clusterSource.forEachFeature(function(f) {
					if (features[0].ol_uid == f.ol_uid)
						return true;
				});

				if (!featureAlreadyExists)
					clusterSource.addFeature(features[0]);

				return; // Dont display that one, it will display the added one
			}
		}

		return style(feature, resolution);
	}

	return clusterLayer;
}

/**
 * Get checkboxes values of inputs having the same name
 * selectorName {string}
 */
function readCheckbox(selectorName) {
	const inputEls = document.getElementsByName(selectorName);

	// Specific case of a single on/off <input>
	if (inputEls.length == 1)
		return inputEls[0].checked ? ['on'] : [];

	// Read each <input> checkbox
	const selection = [];
	for (let e = 0; e < inputEls.length; e++)
		if (inputEls[e].checked &&
			inputEls[e].value != 'on')
			selection.push(inputEls[e].value);

	return selection;
}

/**
 * Manages checkboxes inputs having the same name
 * selectorName {string}
 * callback {function(selection)} action when the button is clicked
 *
 * Mem the checkboxes in cookies / recover it from the cookies, url args or hash
 * Manages a global flip-flop of the same named <input> checkboxes
 */
function memCheckbox(selectorName, callback) {
	const request = // Search values in cookies & args
		window.location.search + ';' + // Priority to the url args ?selector=1,2,3
		window.location.hash + ';' + // Then the hash #selector=1,2,3
		document.cookie, // Then the cookies
		match = request.match(new RegExp(selectorName + '=([^;]*)')),
		inputEls = document.getElementsByName(selectorName);

	// Set the <inputs> accordingly with the cookies or url args
	if (inputEls)
		for (let e = 0; e < inputEls.length; e++) { // for doesn't work on element array
			// Set inputs following cookies & args
			if (match)
				inputEls[e].checked =
				match[1].split(',').indexOf(inputEls[e].value) != -1 || // That one is declared
				match[1].split(',').indexOf('on') != -1; // The "all (= "on") is set

			// Attach the action
			inputEls[e].addEventListener('click', onClick);

			// Compute the all check && init the cookies if data has been given by the url
			checkEl(inputEls[e]);
		}

	function onClick(evt) {
		checkEl(evt.target); // Do the "all" check verification

		const selection = readCheckbox(selectorName);

		// Mem the data in the cookie
		if (selectorName)
			document.cookie = selectorName + '=' + selection.join(',') +
			'; path=/; SameSite=Secure; expires=' +
			new Date(2100, 0).toUTCString(); // Keep over all session

		if (typeof callback == 'function')
			callback(selection);
	}

	// Check on <input> & set the "All" input accordingly
	function checkEl(target) {
		let allIndex = -1, // Index of the "all" <input> if any
			allCheck = true; // Are all others checked ?

		for (let e = 0; e < inputEls.length; e++) {
			if (target.value == 'on') // If the "all" <input> is checked (who has a default value = "on")
				inputEls[e].checked = target.checked; // Force all the others to the same
			else if (inputEls[e].value == 'on') // The "all" <input>
				allIndex = e;
			else if (!inputEls[e].checked)
				allCheck = false; // Uncheck the "all" <input> if one other is unchecked
		}

		// Check the "all" <input> if all others are
		if (allIndex != -1)
			inputEls[allIndex].checked = allCheck;
	}

	const selection = readCheckbox(selectorName);

	if (typeof callback == 'function')
		callback(selection);

	return selection;
}

/* FILE src/layerVectorCollection.js */
/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */

/**
 * Common function
 */
function fillColorOption(hexColor, transparency) {
	return hexColor ? {
		fill: new ol.style.Fill({
			color: 'rgba(' + [
				parseInt(hexColor.substring(1, 3), 16),
				parseInt(hexColor.substring(3, 5), 16),
				parseInt(hexColor.substring(5, 7), 16),
				transparency || 1,
			].join(',') + ')',
		}),
	} : {};
}

/**
 * Site refuges.info
 */
//TODO min & max layer in the same function
function layerWriPoi(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		urlFunction: function(options, bbox, selection) {
			return '//' + options.host + '/api/bbox' +
				'?nb_points=all' +
				'&type_points=' + selection.join(',') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, feature, options) {
			return {
				name: properties.nom,
				type: properties.type.valeur,
				icon: '//' + options.host + '/images/icones/' + properties.type.icone + '.svg',
				ele: properties.coord.alt,
				bed: properties.places.valeur,
				url: properties.lien,
			};
		},
	}, options));
}

function layerWriAreas(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		polygon: 1,
		urlFunction: function(options) {
			return '//' + options.host + '/api/polygones?type_polygon=' + options.polygon;
		},
		displayProperties: function(properties) {
			return {
				name: properties.nom,
				url: properties.lien,
			};
		},
		styleOptions: function(feature) {
			return fillColorOption(feature.get('couleur'), 0.5);
		},
		hoverStyleOptions: function(feature) {
			return fillColorOption(feature.get('couleur'), 0.7);
		},
	}, options));
}

/**
 * Site chemineur.fr
 */
//TODO min & max layer in the same function
function layerChemPoi(options) {
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		urlFunction: function(options, bbox, selection) {
			return '//' + options.host +
				//TODO gis2 -> gis
				'/ext/Dominique92/GeoBB/gis2.php?layer=simple&' +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, feature, options) {
			//TODO https://chemineur.fr/ext/Dominique92/GeoBB/icones/Randonn%C3%A9e%20p%C3%A9destre.svg 404
			properties.icon = '//' + options.host + '/ext/Dominique92/GeoBB/icones/' + properties.type + '.svg';
			properties.url = '//' + options.host + '/viewtopic.php?t=' + properties.id;
			return properties;
		},
		styleOptions: {
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
		},
		hoverStyleOptions: {
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 3,
			}),
		},
	}, options));
}

function layerChemCluster(options) {
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		urlFunction: function url(options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?layer=cluster&limit=1000000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '');
		},
	}, options));
}

/**
 * Site alpages.info
 */
function layerAlpages(options) {
	return layerVector(Object.assign({
		host: 'alpages.info',
		urlFunction: function(options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis.php?limit=500' +
				(options.selectorName ? '&forums=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, feature, options) {
			const match = properties.icon.match(new RegExp('/([a-z_0-9]+).png'));
			if (match)
				properties.iconchem = match[1];

			properties.url = '//' + options.host + '/viewtopic.php?t=' + properties.id;
			return properties;
		},
		styleOptions: function(feature) {
			return fillColorOption(feature.get('color'), 0.3);
		},
		hoverStyleOptions: function(feature) {
			return fillColorOption(feature.get('color'), 0.7);
		},
	}, options));
}

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
function layerOSM(options) {
	//TODO strategie bboxLimit
	const format = new ol.format.OSMXML(),
		layer = layerVector(Object.assign({
			maxResolution: 50,
			host: 'https://overpass-api.de/api/interpreter',
			urlFunction: urlFunction,
			format: format,
			displayProperties: displayProperties,
		}, options)),
		statusEl = document.getElementById(options.selectorName);

	function urlFunction(options, bbox, selection) {
		const bb = '(' + bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2] + ');',
			args = [];

		// Convert selections on overpass_api language
		for (let l = 0; l < selection.length; l++) {
			const selections = selection[l].split('+');
			for (let ls = 0; ls < selections.length; ls++)
				args.push(
					'node' + selections[ls] + bb + // Ask for nodes in the bbox
					'way' + selections[ls] + bb // Also ask for areas
				);
		}

		return options.host +
			'?data=[timeout:5];(' + // Not too much !
			args.join('') +
			');out center;'; // Add center of areas
	}

	// Extract features from data when received
	format.readFeatures = function(doc, opt) {
		// Transform an area to a node (picto) at the center of this area
		for (let node = doc.documentElement.firstElementChild; node; node = node.nextSibling)
			if (node.nodeName == 'way') {
				// Create a new 'node' element centered on the surface
				const newNode = doc.createElement('node');
				newNode.id = node.id;
				doc.documentElement.appendChild(newNode);

				// Browse <way> attributes to build a new node
				for (let subTagNode = node.firstElementChild; subTagNode; subTagNode = subTagNode.nextSibling)
					switch (subTagNode.nodeName) {
						case 'center':
							// Set node attributes
							newNode.setAttribute('lon', subTagNode.getAttribute('lon'));
							newNode.setAttribute('lat', subTagNode.getAttribute('lat'));
							newNode.setAttribute('nodeName', subTagNode.nodeName);
							break;

						case 'tag': {
							// Get existing properties
							newNode.appendChild(subTagNode.cloneNode());

							// Add a tag to mem what node type it was (for link build)
							const newTag = doc.createElement('tag');
							newTag.setAttribute('k', 'nodetype');
							newTag.setAttribute('v', node.nodeName);
							newNode.appendChild(newTag);
						}
					}
			}
		// Status 200 / error message
		else if (node.nodeName == 'remark' && statusEl)
			statusEl.textContent = node.textContent;

		return ol.format.OSMXML.prototype.readFeatures.call(this, doc, opt);
	};

	function displayProperties(properties) {
		if (options.symbols)
			for (let p in properties) {
				if (typeof options.symbols[p] == 'string')
					properties.type = p;
				else if (typeof options.symbols[properties[p]] == 'string')
					properties.type = properties[p];
			}

		if (properties.type)
			properties.iconchem =
			properties.sym = options.symbols[properties.type];

		return properties;
	}

	return layer;
}

/**
 * Site pyrenees-refuges.com
 */
function layerPyreneesRefuges(options) {
	return layerVector(Object.assign({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		strategy: ol.loadingstrategy.all,
		displayProperties: function(properties) {
			const types = properties.type_hebergement.split(' ');
			return {
				name: properties.name,
				type: properties.type_hebergement,
				iconchem: types[0] + (types.length > 1 ? '_' + types[1] : ''), // Limit to 2 type names
				url: properties.url,
				ele: properties.altitude,
				bed: properties.cap_ete,
			};
		},
	}, options));
}

/**
 * Site camptocamp.org
 */
function layerC2C(options) {
	const format = new ol.format.GeoJSON({ // Format of received data
		dataProjection: 'EPSG:3857',
	});
	format.readFeatures = function(json, opts) {
		const features = [],
			objects = JSONparse(json);
		for (let o in objects.documents) {
			const properties = objects.documents[o];
			features.push({
				id: properties.document_id,
				type: 'Feature',
				geometry: JSONparse(properties.geometry.geom),
				properties: {
					ele: properties.elevation,
					name: properties.locales[0].title,
					type: properties.waypoint_type,
					iconchem: properties.waypoint_type,
					url: 'https://www.camptocamp.org/waypoints/' + properties.document_id,
				},
			});
		}
		return format.readFeaturesFromObject({
				type: 'FeatureCollection',
				features: features,
			},
			format.getReadOptions(json, opts)
		);
	};

	return layerVector(Object.assign({
		urlFunction: function(options, bbox, selection, extent) {
			return 'https://api.camptocamp.org/waypoints?bbox=' + extent.join(',');
		},
		format: format,
		strategy: ol.loadingstrategy.bboxLimit,
	}, options));
}

/* FILE src/controls.js */
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
			location.href + // Priority to ?map=6/2/47 or #map=6/2/47
			(zoomMatch && latLonMatch ? // Old format ?zoom=6&lat=47&lon=5
				';map=' + zoomMatch[1] + '/' + latLonMatch[2] + '/' + latLonMatch[1] :
				'') +
			document.cookie + // Then the cookie
			';map=' + options.initialFit + // Optional default
			';map=6/2/47') // Default
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
 * Control to display the length of a line overflown
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
		label: '', //HACK Bad presentation on I.E. & FF
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
			control.handleFullScreenChange_(); // Change the button class & resize the map
		}
	};
	return control;
}

/**
 * Geocoder
 * Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
 */
//TODO BUG controm 1px down on FireFox
//TODO BUG pas de loupe (return sera pris par phpBB)
//TODO BUG I.E. SCRIPT5022: IndexSizeError
function controlGeocoder(options) {
	options = Object.assign({
		title: 'Recherche sur la carte',
	}, options);

	// Vérify if geocoder is available (not supported in I.E.)
	if (typeof Geocoder != 'function')
		return new ol.control.Control({
			element: document.createElement('div'), //HACK no button
		});

	const geocoder = new Geocoder('nominatim', {
		provider: 'osm',
		lang: 'FR',
		keepOpen: true,
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
//BEST GPS tap on map = distance from GPS calculation
//TODO position initiale quand PC fixe ?
//BEST average inertial counter to get better speed
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
			} else
				displays.push('GPS sync...');
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
		//TODO detecter aussi si on est sur un mobile
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

		geolocation.on(['change:altitude', 'change:speed', 'change:tracking'], displayValues);
		map.on('moveend', renderReticule); // Refresh graticule after map zoom
		geolocation.on('change:position', renderReticule);
		geolocation.on('error', function(error) {
			alert('Geolocation error: ' + error.message);
		});
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
						return new ol.style.Style({
							image: new ol.style.Icon({
								src: '//chemineur.fr/ext/Dominique92/GeoBB/icones/' + feature.getProperties().sym + '.png',
							}),
							stroke: new ol.style.Stroke({
								color: 'blue',
								width: 2,
							}),
						});
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
		controlPrint(),

		// Bottom left
		controlLengthLine(),
		controlMousePosition(),
		new ol.control.ScaleLine(),

		// Bottom right
		controlPermalink(options.controlPermalink),
		new ol.control.Attribution(),
	];
}

/* FILE src/editor.js */
/**
 * geoJson points, lines & polygons display
 * Marker position display & edit
 * Lines & polygons edit
 * Requires JSONparse, myol:onadd, controlButton (from src/controls.js file)
 */
function layerEditGeoJson(options) {
	options = Object.assign({
		format: new ol.format.GeoJSON(),
		projection: 'EPSG:3857',
		geoJsonId: 'editable-json', // Option geoJsonId : html element id of the geoJson features to be edited
		focus: false, // Zoom the map on the loaded features
		snapLayers: [], // Vector layers to snap on
		readFeatures: function() {
			return options.format.readFeatures(
				options.geoJson ||
				JSONparse(geoJsonValue || '{"type":"FeatureCollection","features":[]}'), {
					featureProjection: options.projection,
				});
		},
		saveFeatures: function(coordinates, format) {
			return format.writeFeatures(
					source.getFeatures(
						coordinates, format), {
						featureProjection: options.projection,
						decimals: 5,
					})
				.replace(/"properties":\{[^\}]*\}/, '"properties":null');
		},
		// Drag lines or Polygons
		styleOptions: {
			// Marker circle
			image: new ol.style.Circle({
				radius: 4,
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 2,
				}),
			}),
			// Editable lines or polygons border
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 2,
			}),
			// Editable polygons
			fill: new ol.style.Fill({
				color: 'rgba(0,0,255,0.2)',
			}),
		},
		editStyleOptions: { // Hover / modify / create
			// Editable lines or polygons border
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 4,
			}),
			// Editable polygons fill
			fill: new ol.style.Fill({
				color: 'rgba(255,0,0,0.3)',
			}),
		},
	}, options);

	const geoJsonEl = document.getElementById(options.geoJsonId), // Read data in an html element
		displayPointEl = document.getElementById(options.displayPointId), // Pointer edit <input>
		inputEls = displayPointEl ? displayPointEl.getElementsByTagName('input') : {},
		geoJsonValue = geoJsonEl ? geoJsonEl.value : '',
		extent = ol.extent.createEmpty(), // For focus on all features calculation
		features = options.readFeatures(),
		source = new ol.source.Vector({
			features: features,
			wrapX: false,
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 20,
			style: escapedStyle(options.styleOptions),
		}),
		style = escapedStyle(options.styleOptions),
		editStyle = escapedStyle(options.styleOptions, options.editStyleOptions),
		snap = new ol.interaction.Snap({
			source: source,
			pixelTolerance: 7.5, // 6 + line width / 2 : default is 10
		}),
		modify = new ol.interaction.Modify({
			source: source,
			pixelTolerance: 6, // Default is 10
			style: editStyle,
		}),
		controlModify = controlButton({
			group: 'edit',
			label: options.titleModify ? 'M' : null,
			buttonBackgroundColors: ['white', '#ef3'],
			title: options.titleModify,
			activate: function(active) {
				activate(active, modify);
			},
		});

	// Set edit fields actions
	//BEST do a specific layer for point position editing
	//TODO BUG answer should stay in -180 +180 ° wrap
	for (let i = 0; i < inputEls.length; i++) {
		inputEls[i].onchange = editPoint;
		inputEls[i].source = source;
	}

	// Snap on vector layers
	options.snapLayers.forEach(function(layer) {
		layer.getSource().on('change', function() {
			const fs = layer.getSource().getFeatures();
			for (let f in fs)
				snap.addFeature(fs[f]);
		});
	});

	// Manage hover to save modify actions integrity
	let hoveredFeature = null;

	layer.once('myol:onadd', function(evt) {
		const map = evt.map;
		optimiseEdited(); // Treat the geoJson input as any other edit

		// Add required controls
		if (options.titleModify || options.dragPoint) {
			map.addControl(controlModify);
			controlModify.toggle(true);
		}
		if (options.titleLine)
			map.addControl(controlDraw({
				type: 'LineString',
				label: 'L',
				title: options.titleLine,
			}));
		if (options.titlePolygon)
			map.addControl(controlDraw({
				type: 'Polygon',
				label: 'P',
				title: options.titlePolygon,
			}));

		// Zoom the map on the loaded features
		if (options.focus && features.length) {
			for (let f in features)
				ol.extent.extend(extent, features[f].getGeometry().getExtent());
			map.getView().fit(extent, {
				maxZoom: options.focus,
				size: map.getSize(),
				padding: [5, 5, 5, 5],
			});
		}

		// Add features loaded from GPX file
		map.on('myol:onfeatureload', function(evt) {
			source.addFeatures(evt.features);
			optimiseEdited();
			return false; // Warn controlLoadGPX that the editor got the included feature
		});

		map.on('pointermove', hover);
	});

	//TODO move only one summit when dragging

	modify.on('modifyend', function(evt) {
		//BEST Ctrl+Alt+click on summit : delete the line or poly

		// Ctrl+Alt+click on segment : delete the line or poly
		if (evt.mapBrowserEvent.originalEvent.ctrlKey &&
			evt.mapBrowserEvent.originalEvent.altKey) {
			const selectedFeatures = layer.map_.getFeaturesAtPixel(
				evt.mapBrowserEvent.pixel, {
					hitTolerance: 6, // Default is 0
					layerFilter: function(l) {
						return l.ol_uid == layer.ol_uid;
					}
				});

			for (let f in selectedFeatures) // We delete the selected feature
				source.removeFeature(selectedFeatures[f]);
		}

		// Alt+click on segment : delete the segment & split the line
		const newFeature = snap.snapTo(
			evt.mapBrowserEvent.pixel,
			evt.mapBrowserEvent.coordinate,
			snap.getMap()
		);
		if (evt.mapBrowserEvent.originalEvent.altKey)
			optimiseEdited(newFeature.vertex);

		// Finish
		optimiseEdited();
		hoveredFeature = null; // Recover hovering
	});

	// End of feature creation
	source.on('change', function() { // Called all sliding long
		if (source.modified) { // Awaiting adding complete to save it
			source.modified = false; // To avoid loops

			// Finish
			optimiseEdited();
			hoveredFeature = null; // Recover hovering
		}
	});

	function activate(active, inter) { // Callback at activation / desactivation, mandatory, no default
		if (active) {
			layer.map_.addInteraction(inter);
			layer.map_.addInteraction(snap); // Must be added after
		} else {
			layer.map_.removeInteraction(snap);
			layer.map_.removeInteraction(inter);
		}
	}

	function controlDraw(options) {
		const button = controlButton(Object.assign({
				group: 'edit',
				buttonBackgroundColors: ['white', '#ef3'],
				activate: function(active) {
					activate(active, interaction);
				},
			}, options)),
			interaction = new ol.interaction.Draw(Object.assign({
				style: editStyle,
				source: source,
				stopClick: true, // Avoid zoom when you finish drawing by doubleclick
			}, options));

		interaction.on(['drawend'], function() {
			// Switch on the main editor button
			controlModify.toggle(true);

			// Warn source 'on change' to save the feature
			// Don't do it now as it's not yet added to the source
			source.modified = true;
		});
		return button;
	}

	function hover(evt) {
		let nbFeaturesAtPixel = 0;
		layer.map_.forEachFeatureAtPixel(evt.pixel, function(feature) {
			source.getFeatures().forEach(function(f) {
				if (f.ol_uid == feature.ol_uid) {
					nbFeaturesAtPixel++;
					if (!hoveredFeature) { // Hovering only one
						feature.setStyle(editStyle);
						hoveredFeature = feature; // Don't change it until there is no more hovered
					}
				}
			});
		}, {
			hitTolerance: 6, // Default is 0
		});

		// If no more hovered, return to the normal style
		if (!nbFeaturesAtPixel && !evt.originalEvent.buttons && hoveredFeature) {
			hoveredFeature.setStyle(style);
			hoveredFeature = null;
		}
	}

	//TODO BUG don't check CH1903 hiding
	layer.centerMarker = function() {
		source.getFeatures().forEach(function(f) {
			f.getGeometry().setCoordinates(
				layer.map_.getView().getCenter()
			);
		});
	};

	layer.centerMap = function() {
		source.getFeatures().forEach(function(f) {
			layer.map_.getView().setCenter(
				f.getGeometry().getCoordinates()
			);
		});
	};

	//BEST make separate position control
	function editPoint(evt) {
		const ll = evt.target.name.length == 3 ?
			ol.proj.transform([inputEls.lon.value, inputEls.lat.value], 'EPSG:4326', 'EPSG:3857') : // Modify lon | lat
			ol.proj.transform([parseInt(inputEls.x.value), parseInt(inputEls.y.value)], 'EPSG:21781', 'EPSG:3857'); // Modify x | y

		evt.target.source.getFeatures().forEach(function(f) {
			f.getGeometry().setCoordinates(ll);
		});

		optimiseEdited();
	}

	function displayPoint(ll) {
		if (displayPointEl) {
			const ll4326 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:4326'),
				formats = {
					decimal: ['Degrés décimaux', 'EPSG:4326', 'format',
						'Longitude: {x}, Latitude: {y}',
						5
					],
					degminsec: ['Deg Min Sec', 'EPSG:4326', 'toStringHDMS'],
				};

			//BEST include proj4/proj4-src.js with a tag
			let ll21781 = null;
			if (typeof proj4 == 'function') {
				// Specific Swiss coordinates EPSG:21781 (CH1903 / LV03)
				if (ol.extent.containsCoordinate([664577, 5753148, 1167741, 6075303], ll)) {
					proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');
					ol.proj.proj4.register(proj4);
					ll21781 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:21781');

					formats.swiss = ['Suisse', 'EPSG:21781', 'format', 'X= {x} Y= {y} (CH1903)'];
				}

				// Fuseau UTM
				const u = Math.floor(ll4326[0] / 6 + 90) % 60 + 1;
				formats.utm = ['UTM', 'EPSG:326' + u, 'format', 'UTM ' + u + ' lon: {x}, lat: {y}'];
				proj4.defs('EPSG:326' + u, '+proj=utm +zone=' + u + ' +ellps=WGS84 +datum=WGS84 +units=m +no_defs');
				ol.proj.proj4.register(proj4);
			}
			// Display or not the EPSG:21781 coordinates
			const epsg21781 = document.getElementsByClassName('epsg-21781');
			for (let e = 0; e < epsg21781.length; e++)
				epsg21781[e].style.display = ll21781 ? '' : 'none';

			if (inputEls.length)
				// Set the html input
				for (let i = 0; i < inputEls.length; i++)
					switch (inputEls[i].name) {
						case 'lon':
							inputEls[i].value = Math.round(ll4326[0] * 100000) / 100000;
							break;
						case 'lat':
							inputEls[i].value = Math.round(ll4326[1] * 100000) / 100000;
							break;
						case 'x':
							inputEls[i].value = ll21781 ? Math.round(ll21781[0]) : '-';
							break;
						case 'y':
							inputEls[i].value = ll21781 ? Math.round(ll21781[1]) : '-';
							break;
					}
			else {
				// Set the html display
				if (!formats[options.displayFormat])
					options.displayFormat = 'decimal';

				let f = formats[options.displayFormat],
					html = ol.coordinate[f[2]](
						ol.proj.transform(ll, 'EPSG:3857', f[1]),
						f[3], f[4], f[5]
					) + ' <select>';

				for (let f in formats)
					html += '<option value="' + f + '"' +
					(f == options.displayFormat ? ' selected="selected"' : '') + '>' +
					formats[f][0] + '</option>';

				displayPointEl.innerHTML = html.replace(
					/( [-0-9]+)([0-9][0-9][0-9],? )/g,
					function(whole, part1, part2) {
						return part1 + ' ' + part2;
					}
				) + '</select>';
			}
			// Select action
			const selects = displayPointEl.getElementsByTagName('select');
			if (selects.length)
				selects[0].onchange = function(evt) {
					options.displayFormat = evt.target.value;
					displayPoint(ll);
				};
		}
	}

	function escapedStyle(a, b, c) {
		//BEST work with arguments
		const defaultStyle = new ol.layer.Vector().getStyleFunction()()[0];
		return function(feature) {
			return new ol.style.Style(Object.assign({
					fill: defaultStyle.getFill(),
					stroke: defaultStyle.getStroke(),
					image: defaultStyle.getImage(),
				},
				typeof a == 'function' ? a(feature.getProperties()) : a,
				typeof b == 'function' ? b(feature.getProperties()) : b,
				typeof c == 'function' ? c(feature.getProperties()) : c
			));
		};
	}

	function optimiseEdited(deleteCoords) {
		const coords = optimiseFeatures(
			source.getFeatures(),
			options.titleLine,
			options.titlePolygon,
			true,
			true,
			deleteCoords
		);

		// Recreate features
		source.clear();
		if (options.singlePoint) {
			// Initialise the marker at the center on the map if no coords are available
			//TODO BUG si json entrée vide, n'affiche pas les champs numériques
			coords.points.push(layer.map_.getView().getCenter());


			// Keep only the first point
			if (coords.points[0])
				source.addFeature(new ol.Feature({
					geometry: new ol.geom.Point(coords.points[0]),
					draggable: options.dragPoint,
				}));
		} else {
			for (let p in coords.points)
				source.addFeature(new ol.Feature({
					geometry: new ol.geom.Point(coords.points[p]),
					draggable: options.dragPoint,
				}));
			for (let l in coords.lines)
				source.addFeature(new ol.Feature({
					geometry: new ol.geom.LineString(coords.lines[l]),
				}));
			for (let p in coords.polys)
				source.addFeature(new ol.Feature({
					geometry: new ol.geom.Polygon(coords.polys[p]),
				}));
		}

		// Display & edit 1st point coordinates
		if (coords.points.length && displayPointEl)
			displayPoint(coords.points[0]);

		// Save geometries in <EL> as geoJSON at every change
		if (geoJsonEl)
			geoJsonEl.value = options.saveFeatures(coords, options.format);
	}

	return layer;
}

/**
 * Refurbish Points, Lines & Polygons
 * Split lines having a summit at deleteCoords
 * Common to controlDownload & layerEditGeoJson 
 */
function optimiseFeatures(features, withLines, withPolygons, merge, holes, deleteCoords) {
	const points = [],
		lines = [],
		polys = [];

	// Get all edited features as array of coordinates
	for (let f in features)
		flatFeatures(features[f].getGeometry(), points, lines, polys, deleteCoords);

	for (let a in lines)
		// Exclude 1 coordinate features (points)
		//BEST manage points
		if (lines[a].length < 2)
			delete lines[a];

		// Merge lines having a common end
		else if (merge)
		for (let b = 0; b < a; b++) // Once each combination
			if (lines[b]) {
				const m = [a, b];
				for (let i = 4; i; i--) // 4 times
					if (lines[m[0]] && lines[m[1]]) { // Test if the line has been removed
						// Shake lines end to explore all possibilities
						m.reverse();
						lines[m[0]].reverse();
						if (compareCoords(lines[m[0]][lines[m[0]].length - 1], lines[m[1]][0])) {
							// Merge 2 lines having 2 ends in common
							lines[m[0]] = lines[m[0]].concat(lines[m[1]].slice(1));
							delete lines[m[1]]; // Remove the line but don't renumber the array keys
						}
					}
			}

	// Make polygons with looped lines
	for (let a in lines)
		if (withPolygons && // Only if polygons are autorized
			lines[a]) {
			// Close open lines
			if (!withLines) // If only polygons are autorized
				if (!compareCoords(lines[a]))
					lines[a].push(lines[a][0]);

			if (compareCoords(lines[a])) { // If this line is closed
				// Split squeezed polygons
				for (let i1 = 0; i1 < lines[a].length - 1; i1++) // Explore all summits combinaison
					for (let i2 = 0; i2 < i1; i2++)
						if (lines[a][i1][0] == lines[a][i2][0] &&
							lines[a][i1][1] == lines[a][i2][1]) { // Find 2 identical summits
							let squized = lines[a].splice(i2, i1 - i2); // Extract the squized part
							squized.push(squized[0]); // Close the poly
							polys.push([squized]); // Add the squized poly
							i1 = i2 = lines[a].length; // End loop
						}

				// Convert closed lines into polygons
				polys.push([lines[a]]); // Add the polygon
				delete lines[a]; // Forget the line
			}
		}

	// Makes holes if a polygon is included in a biggest one
	for (let p1 in polys) // Explore all Polygons combinaison
		if (holes && // Make holes option
			polys[p1]) {
			const fs = new ol.geom.Polygon(polys[p1]);
			for (let p2 in polys)
				if (polys[p2] && p1 != p2) {
					let intersects = true;
					for (let c in polys[p2][0])
						if (!fs.intersectsCoordinate(polys[p2][0][c]))
							intersects = false;
					if (intersects) { // If one intersects a bigger
						polys[p1].push(polys[p2][0]); // Include the smaler in the bigger
						delete polys[p2]; // Forget the smaller
					}
				}
		}

	return {
		points: points,
		lines: lines.filter(Boolean), // Remove deleted array members
		polys: polys.filter(Boolean),
	};

	function flatFeatures(geom, points, lines, polys, deleteCoords) {
		// Expand geometryCollection
		if (geom.getType() == 'GeometryCollection') {
			const geometries = geom.getGeometries();
			for (let g in geometries)
				flatFeatures(geometries[g], points, lines, polys, deleteCoords);
		}
		// Point
		else if (geom.getType().match(/point$/i))
			points.push(geom.getCoordinates());

		// line & poly
		else
			flatCoord(lines, geom.getCoordinates(), deleteCoords); // Get lines or polyons as flat array of coords
	}

	// Get all lines fragments (lines, polylines, polygons, multipolygons, hole polygons, ...)
	// at the same level & split if one point = deleteCoords
	function flatCoord(existingCoords, newCoords, deleteCoords) {
		if (typeof newCoords[0][0] == 'object') // Multi*
			for (let c1 in newCoords)
				flatCoord(existingCoords, newCoords[c1], deleteCoords);
		else {
			existingCoords.push([]); // Add a new segment

			for (let c2 in newCoords)
				if (deleteCoords && compareCoords(newCoords[c2], deleteCoords))
					existingCoords.push([]); // Ignore this point and add a new segment
				else
					// Stack on the last existingCoords array
					existingCoords[existingCoords.length - 1].push(newCoords[c2]);
		}
	}

	function compareCoords(a, b) {
		if (!a)
			return false;
		if (!b)
			return compareCoords(a[0], a[a.length - 1]); // Compare start with end
		return a[0] == b[0] && a[1] == b[1]; // 2 coords
	}
}