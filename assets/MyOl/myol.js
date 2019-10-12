/*!
 * OPENLAYERS V5 ADAPTATION - https://openlayers.org/
 * (C) Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 *
 * I have designed this openlayers adaptation as simple as possible to make it maintained with basics JS skills
 * You only have to include openlayers/dist .js & .css files & my 2 & that's it !
 * You can use any of these functions independantly
 * No JS classes, no jquery, no es6 modules, no nodejs build, no minification, no npm repository, ... only one file of JS functions & CSS
 * I know, I know, it's not a modern programming method but it's my choice & you're free to take, modifiy & adapt it as you wish
 */

/* jshint esversion: 6 */

/**
 * Appends objects. The last one has the priority
 */
ol.assign = function() {
	let r = {};
	for (let a in arguments)
		for (let v in arguments[a])
			r[v] = arguments[a][v];
	return r;
};

/**
 * TILE LAYERS
 */
/**
 * Openstreetmap
 */
function layerOSM(url, attribution) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: url,
			attributions: [
				attribution || '',
				ol.source.OSM.ATTRIBUTION
			]
		})
	});
}

/**
 * Kompas (Austria)
 * Requires layerOSM
 * Not available via https
 */
function layerKompass(layer) {
	return layerOSM(
		'http://ec{0-3}.cdn.ecmaps.de/WmsGateway.ashx.jpg?' +
		'Experience=ecmaps&MapStyle=' + layer + '&TileX={x}&TileY={y}&ZoomLevel={z}',
		'<a href="http://www.kompass.de/livemap/">KOMPASS</a>'
	);
}

/**
 * Thunderforest
 * Requires layerOSM
 * Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
 */
function layerThunderforest(key, layer) {
	return layerOSM(
		'//{a-c}.tile.thunderforest.com/' + layer + '/{z}/{x}/{y}.png?apikey=' + key,
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
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>'
		})
	});
}

/**
 * Stamen http://maps.stamen.com
 */
function layerStamen(layer) {
	return new ol.layer.Tile({
		source: new ol.source.Stamen({
			layer: layer
		})
	});
}

/**
 * IGN France
 * Doc on http://api.ign.fr
 * Get your own (free) IGN key at http://professionnels.ign.fr/user
 */
function layerIGN(key, layer, format) {
	const IGNresolutions = [],
		IGNmatrixIds = [];
	for (let i = 0; i < 18; i++) {
		IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
		IGNmatrixIds[i] = i.toString();
	}
	const IGNtileGrid = new ol.tilegrid.WMTS({
		origin: [-20037508, 20037508],
		resolutions: IGNresolutions,
		matrixIds: IGNmatrixIds
	});

	return new ol.layer.Tile({
		source: new ol.source.WMTS({
			url: '//wxs.ign.fr/' + key + '/wmts',
			layer: layer,
			matrixSet: 'PM',
			format: 'image/' + (format || 'jpeg'),
			tileGrid: IGNtileGrid,
			style: 'normal',
			attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>'
		})
	});
}

/**
 * Spain
 */
function layerSpain(serveur, layer) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: '//www.ign.es/wmts/' + serveur + '?layer=' + layer +
				'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
				'&style=default&tilematrixset=GoogleMapsCompatible' +
				'&TileMatrix={z}&TileCol={x}&TileRow={y}',
			attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>'
		})
	});
}

/**
 * Layers with not all resolutions or area available
 * Virtual class
 * Displays OSM outside the zoom area, 
 * Displays blank outside of validity area
 * Requires 'myol:onadd' event
 */
layerTileIncomplete = function(o) {
	const layer = new ol.layer.Tile(), // For callback functions
		options = layer.options_ = ol.assign({ // Default options
			extent: [-20026376, -20048966, 20026376, 20048966], // EPSG:3857
			sources: {}
		}, o),
		backgroundSource = new ol.source.Stamen({
			layer: 'terrain'
		});

	layer.once('myol:onadd', function(evt) {
		evt.target.map_.getView().on('change', change);
		change(); // At init
	});

	// Zoom has changed
	function change() {
		const view = layer.map_.getView(),
			center = view.getCenter();
		let currentResolution = 999999; // Init loop at max resolution
		options.sources[currentResolution] = backgroundSource; // Add extrabound source on the top of the list

		// Search for sources according to the map resolution
		if (center &&
			ol.extent.intersects(options.extent, view.calculateExtent(layer.map_.getSize())))
			currentResolution = Object.keys(options.sources).filter(function(evt) { // HACK : use of filter to perform an action
				return evt > view.getResolution();
			})[0];

		// Update layer if necessary
		if (layer.getSource() != options.sources[currentResolution])
			layer.setSource(options.sources[currentResolution]);
	}

	return layer;
};

/**
 * Swisstopo https://api.geo.admin.ch/
 * Register your domain: https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
 * Requires layerTileIncomplete
 */
function layerSwissTopo(layer) {
	let projectionExtent = ol.proj.get('EPSG:3857').getExtent(),
		resolutions = [],
		matrixIds = [];
	for (let r = 0; r < 18; ++r) {
		resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}
	const tileGrid = new ol.tilegrid.WMTS({
		origin: ol.extent.getTopLeft(projectionExtent),
		resolutions: resolutions,
		matrixIds: matrixIds
	});

	return layerTileIncomplete({
		extent: [664577, 5753148, 1167741, 6075303], // EPSG:21781
		sources: {
			500: new ol.source.WMTS(({
				crossOrigin: 'anonymous',
				url: '//wmts2{0-4}.geo.admin.ch/1.0.0/' + layer + '/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: tileGrid,
				requestEncoding: 'REST',
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>'
			}))
		}
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
				layers: layer
			},
			attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer">IGM</a>'
		});
	}

	return layerTileIncomplete({
		extent: [660124, 4131313, 2113957, 5958411], // EPSG:6875 (Italie)
		sources: {
			100: igmSource('IGM_250000', 'CB.IGM250000'),
			25: igmSource('IGM_100000', 'MB.IGM100000'),
			5: igmSource('IGM_25000', 'CB.IGM25000')
		}
	});
}

/**
 * Ordnance Survey : Great Britain
 * Requires layerTileIncomplete
 * Get your own (free) key at http://www.ordnancesurvey.co.uk/business-and-government/products/os-openspace/
 */
function layerOS(key) {
	const layer = layerTileIncomplete({
		extent: [-841575, 6439351, 198148, 8589177] // EPSG:27700 (G.B.)
	});

	// HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is required
	layer.on('change:opacity', function(evt) {
		if (evt.target.getVisible() && !evt.target.options_.sources[75])
			evt.target.options_.sources[75] = new ol.source.BingMaps({
				imagerySet: 'ordnanceSurvey',
				key: key
			});
	});

	return layer;
}

/**
 * Bing (Microsoft)
 * Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
 */
function layerBing(key, subLayer) {
	const layer = new ol.layer.Tile();

	// HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is required
	layer.on('change:opacity', function(evt) {
		if (this.getVisible() && !this.getSource()) {
			layer.setSource(new ol.source.BingMaps({
				imagerySet: subLayer,
				key: key,
			}));
		}
	});

	return layer;
}


/**
 * VECTORS, GEOJSON & AJAX LAYERS
 */
/**
 * Mem in cookies the checkbox content with name="selectorName"
 */
function controlPermanentCheckbox(selectorName, callback) {
	const checkElements = document.getElementsByName(selectorName),
		cookie =
		location.hash.match('map-' + selectorName + '=([^#,&;]*)') || // Priority to the hash
		document.cookie.match('map-' + selectorName + '=([^;]*)'); // Then the cookie

	for (let e = 0; e < checkElements.length; e++) {
		checkElements[e].addEventListener('click', permanentCheckboxClick); // Attach the action

		//TODO BUG EDGE check, then retrieve init
		if (cookie) // Set the checks accordingly with the cookie
			checkElements[e].checked = cookie[1].split(',').indexOf(checkElements[e].value) !== -1;
	}

	// Call callback once at the init
	callback(null, permanentCheckboxList(selectorName));

	function permanentCheckboxClick(evt) {
		if (typeof callback == 'function')
			callback(evt, permanentCheckboxList(selectorName, evt));
	}
}

// Global function, called by others
function permanentCheckboxList(selectorName, evt) {
	const checkElements = document.getElementsByName(selectorName);
	let allChecks = [];

	for (let e = 0; e < checkElements.length; e++) {
		// Select/deselect all (clicking an <input> without value)
		if (evt) {
			if (evt.target.value == 'on') // The Select/deselect has a default value = "on"
				checkElements[e].checked = evt.target.checked; // Check all if "all" is clicked
			else if (checkElements[e].value == 'on')
				checkElements[e].checked = false; // Reset the "all" checks if another check is clicked
		}

		// Get status of all checks
		if (checkElements[e].checked) // List checked elements
			allChecks.push(checkElements[e].value);
	}

	// Mem the related cookie
	// Keep empty one to keep memory of cancelled subchoices
	document.cookie = 'map-' + selectorName + '=' + allChecks.join(',') + ';path=/';

	return allChecks; // Returns list of checked values or ids
}

/**
 * BBOX dependant strategy
 * Same that bbox but reloads if we zoom in because we are delivering more points
 * Returns {ol.loadingstrategy} to be used in layer definition
 */
function loadingStrategyBboxLimit(extent, resolution) {
	loadedExtentsRtree = this.loadedExtentsRtree_;
	if (this.bboxLimitResolution > resolution)
		this.loadedExtentsRtree_.clear(); // Force loading when zoom in
	this.bboxLimitResolution = resolution; // Mem resolution for further requests

	return [extent];
}

/**
 * GeoJson POI layer
 * Requires 'myol:onadd' event
 * Requires controlPermanentCheckbox
 * Requires permanentCheckboxList
 */
function layerVectorURL(o) {
	const options = ol.assign({ // Default options
		baseUrlFunction: function(bbox, list, resolution) {
			return options.baseUrl + // baseUrl is mandatory, no default
				list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
		}
	}, o);
	if (options.styleOptions) // Optional
		options.style = function(feature) {
			return new ol.style.Style(
				typeof options.styleOptions == 'function' ?
				options.styleOptions(feature.getProperties()) :
				options.styleOptions
			);
		};
	if (options.hoverStyleOptions) // Optional
		options.hoverStyle = function(feature) {
			return new ol.style.Style(
				typeof options.hoverStyleOptions == 'function' ?
				options.hoverStyleOptions(feature.getProperties()) :
				options.hoverStyleOptions
			);
		};

	// HACK to clear the layer when the xhr response is received
	// This needs to be redone every time a response is received to avoid multiple simultaneous xhr requests
	//TODO BEST JSON error handling : error + URL
	const format = new ol.format.GeoJSON();
	format.readFeatures = function(s, o) {
		if (source.bboxLimitResolution) // If bbbox optimised
			source.clear(); // Clean all features when receive request
		return ol.format.GeoJSON.prototype.readFeatures.call(this, s, o);
	};

	// Manage source & vector objects
	var loadedExtentsRtree = null, //TODO ARCHI best ??????
		source = new ol.source.Vector(ol.assign({
			url: function(extent, resolution, projection) {
				const bbox = ol.proj.transformExtent(extent, projection.getCode(), 'EPSG:4326'),
					// Retreive checked parameters
					list = permanentCheckboxList(options.selectorName).filter(function(evt) { // selectorName optional
						return evt !== 'on'; // Remove the "all" input (default value = "on")
					});
				return options.baseUrlFunction(bbox, list, resolution);
			},
			strategy: loadingStrategyBboxLimit, //TODO do not use for overpass
			format: format
		}, options));

	// Create the layer
	const layer = new ol.layer.Vector(ol.assign({
		source: source,
		renderBuffer: 16, // buffered area around curent view (px)
		zIndex: 1 // Above the baselayer even if included to the map before
	}, options));
	layer.options_ = options;

	// Optional : checkboxes to tune layer parameters
	if (options.selectorName)
		controlPermanentCheckbox(
			options.selectorName,
			function(evt, list) {
				layer.setVisible(list.length);
				if (list.length && loadedExtentsRtree) {
					loadedExtentsRtree.clear(); // Redraw the layer
					source.clear(); // Redraw the layer
				}
			}
		);

	layer.once('myol:onadd', function() {
		const map = layer.map_;

		// Create the label popup
		//TODO BUG don't zoom when the cursor is over a label
		if (!map.popElement_) { //HACK Only once for all layers
			map.popElement_ = document.createElement('a');
			map.popElement_.style.display = 'block';
			map.popup_ = new ol.Overlay({
				element: map.popElement_
			});
			map.addOverlay(map.popup_);

			// Label when hovering a feature
			map.on('pointermove', layerVectorPointerMove);

			// Click on a feature
			map.on('click', function(evt) {
				evt.target.forEachFeatureAtPixel(
					evt.pixel,
					function() {
						map.popElement_.click(); // Simulate a click on the label
					}
				);
			});
		}

		// Style when hovering a feature
		//TODO BUG BEST interacts with the editor
		map.addInteraction(new ol.interaction.Select({
			condition: ol.events.condition.pointerMove,
			hitTolerance: 6,
			filter: function(feature, l) {
				return l == layer;
			},
			style: layer.options_.hoverStyle || layer.options_.style
		}));

		// Hide popup when the cursor is out of the map
		window.addEventListener('mousemove', function(evt) {
			const divRect = map.getTargetElement().getBoundingClientRect();
			if (evt.clientX < divRect.left || evt.clientX > divRect.right ||
				evt.clientY < divRect.top || evt.clientY > divRect.bottom)
				map.popup_.setPosition();
		});
	});

	function layerVectorPointerMove(evt) {
		const map = evt.target;
		let pixel = [evt.pixel[0], evt.pixel[1]];

		// Hide label by default if none feature or his popup here
		const mapRect = map.getTargetElement().getBoundingClientRect(),
			popupRect = map.popElement_.getBoundingClientRect();
		if (popupRect.left - 5 > mapRect.x + evt.pixel[0] || mapRect.x + evt.pixel[0] >= popupRect.right + 5 ||
			popupRect.top - 5 > mapRect.y + evt.pixel[1] || mapRect.y + evt.pixel[1] >= popupRect.bottom + 5)
			map.popup_.setPosition();

		// Reset cursor if there is no feature here
		map.getViewport().style.cursor = 'default';

		map.forEachFeatureAtPixel(
			pixel,
			function(feature, l) {
				let geometry = feature.getGeometry();
				if (typeof feature.getGeometry().getGeometries == 'function') // GeometryCollection
					geometry = geometry.getGeometries()[0];

				if (l && l.options_) {
					const properties = feature.getProperties(),
						coordinates = geometry.flatCoordinates, // If it's a point, just over it
						ll4326 = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
					if (coordinates.length == 2) // Stable if icon
						pixel = map.getPixelFromCoordinate(coordinates);

					// Hovering label
					const label = typeof layer.options_.label == 'function' ?
						layer.options_.label(properties, feature) :
						layer.options_.label || '',
						postLabel = typeof layer.options_.postLabel == 'function' ?
						layer.options_.postLabel(properties, feature, layer, pixel, ll4326) :
						layer.options_.postLabel || '';

					if (label && !map.popup_.getPosition()) { // Only for the first feature on the hovered stack
						// Calculate the label's anchor
						map.popup_.setPosition(map.getView().getCenter()); // For popup size calculation

						// Fill label class & text
						map.popElement_.className = 'myPopup ' + (layer.options_.labelClass || '');
						map.popElement_.innerHTML = label + postLabel;
						if (typeof layer.options_.href == 'function') {
							map.popElement_.href = layer.options_.href(properties);
							map.getViewport().style.cursor = 'pointer';
						}

						// Shift of the label to stay into the map regarding the pointer position
						if (pixel[1] < map.popElement_.clientHeight + 12) { // On the top of the map (not enough space for it)
							pixel[0] += pixel[0] < map.getSize()[0] / 2 ? 10 : -map.popElement_.clientWidth - 10;
							pixel[1] = 2;
						} else {
							pixel[0] -= map.popElement_.clientWidth / 2;
							pixel[0] = Math.max(pixel[0], 0); // Bord gauche
							pixel[0] = Math.min(pixel[0], map.getSize()[0] - map.popElement_.clientWidth - 1); // Bord droit
							pixel[1] -= map.popElement_.clientHeight + 8;
						}
						map.popup_.setPosition(map.getCoordinateFromPixel(pixel));
					}
				}
			}, {
				hitTolerance: 6,
			}
		);
	}

	return layer;
}

/**
 * OSM overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 * Requires layerVectorURL
 */
//TODO BEST reload layer when clik on feature
//TODO IE BUG no overpass on IE
//TODO BEST BUG displays "?" when moves or zooms after changing a selector
//TODO BEST display error 429 (Too Many Requests)
//TODO WARNING A cookie associated with a cross-site resource at https://openlayers.org/ was set without the `SameSite` attribute. A future release of Chrome will only deliver cookies with cross-site requests if they are set with `SameSite=None` and `Secure`. You can review cookies in developer tools under Application>Storage>Cookies and see more details at https://www.chromestatus.com/feature/5088147346030592 and https://www.chromestatus.com/feature/5633521622188032.

layerOverpass = function(o) {
	const options = ol.assign({ // Default options
			baseUrl: '//overpass-api.de/api/interpreter',
			maxResolution: 30, // Only call overpass if the map's resolution is lower
			selectorId: 'overpass', // Element containing all checkboxes
			selectorName: 'overpass', // Checkboxes
			labelClass: 'label-overpass',
			iconUrlPath: '//dc9.fr/chemineur/ext/Dominique92/GeoBB/types_points/'
		}, o),
		checkElements = document.getElementsByName(options.selectorName),
		elSelector = document.getElementById(options.selectorId);
	elSelector.className = 'overpass'; // At the biginning

	// Convert areas into points to display it as an icon
	let osmXmlPoi = new ol.format.OSMXML();
	osmXmlPoi.readFeatures = function(source, options) {
		for (let node = source.documentElement.firstChild; node; node = node.nextSibling)
			if (node.nodeName == 'way') {
				// Create a new 'node' element centered on the surface
				const newNode = source.createElement('node');
				source.documentElement.appendChild(newNode);
				newNode.id = node.id;

				// Add a tag to mem what node type it was
				const newTag = source.createElement('tag');
				newTag.setAttribute('k', 'nodetype');
				newTag.setAttribute('v', 'way');
				newNode.appendChild(newTag);

				for (let subTagNode = node.firstChild; subTagNode; subTagNode = subTagNode.nextSibling)
					switch (subTagNode.nodeName) {
						case 'center':
							newNode.setAttribute('lon', subTagNode.getAttribute('lon'));
							newNode.setAttribute('lat', subTagNode.getAttribute('lat'));
							newNode.setAttribute('nodeName', subTagNode.nodeName);
							break;
						case 'tag':
							newNode.appendChild(subTagNode.cloneNode());
					}
			}
		return ol.format.OSMXML.prototype.readFeatures.call(this, source, options);
	};

	function overpassType(properties) {
		for (let e = 0; e < checkElements.length; e++)
			if (checkElements[e].checked) {
				const tags = checkElements[e].value.split('+');
				for (let t = 0; t < tags.length; t++) {
					const conditions = tags[t].split('"');
					if (properties[conditions[1]] &&
						properties[conditions[1]].match(conditions[3]))
						return checkElements[e].id;
				}
			}
		return 'inconnu';
	}

	return layerVectorURL(ol.assign({
		format: osmXmlPoi,
		styleOptions: function(properties) {
			return {
				image: new ol.style.Icon({
					src: options.iconUrlPath + overpassType(properties) + '.png'
				})
			};
		},
		baseUrlFunction: function(bbox, list, resolution) {
			const bb = '(' + bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2] + ');',
				args = [];

			if (resolution < (options.maxResolution)) { // Only for small areas
				for (let l = 0; l < list.length; l++) {
					const lists = list[l].split('+');
					for (let ls = 0; ls < lists.length; ls++)
						args.push(
							'node' + lists[ls] + bb + // Ask for nodes in the bbox
							'way' + lists[ls] + bb // Also ask for areas
						);
				}
				if (elSelector)
					elSelector.className = 'overpass';
			} else if (elSelector)
				elSelector.className = 'overpass-zoom-out';

			return options.baseUrl +
				'?data=[timeout:5];(' + // Not too much !
				args.join('') +
				');out center;'; // add center of areas
		},
		label: function(p, f) { // properties, feature
			p.name = p.name || p.alt_name || p.short_name || '';
			const language = {
					alpine_hut: 'Refuge gard&egrave;',
					hotel: 'h&ocirc;tel',
					guest_house: 'chambre d‘h&ocirc;te',
					camp_site: 'camping',
					convenience: 'alimentation',
					supermarket: 'supermarch&egrave;',
					drinking_water: 'point d&apos;eau',
					watering_place: 'abreuvoir',
					fountain: 'fontaine',
					telephone: 't&egrave;l&egrave;phone',
					shelter: ''
				},
				phone = p.phone || p['contact:phone'],
				address = [
					p.address,
					p['addr:housenumber'], p.housenumber,
					p['addr:street'], p.street,
					p['addr:postcode'], p.postcode,
					p['addr:city'], p.city
				],
				popup = [
					'<b>' + p.name.charAt(0).toUpperCase() + p.name.slice(1) + '</b>', [
						'<a target="_blank"',
						'href="http://www.openstreetmap.org/' + (p.nodetype ? p.nodetype : 'node') + '/' + f.getId() + '"',
						'title="Voir la fiche d‘origine sur openstreetmap">',
						p.name ? (
							p.name.toLowerCase().match(language[p.tourism] || 'azertyuiop') ? '' : p.tourism
							//TODO BUG do not recognize accented letters (hôtel)
						) : (
							language[p.tourism] || p.tourism
						),
						'*'.repeat(p.stars),
						p.shelter_type == 'basic_hut' ? 'Abri' : '',
						p.building == 'cabin' ? 'Cabane non gard&egrave;e' : '',
						p.highway == 'bus_stop' ? 'Arr&ecirc;t de bus' : '',
						p.waterway == 'water_point' ? 'Point d&apos;eau' : '',
						p.natural == 'spring' ? 'Source' : '',
						p.man_made == 'water_well' ? 'Puits' : '',
						p.shop ? 'alimentation' : '',
						typeof language[p.amenity] == 'string' ? language[p.amenity] : p.amenity,
						'</a>'
					].join(' '), [
						p.rooms ? p.rooms + ' chambres' : '',
						p.beds ? p.beds + ' lits' : '',
						p.place ? p.place + ' places' : '',
						p.capacity ? p.capacity + ' places' : '',
						p.ele ? parseInt(p.ele, 10) + 'm' : ''
					].join(' '),
					phone ? '&phone;<a title="Appeler" href="tel:' + phone.replace(/[^0-9\+]+/ig, '') + '">' + phone + '</a>' : '',
					p.email ? '&#9993;<a title="Envoyer un mail" href="mailto:' + p.email + '">' + p.email + '</a>' : '',
					p['addr:street'] ? address.join(' ') : '',
					p.website ? '&#8943;<a title="Voir le site web" target="_blank" href="' + p.website + '">' + (p.website.split('/')[2] || p.website) + '</a>' : '',
					p.opening_hours ? 'ouvert ' + p.opening_hours : '',
					p.note ? p.note : ''
				];

			// Other paramaters
			let done = [ // These that have no added value or already included
					'geometry,lon,lat,area,amenity,building,highway,shop,shelter_type,access,waterway,natural,man_made',
					'tourism,stars,rooms,place,capacity,ele,phone,contact,url,nodetype,name,alt_name,email,website',
					'opening_hours,description,beds,bus,note',
					'addr,housenumber,street,postcode,city,bus,public_transport,tactile_paving',
					'ref,source,wheelchair,leisure,landuse,camp_site,bench,network,brand,bulk_purchase,organic',
					'compressed_air,fuel,vending,vending_machine',
					'fee,heritage,wikipedia,wikidata,operator,mhs,amenity_1,beverage,takeaway,delivery,cuisine',
					'historic,motorcycle,drying,restaurant,hgv',
					'drive_through,parking,park_ride,supervised,surface,created_by,maxstay'
				].join(',').split(','),
				nbInternet = 0;
			for (let k in p) {
				const k0 = k.split(':')[0];
				if (!done.includes(k0))
					switch (k0) {
						case 'internet_access':
							if ((p[k] != 'no') && !(nbInternet++))
								popup.push('Accès internet');
							break;
						default:
							popup.push(k + ' : ' + p[k]);
					}
			}
			return ('<p>' + popup.join('</p><p>') + '</p>').replace(/<p>\s*<\/p>/ig, '');
		}
	}, options));
};

/**
 * Marker
 * Requires proj4.js for swiss coordinates
 * Requires 'myol:onadd' event
 */
//TODO BEST finger cursor when hover the target (select ?)
// map.getViewport().style.cursor = 'pointer'; / default
function marker(imageUrl, display, llInit, dragged) { // imageUrl, 'id-display', [lon, lat], bool
	const format = new ol.format.GeoJSON();
	let eljson, json, elxy;

	if (typeof display == 'string') {
		eljson = document.getElementById(display + '-json');
		elxy = document.getElementById(display + '-xy');
	}
	// Use json field values if any
	if (eljson)
		json = eljson.value || eljson.innerHTML;
	if (json)
		llInit = JSONparse(json).coordinates;

	// The marker layer
	const style = new ol.style.Style({
			image: new ol.style.Icon(({
				src: imageUrl,
				anchor: [0.5, 0.5]
			}))
		}),
		point = new ol.geom.Point(
			ol.proj.fromLonLat(llInit)
		),
		feature = new ol.Feature({
			geometry: point
		}),
		source = new ol.source.Vector({
			features: [feature]
		}),
		layer = new ol.layer.Vector({
			source: source,
			style: style,
			zIndex: 10
		});

	layer.once('myol:onadd', function(evt) {
		if (dragged) {
			// Drag and drop
			evt.target.map_.addInteraction(new ol.interaction.Modify({
				features: new ol.Collection([feature]),
				style: style
			}));
			point.on('change', function() {
				displayLL(this.getCoordinates());
			});
		}
	});

	// Specific Swiss coordinates EPSG:21781 (CH1903 / LV03)
	if (typeof proj4 == 'function') {
		proj4.defs('EPSG:21781', '+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=600000 +y_0=200000 +ellps=bessel +towgs84=660.077,13.551,369.344,2.484,1.783,2.939,5.66 +units=m +no_defs');
		ol.proj.proj4.register(proj4);
	}

	// Display a coordinate
	function displayLL(ll) {
		const ll4326 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:4326'),
			values = {
				lon: Math.round(ll4326[0] * 100000) / 100000,
				lat: Math.round(ll4326[1] * 100000) / 100000,
				json: JSON.stringify(format.writeGeometryObject(point, {
					featureProjection: 'EPSG:3857',
					decimals: 5
				}))
			};
		// Specific Swiss coordinates EPSG:21781 (CH1903 / LV03)
		if (typeof proj4 == 'function' &&
			ol.extent.containsCoordinate([664577, 5753148, 1167741, 6075303], ll)) { // Si on est dans la zone suisse EPSG:21781
			const c21781 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:21781');
			values.x = Math.round(c21781[0]);
			values.y = Math.round(c21781[1]);
		}
		if (elxy)
			elxy.style.display = values.x ? '' : 'none';

		// We insert the resulting HTML string where it is going
		for (let v in values) {
			const el = document.getElementById(display + '-' + v);
			if (el) {
				if (el.value !== undefined)
					el.value = values[v];
				else
					el.innerHTML = values[v];
			}
		}
	}

	// Display once at init
	displayLL(ol.proj.fromLonLat(llInit));

	// <input> coords edition
	layer.edit = function(evt, nol, projection) {
		let coord = ol.proj.transform(point.getCoordinates(), 'EPSG:3857', 'EPSG:' + projection); // La position actuelle de l'icone
		coord[nol] = parseFloat(evt.value); // On change la valeur qui a été modifiée
		point.setCoordinates(ol.proj.transform(coord, 'EPSG:' + projection, 'EPSG:3857')); // On repositionne l'icone
		layer.map_.getView().setCenter(point.getCoordinates());
	};

	layer.getPoint = function() {
		return point;
	};

	return layer;
}

/**
 * JSON.parse handling error
 */
//TODO BEST apply to format.readFeatures
function JSONparse(json) {
	let js;
	if (json)
		try {
			js = JSON.parse(json);
		} catch (returnCode) {
			if (returnCode)
				console.log(returnCode + ' parsing : "' + json + '" ' + new Error().stack);
		}
	return js;
}


/**
 * CONTROLS
 */
/**
 * Control buttons
 * Abstract definition to be used by other control buttons definitions
 */
var nextButtonPos = 2.5; // Top position of next button (em)

function controlButton(o) {
	const options = ol.assign({
			className: '', // {string} className of the button.
			activeBackgroundColor: 'white',
			onAdd: function() {},
		}, o),
		buttonElement = document.createElement('button'),
		divElement = document.createElement('div');

	const control = new ol.control.Control(ol.assign({
		element: divElement
	}, options));
	control.options_ = options;
	if (!control.options_.group) //TODO DELETE
		control.options_.group = control; // Main control of a group of controls

	buttonElement.innerHTML = options.label || ''; // {string} character to be displayed in the button
	buttonElement.addEventListener('click', function(evt) {
		evt.preventDefault();
		control.toggle();
	});

	divElement.appendChild(buttonElement);
	divElement.className = 'ol-button ol-unselectable ol-control ' + (options.className || '');
	divElement.title = options.title; // {string} displayed when the control is hovered.
	divElement.control_ = control; // For callback functions

	control.setMap = function(map) {
		//HACK get control on Map init to modify it
		ol.control.Control.prototype.setMap.call(this, map);

		control.map_ = map;
		options.onAdd(map);

		if (!map.getTargetElement().map_) { //Only once

			// Add ol.map object reference to the html #map element
			map.getTargetElement().map_ = map; //TODO ARCHI why ??? / Optim ?

			map.on('postrender', function() { // Each time we can
				map.getLayers().forEach(setMap);
				map.getControls().forEach(setMap);
			});

			//TODO ARCHI Function declarations should not be placed in blocks.
			function setMap(target) {
				// Store the map on it & advise it
				target.map_ = map;
				target.dispatchEvent('myol:onadd'); //TODO ARCHI replace by onAdd: function (){}
			}
		}
	};

	control.once('myol:onadd', function() { //TODO archi -> Put on setMap
		if (options.rightPosition) { // {float} distance to the top when the button is on the right of the map
			divElement.style.top = options.rightPosition + 'em';
			divElement.style.right = '.5em';
		} else {
			divElement.style.top = '.5em';
			divElement.style.left = (nextButtonPos += 2) + 'em';
		}
	});

	// Toggle the button status & aspect
	// In case of group buttons, set inactive the other one
	control.active = false;
	control.toggle = function(newActive) {
		control.map_.getControls().forEach(function(c) { //TODO DELETE
			if (c.options_ &&
				c.options_.group == options.group) { // For all controls in the same group
				const setActive =
					c != control ? false :
					typeof newActive != 'undefined' ? newActive :
					!c.active;

				if (setActive != c.active) {
					c.active = setActive;
					c.element.firstChild.style.backgroundColor = c.active ? c.options_.activeBackgroundColor : 'white';

					if (typeof c.options_.activate == 'function')
						c.options_.activate(c.active, buttonElement);
				}
			}
		});
	};

	return control;
}

/**
 * Layer switcher control
 * baseLayers {[ol.layer]} layers to be chosen one to fill the map.
 * Requires controlButton & controlPermanentCheckbox
 * Requires permanentCheckboxList
 */
//TODO accept null layer and not show it
function controlLayersSwitcher(options) {
	options = options || {};

	const button = controlButton({
		label: '&hellip;',
		className: 'switch-layer',
		title: 'Liste des cartes',
		rightPosition: 0.5
	});

	// Transparency slider (first position)
	const rangeElement = document.createElement('input');
	rangeElement.type = 'range';
	rangeElement.className = 'range-layer';
	rangeElement.oninput = displayLayerSelector;
	rangeElement.title = 'Glisser pour faire varier la tranparence';
	button.element.appendChild(rangeElement);

	// Layer selector
	const selectorElement = document.createElement('div');
	selectorElement.style.overflow = 'auto';
	selectorElement.title = 'Ctrl+click : multicouches';
	button.element.appendChild(selectorElement);

	button.once('myol:onadd', function(evt) {
		const map = evt.target.map_;

		// Base layers selector init
		for (let name in options.baseLayers) { // array of layers, mandatory, no default
			const baseElement = document.createElement('div');
			baseElement.innerHTML =
				'<input type="checkbox" name="baselayer" value="' + name + '">' +
				'<span title="">' + name + '</span>';
			selectorElement.appendChild(baseElement);
			map.addLayer(options.baseLayers[name]);
		}

		// Make the selector memorized by cookies
		controlPermanentCheckbox('baselayer', displayLayerSelector);

		// Hover the button open the selector
		button.element.firstElementChild.onmouseover = displayLayerSelector;

		// Click or change map size close the selector
		map.on(['click', 'change:size'], function() {
			displayLayerSelector();
		});

		// Leaving the map close the selector
		window.addEventListener('mousemove', function(evt) {
			const divRect = map.getTargetElement().getBoundingClientRect();
			if (evt.clientX < divRect.left || evt.clientX > divRect.right ||
				evt.clientY < divRect.top || evt.clientY > divRect.bottom)
				displayLayerSelector();
		});
	});

	function displayLayerSelector(evt, list) {
		// Check the first if none checked
		if (list && list.length === 0)
			selectorElement.firstChild.firstChild.checked = true;

		// Leave only one checked except if Ctrl key is on
		if (evt && evt.type == 'click' && !evt.ctrlKey) {
			const checkElements = document.getElementsByName('baselayer');
			for (let e = 0; e < checkElements.length; e++)
				if (checkElements[e] != evt.target)
					checkElements[e].checked = false;
		}

		list = permanentCheckboxList('baselayer');

		// Refresh layers visibility & opacity
		for (let layerName in options.baseLayers) {
			options.baseLayers[layerName].setVisible(list.indexOf(layerName) !== -1);
			options.baseLayers[layerName].setOpacity(0);
		}
		options.baseLayers[list[0]].setOpacity(1);
		if (list.length >= 2)
			options.baseLayers[list[1]].setOpacity(rangeElement.value / 100);

		// Refresh control button, range & selector
		button.element.firstElementChild.style.display = evt ? 'none' : '';
		rangeElement.style.display = evt && list.length > 1 ? '' : 'none';
		selectorElement.style.display = evt ? '' : 'none';
		selectorElement.style.maxHeight = (button.map_.getTargetElement().clientHeight - 58 - (list.length > 1 ? 24 : 0)) + 'px';
	}

	return button;
}

/**
 * Permalink control
 * "map" url hash or cookie = {map=<ZOOM>/<LON>/<LAT>/<LAYER>}
 */
function controlPermalink(o) {
	const options = ol.assign({
			hash: '?', // {?, #} the permalink delimiter
			visible: true, // {true | false} add a controlPermalink button to the map.
			init: true // {true | false} use url hash or "controlPermalink" cookie to position the map.
		}, o),
		divElement = document.createElement('div'),
		aElement = document.createElement('a'),
		control = new ol.control.Control({
			element: divElement,
			render: render
		});
	this.options_ = options;

	let params = (location.hash + location.search).match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Priority to the hash
		document.cookie.match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Then the cookie
		(options.initialFit || '6/2/47').match(/([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/); // Url arg format : <ZOOM>/<LON>/<LAT>/<LAYER>

	if (options.visible) {
		divElement.className = 'ol-permalink';
		aElement.innerHTML = 'Permalink';
		aElement.title = 'Generate a link with map zoom & position';
		divElement.appendChild(aElement);
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
					parseInt(view.getZoom()),
					Math.round(ll4326[0] * 100000) / 100000,
					Math.round(ll4326[1] * 100000) / 100000
				];

			aElement.href = options.hash + 'map=' + newParams.join('/');
			document.cookie = 'map=' + newParams.join('/') + ';path=/';
		}
	}

	return control;
}

/**
 * GPS control
 * Requires controlButton
 */
//TODO tap on map = distance from GPS calculation
function controlGPS(options) {
	options = options || {};

	// Vérify if geolocation is available
	if (!navigator.geolocation ||
		!window.location.href.match(/https|localhost/i))
		return new ol.control.Control({ //HACK No button
			element: document.createElement('div'),
		});

	let map, view,
		gps = {}, // Mem last sensors values
		compas = {},

		// The graticule
		graticule = new ol.Feature(),
		northGraticule = new ol.Feature(),
		layer = new ol.layer.Vector({
			source: source = new ol.source.Vector({
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
		}),

		// The control button
		button = controlButton({
			className: 'gps-button',
			title: 'Centrer sur la position GPS',
			activeBackgroundColor: '#ef3',
			activate: function(active) {
				//TODO 3 steps activation : position + reticule + orientation / reticule / none
				//TODO freeze rotation when inactive
				//TODO block screen standby

				// Toggle reticule, position & rotation
				geolocation.setTracking(active);
				if (active)
					map.addLayer(layer);
				else {
					map.removeLayer(layer);
					view.setRotation(0);
				}
			}
		}),

		// Interface with the GPS system
		geolocation = new ol.Geolocation({
			trackingOptions: {
				enableHighAccuracy: true
			}
		});

	northGraticule.setStyle(new ol.style.Style({
		stroke: new ol.style.Stroke({
			color: '#c00',
			lineDash: [16, 14],
			width: 1
		})
	}));

	button.once('myol:onadd', function() {
		map = button.getMap();
		view = map.getView();

		map.on('moveend', renderReticule);
	});

	geolocation.on('error', function(error) {
		alert('Geolocation error: ' + error.message);
	});

	geolocation.on('change', function() {
		gps.position = ol.proj.fromLonLat(this.getPosition());
		gps.accuracyGeometry = this.getAccuracyGeometry().transform('EPSG:4326', 'EPSG:3857');
		/*//TODO Firefox Update delta only over some speed
		if (!navigator.userAgent.match('Firefox'))

		if (this.getHeading()) {
			gps.heading = -this.getHeading(); // Delivered radians, clockwize
			gps.delta = gps.heading - compas.heading; // Freeze delta at this time bewteen the GPS heading & the compas
		} */

		renderReticule();
	});

	// Browser heading from the inertial sensors
	window.addEventListener(
		'ondeviceorientationabsolute' in window ?
		'deviceorientationabsolute' : // Gives always the magnetic north
		'deviceorientation', // Gives sometime the magnetic north, sometimes initial device orientation
		function(evt) {
			const heading = evt.alpha || evt.webkitCompassHeading; // Android || iOS
			if (heading)
				compas = {
					heading: Math.PI / 180 * (heading - screen.orientation.angle), // Delivered ° reverse clockwize
					absolute: evt.absolute // Gives initial device orientation | magnetic north
				};

			renderReticule();
		}
	);

	function renderReticule() {
		if (button.active && gps) {
			if (!graticule.getGeometry()) // Only once the first time the feature is enabled
				view.setZoom(17); // Zoom on the area

			view.setCenter(gps.position);

			// Estimate the viewport size
			let hg = map.getCoordinateFromPixel([0, 0]),
				bd = map.getCoordinateFromPixel(map.getSize()),
				far = Math.hypot(hg[0] - bd[0], hg[1] - bd[1]) * 10;

			// Redraw the graticule
			graticule.setGeometry(new ol.geom.GeometryCollection([
				gps.accuracyGeometry, // The accurate circle
				new ol.geom.MultiLineString([ // The graticule
					[
						[gps.position[0], gps.position[1]],
						[gps.position[0], gps.position[1] - far]
					],
					[
						[gps.position[0], gps.position[1]],
						[gps.position[0] - far, gps.position[1]]
					],
					[
						[gps.position[0], gps.position[1]],
						[gps.position[0] + far, gps.position[1]]
					]
				])
			]));
			northGraticule.setGeometry(new ol.geom.GeometryCollection([
				new ol.geom.MultiLineString([ // Color north in red
					[
						[gps.position[0], gps.position[1]],
						[gps.position[0], gps.position[1] + far]
					]
				])
			]));

			// Map orientation (Radians and reverse clockwize)
			//TODO keep orientation when stop gps tracking
			if (compas.absolute)
				view.setRotation(compas.heading, 0); // Use magnetic compas value
			/*//TODO Firefox use delta if speed > ??? km/h
					compas.absolute ?
					compas.heading : // Use magnetic compas value
					compas.heading && gps.delta ? compas.heading + gps.delta : // Correct last GPS heading with handset moves
					0
				); */

			// Optional callback function
			if (typeof options.callBack == 'function') // Default undefined
				options.callBack(gps.position);
		}
	}

	return button;
}

/**
 * Control to displays set preload of 4 upper level tiles if we are on full screen mode
 * This prepares the browser to become offline on the same session
 * Requires controlButton
 */
function controlPreLoad() {
	const divElement = document.createElement('div'),
		button = new ol.control.Control({
			element: divElement
		});

	button.once('myol:onadd', function(evt) {
		const map = evt.target.map_;

		map.on('change:size', function() {
			const fs = document.webkitIsFullScreen || document.mozFullScreen || document.msFullscreenElement || document.fullscreenElement;

			map.getLayers().forEach(function(layer) {
				if (layer.type == 'TILE')
					layer.setPreload(fs ? 4 : 0);
			});
		});
	});

	return button;
}

/**
 * Control to displays the length of a line overflown
 * Requires controlButton
 */
function controlLengthLine() {
	const divElement = document.createElement('div'),
		button = new ol.control.Control({
			element: divElement
		});

	button.once('myol:onadd', function(evt) {
		const map = evt.target.map_;

		divElement.className = 'ol-length-line';

		map.on('pointermove', function(evtMove) {
			divElement.innerHTML = ''; // Clear the measure if hover no feature

			map.forEachFeatureAtPixel(evtMove.pixel, calculateLength, {
				hitTolerance: 6
			});
		});
	});

	function calculateLength(feature) {
		if (!feature)
			return false;

		const length = ol.sphere.getLength(feature.getGeometry());
		if (length >= 100000)
			divElement.innerHTML = (Math.round(length / 1000)) + ' km';
		else if (length >= 10000)
			divElement.innerHTML = (Math.round(length / 100) / 10) + ' km';
		else if (length >= 1000)
			divElement.innerHTML = (Math.round(length / 10) / 100) + ' km';
		else if (length >= 1)
			divElement.innerHTML = (Math.round(length)) + ' m';
		return false; // Continue detection (for editor that has temporary layers)
	}

	return button;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//TODO BUG have a maximum zoom (1 point makes the map invisible)
function controlLoadGPX(o) {
	const options = ol.assign({
			label: '&uArr;',
			title: 'Visualiser un fichier GPX sur la carte',
			activate: function() {
				inputElement.click();
			},
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3
				})
			})
		}, o),
		inputElement = document.createElement('input'),
		format = new ol.format.GPX(),
		reader = new FileReader(),
		button = controlButton(options);

	inputElement.type = 'file';
	inputElement.addEventListener('change', function() {
		reader.readAsText(inputElement.files[0]);
	});

	reader.onload = function() {
		const map = button.getMap(),
			features = format.readFeatures(reader.result, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			}),
			added = map.dispatchEvent({
				type: 'myol:onfeatureload',
				features: features
			});

		if (added !== false) { // If one used the feature
			// Display the track on the map
			const source = new ol.source.Vector({
					format: format,
					features: features
				}),
				vector = new ol.layer.Vector({
					source: source,
					style: options.style
				});
			button.getMap().addLayer(vector);
			button.getMap().getView().fit(source.getExtent());
		}

		// Zoom the map on the added features
		const extent = ol.extent.createEmpty();
		for (let f in features)
			ol.extent.extend(extent, features[f].getGeometry().getExtent());
		button.getMap().getView().fit(extent);
	};

	return button;
}

/**
 * GPX file downloader control
 * Requires controlButton
 */
//TODO BUG do not export points
function controlDownloadGPX(o) {
	const options = ol.assign({
			label: '&dArr;',
			title: 'Obtenir un fichier GPX contenant les éléments visibles dans la fenêtre.',
			fileName: 'trace', //TODO BEST give a name according to the context
			extraMetaData: '' // Additional tags to the GPX file header
		}, o),
		hiddenElement = document.createElement('a');
	let button; //TODO ARCHI

	//HACK for Moz
	hiddenElement.target = '_blank';
	hiddenElement.style = 'display:none;opacity:0;color:transparent;';
	(document.body || document.documentElement).appendChild(hiddenElement);

	options.activate = function(evt) { // Callback at activation / desactivation, mandatory, no default
		let features = [],
			extent = button.map_.getView().calculateExtent();

		// Get all visible features
		button.map_.getLayers().forEach(function(layer) {
			if (layer.getSource() && layer.getSource().forEachFeatureInExtent) // For vector layers only
				layer.getSource().forEachFeatureInExtent(extent, function(feature) {
					features.push(feature);
				});
		});

		// Get a MultiLineString geometry with just lines fragments
		// geometries are output as routes (<rte>) and MultiLineString as tracks (<trk>)
		const multiLineString = new ol.Feature({
			geometry: new ol.geom.MultiLineString(
				sortFeatures(features).lines
			),
			name: options.fileName
		});

		// Write in GPX format
		const gpx = new ol.format.GPX().writeFeatures([multiLineString], {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
				decimals: 5
			}),
			file = new Blob([gpx
				.replace(/>/g, ">\n")
				.replace("<name>\n", "<time>" + new Date().toISOString() + "</time>\n" + options.extraMetaData + "<name>")
			], {
				type: 'application/gpx+xml'
			});

		//HACK for IE/Edge
		if (typeof navigator.msSaveOrOpenBlob !== 'undefined')
			return navigator.msSaveOrOpenBlob(file, options.fileName);
		else if (typeof navigator.msSaveBlob !== 'undefined')
			return navigator.msSaveBlob(file, options.fileName);

		hiddenElement.href = URL.createObjectURL(file);
		hiddenElement.download = options.fileName + '.gpx';

		// Simulate the click & download the .gpx file
		if (typeof hiddenElement.click === 'function')
			hiddenElement.click();
		else
			hiddenElement.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			}));
	};

	button = controlButton(options);
	return button;
}

/**
 * Geocoder
 * Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
 */
function geocoder() {
	// Vérify if geocoder is available (not in IE)
	const ua = navigator.userAgent;
	if (typeof Geocoder != 'function' ||
		ua.indexOf("MSIE ") > -1 || ua.indexOf("Trident/") > -1)
		return new ol.control.Control({
			element: document.createElement('div'), //HACK No button
		});

	const gc = new Geocoder('nominatim', {
		provider: 'osm',
		lang: 'FR',
		keepOpen: true,
		placeholder: 'Recherche sur la carte' // Initialization of the input field
	});
	gc.container.title = 'Recherche sur la carte';
	gc.container.style.top = '.5em';
	gc.container.style.left = (nextButtonPos += 2) + 'em';

	return gc;
}

/**
 * Print control
 */
function controlPrint() {
	return controlButton({
		className: 'print-button',
		activate: printMap,
		question: '<p>Paysage : ' +
			'<span onclick="printMap("landscape",this)" title="Imprimer en mode paysage">100 dpi</span> / ' +
			'<span onclick="printMap("landscape",this,200)" title="Imprimer en mode paysage 200 dpi (lent)">200 dpi</span>' +
			'</p> <p>Portrait : ' +
			'<span onclick="printMap("portrait",this)" title="Imprimer en mode portrait">100 dpi</span> / ' +
			'<span onclick="printMap("portrait",this,200)" title="Imprimer en mode portrait 200 dpi (lent)">200 dpi</span>' +
			'</p> ',
		title: 'Imprimer la carte'
	});
}

//TODO add scale in printed maps
//TODO ARCHI include in controlPrint
function printMap(orientation, el, resolution) {
	// Search control div element in the hierarchy
	while (el.parentElement && !el.control_)
		el = el.parentElement;

	// Get existing context
	const map = el.control_.map_,
		mapEl = map.getTargetElement(),
		mapCookie = document.cookie.match('map=([^;]*)');

	// Hide other elements than the map
	document.body.style.cursor = "wait";
	while (document.body.firstChild)
		document.body.removeChild(document.body.firstChild);

	// Raises the map to the top level
	document.body.appendChild(mapEl);
	mapEl.style.width = '100%';
	mapEl.style.height = '100%';

	// Hide controls
	const controls = document.getElementsByClassName('ol-overlaycontainer-stopevent');
	Array.prototype.filter.call(controls, function(el) {
		el.style.display = 'none';
	});

	// Add page style for printing
	const style = document.createElement('style');
	document.head.appendChild(style);
	style.appendChild(document.createTextNode(
		"@page{size:A4;margin:0;size:" + (orientation == 'portrait' ? 'portrait' : 'landscape') + "}"
	));

	map.once('rendercomplete', function(event) {
		/*//TODO attendre fin du chargement de toutes les couches !
		map.getLayers().forEach(function(layer) {
			if(layer.getSource())
				;
		});
		*/

		//TODO BUG Chrome puts 3 pages in landscape
		//TODO IE11 very big margin
		window.print();
		document.cookie = 'map=' + mapCookie + ';path=/';
		window.location.href = window.location.href;
	});

	// Set print size, which will render the new map
	const dim = orientation == 'portrait' ? [210, 297] : [297, 210],
		printSize = [
			Math.round(dim[0] * (resolution || 100) / 25.4),
			Math.round(dim[1] * (resolution || 100) / 25.4)
		],
		extent = map.getView().calculateExtent(map.getSize());
	map.setSize(printSize);
	map.getView().fit(extent, {
		size: printSize
	});
}


/**
 * Line & Polygons Editor
 * Requires controlButton
 */
function layerEdit(o) {
	const options = ol.assign({
			geoJsonId: 'editable-json',
		}, o),
		format = new ol.format.GeoJSON(),
		geoJsonEl = document.getElementById(options.geoJsonId), // Read data in an html element
		features = format.readFeatures(
			JSONparse(geoJsonEl.value || '{"type":"FeatureCollection","features":[]}'), {
				featureProjection: 'EPSG:3857' // Read/write data as ESPG:4326 by default
			}
		),
		source = new ol.source.Vector({
			features: features,
			wrapX: false,
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 20,
		});

	source.save = function() {
		// Save lines in <EL> as geoJSON at every change
		geoJsonEl.value = format.writeFeatures(features, {
			featureProjection: 'EPSG:3857',
			decimals: 5
		});
	}

	/*
		source.on(['change'], function(e) { // A feature has been added or changed
		});
	*/

	layer.once('prerender', function(evt) { //TODO ARCHI généraliser
		const map = layer.map_;

		//HACK Avoid zooming when you leave the mode by doubleclick
		map.getInteractions().getArray().forEach(function(i) {
			if (i instanceof ol.interaction.DoubleClickZoom)
				map.removeInteraction(i);
		});

		options.controls.forEach(function(c) {
			var control = c(ol.assign({
				group: layer,
				layer: layer,
				source: source,
				activeBackgroundColor: '#ef3',
				//			style: options.editStyle
				activate: function(active) {
					control.options_.interaction.setActive(active);
				},
			}, options));
			control.options_.interaction.setActive(false);
			map.addInteraction(control.options_.interaction);
			map.addControl(control);
		});
	});

	/*
		// Add features loaded from GPX file
		map.on('myol:onfeatureload', function(evt) {
			source.addFeatures(evt.features);
			//			cleanAndSave(source);
			return false;
		});

		// Snap on features external to the editor
		if (options.snapLayers) // Optional
			options.snapLayers.forEach(function(layer) {
				layer.getSource().on('change', function() {
					const fs = this.getFeatures();
					for (let f in fs)
						snap.addFeature(fs[f]);
				});
			});
	*/

	return layer;
}

function controlModify(options) {
	const modify = new ol.interaction.Modify(options);

	modify.on('modifyend', function(evt) {
		const map = evt.target.map_;

		//		map.removeInteraction(hover);

		//TODO BUG BEST do not delete the feature if you point to a summit
		if (evt.mapBrowserEvent.originalEvent.altKey) {
			// altKey + ctrlKey : delete feature
			if (evt.mapBrowserEvent.originalEvent.ctrlKey) {
				const selectedFeatures = map.getFeaturesAtPixel(evt.mapBrowserEvent.pixel, {
					hitTolerance: 6,
					layerFilter: function(l) {
						return l.ol_uid == options.layer.ol_uid;
					}
				});
				for (let f in selectedFeatures)
					options.source.removeFeature(selectedFeatures[f]); // We delete the selected feature
			}
			// Other modify actions : altKey + click on a segment = delete the segment
			else if (evt.target.vertexFeature_) // 
				return cleanAndSave(options.source, evt.target.vertexFeature_.getGeometry().getCoordinates());
		}

		cleanAndSave(options.source);
	});

	return controlButton(ol.assign({
		interaction: modify,
		label: 'M',
		title: 'Activer "M" (couleur jaune) puis\n' +
			'Cliquer et déplacer un sommet pour modifier une ligne ou un polygone\n' +
			'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
			'Alt+cliquer sur un sommet pour le supprimer\n' +
			'Alt+cliquer  sur un segment à supprimer dans une ligne pour la couper\n' +
			'Alt+cliquer  sur un segment à supprimer d‘un polygone pour le transformer en ligne\n' +
			'Joindre les extrémités deux lignes pour les fusionner\n' +
			'Joindre les extrémités d‘une ligne pour la transformer en polygone\n' +
			'Ctrl+Alt+cliquer sur un côté d‘une ligne ou d‘un polygone pour les supprimer',
	}, options));
}

function controlDrawLine(options) {
	const draw = new ol.interaction.Draw(ol.assign({
			type: 'LineString',
		}, options)),
		button = controlButton(ol.assign({
			interaction: draw,
			label: 'L',
			title: 'Activer "L" puis\n' +
				'Cliquer sur la carte et sur chaque point désiré pour dessiner une ligne,\n' +
				'double cliquer pour terminer.\n' +
				'Cliquer sur une extrémité d‘une ligne pour l‘étendre',
		}, options));;

	draw.on(['drawend'], function(evt) {
		cleanAndSave(options.source);
		button.toggle(false);
	});

	return button
}

function controlDrawPolygon(options) {
	return controlDrawLine(ol.assign({
		type: 'Polygon',
		label: 'P',
		title: 'Activer "P" puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner un polygone,\n' +
			'double cliquer pour terminer.\n' +
			'Si le nouveau polygone est entièrement compris dans un autre, il crée un "trou".',
	}, options));
}

// Sort Points / Lines (Polygons are treated as Lines)
function cleanAndSave(source, pointerPosition) {

	return source.save(); //TODO ............

	// Get flattened list of multipoints coords
	//TODO BEST option not to be able to cut a polygon
	let lines = sortFeatures(source.getFeatures(), pointerPosition).lines,
		polys = [];

	source.clear();

	for (let a = 0; a < lines.length; a++) {
		// Exclude 1 coord features (points)
		if (lines[a] && lines[a].length < 2)
			lines[a] = null;

		// Convert closed lines into polygons
		if (compareCoords(lines[a])) {
			polys.push([lines[a]]);
			lines[a] = null;
		}

		// Merge lines having a common end
		for (let b = 0; b < a; b++) { // Once each combination
			const m = [a, b];
			for (let i = 4; i; i--) // 4 times
				if (lines[m[0]] && lines[m[1]]) {
					// Shake lines end to explore all possibilities
					m.reverse();
					lines[m[0]].reverse();
					if (compareCoords(lines[m[0]][lines[m[0]].length - 1], lines[m[1]][0])) {

						// Merge 2 lines matching ends
						lines[m[0]] = lines[m[0]].concat(lines[m[1]]);
						lines[m[1]] = 0;

						// Restart all the loops
						a = -1;
						break;
					}
				}
		}
	}

	// Makes holes if a polygon is included in a biggest one
	for (let p1 in polys)
		if (polys[p1]) {
			const fs = new ol.geom.Polygon(polys[p1]);
			for (let p2 in polys)
				if (p1 != p2 &&
					polys[p2]) {
					let intersects = true;
					for (let c in polys[p2][0])
						if (!fs.intersectsCoordinate(polys[p2][0][c]))
							intersects = false;
					if (intersects) {
						polys[p1].push(polys[p2][0]);
						polys[p2] = null;
					}
				}
		}

	// Recreate modified features
	for (let l in lines)
		if (lines[l]) {
			source.addFeature(new ol.Feature({
				geometry: new ol.geom.LineString(lines[l])
			}));
		}
	for (let p in polys)
		if (polys[p])
			source.addFeature(new ol.Feature({
				geometry: new ol.geom.Polygon(polys[p])
			}));
}

function sortFeatures(features, pointerPosition) {
	let fs = {
		lines: [],
		polys: [],
		points: []
	};

	for (let f in features)
		if (typeof features[f].getGeometry().getGeometries == 'function') { // GeometryCollection
			const geometries = features[f].getGeometry().getGeometries();
			for (let g in geometries)
				flatCoord(fs.lines, geometries[g].getCoordinates(), pointerPosition);
		} else if (features[f].getGeometry().getType().match(/point$/i))
		fs.points.push(features[f]);
	else
		flatCoord(fs.lines, features[f].getGeometry().getCoordinates(), pointerPosition);

	return fs;
}

// Get all lines fragments at the same level & split aif one point = pointerPosition
function flatCoord(existingCoords, newCoords, pointerPosition) {
	if (typeof newCoords[0][0] == 'object')
		for (let c1 in newCoords)
			flatCoord(existingCoords, newCoords[c1], pointerPosition);
	else {
		existingCoords.push([]); // Increment existingCoords array
		for (let c2 in newCoords)
			if (pointerPosition && compareCoords(newCoords[c2], pointerPosition)) {
				existingCoords.push([]); // & increment existingCoords array
			} else
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


/**
 * Controls examples
 */
function controlsCollection(options) {
	options = options || {};
	if (!options.baseLayers)
		options.baseLayers = layersCollection(options.geoKeys);

	return [
		controlLayersSwitcher(ol.assign({
			baseLayers: options.baseLayers,
			geoKeys: options.geoKeys
		}, options.controlLayersSwitcher)),
		new ol.control.ScaleLine(),
		new ol.control.Attribution({
			collapsible: false // Attribution always open
		}),
		new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(5),
			projection: 'EPSG:4326',
			className: 'ol-coordinate',
			undefinedHTML: String.fromCharCode(0)
		}),
		controlLengthLine(),
		controlPermalink(options.controlPermalink),
		new ol.control.Zoom({
			zoomOutLabel: '-'
		}),
		new ol.control.FullScreen({
			label: '',
			labelActive: '',
			tipLabel: 'Plein écran'
		}),
		controlPreLoad(),
		geocoder(),
		controlGPS(options.controlGPS),
		controlLoadGPX(),
		controlDownloadGPX(options.controlDownloadGPX),
		controlPrint()
	];
}

/**
 * Tile layers examples
 * Requires many
 */
function layersCollection(keys) {
	return {
		'OpenTopo': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'OSM outdoors': layerThunderforest(keys.thunderforest, 'outdoors'),
		'OSM-FR': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'MRI': layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		'Hike & Bike': layerOSM(
			'http://{a-c}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
			'<a href="http://www.hikebikemap.org/">hikebikemap.org</a>'
		), // Not on https
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Kompas': layerKompass('KOMPASS'),
		'OSM cycle': layerThunderforest(keys.thunderforest, 'cycle'),
		'OSM landscape': layerThunderforest(keys.thunderforest, 'landscape'),
		'OSM transport': layerThunderforest(keys.thunderforest, 'transport'),
		'OSM trains': layerThunderforest(keys.thunderforest, 'pioneer'),
		'OSM villes': layerThunderforest(keys.thunderforest, 'neighbourhood'),
		'OSM contraste': layerThunderforest(keys.thunderforest, 'mobile-atlas'),

		'IGN': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN TOP 25': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		'IGN classique': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'IGN photos': layerIGN(keys.ign, 'ORTHOIMAGERY.ORTHOPHOTOS'),
		//403	'IGN Spot': layerIGN(keys.ign, 'ORTHOIMAGERY.ORTHO-SAT.SPOT.2017', 'png'),
		//Double		'SCAN25TOUR': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR'),
		'IGN 1950': layerIGN(keys.ign, 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965', 'png'),
		'Cadastre': layerIGN(keys.ign, 'CADASTRALPARCELS.PARCELS', 'png'),
		//Le style normal n'est pas geré	'Cadast.Exp': layerIGN(keys.ign, 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'png'),
		'Etat major': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40'),
		'ETATMAJOR10': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR10'),
		'IGN plan': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.PLANIGN'),
		'IGN route': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.ROUTIER'),
		'IGN noms': layerIGN(keys.ign, 'GEOGRAPHICALNAMES.NAMES', 'png'),
		'IGN rail': layerIGN(keys.ign, 'TRANSPORTNETWORKS.RAILWAYS', 'png'),
		'IGN forêt': layerIGN(keys.ign, 'LANDCOVER.FORESTAREAS', 'png'),
		'IGN limites': layerIGN(keys.ign, 'ADMINISTRATIVEUNITS.BOUNDARIES', 'png'),
		//Le style normal n'est pas geré	'SHADOW': layerIGN(keys.ign, 'ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW', 'png'),
		//Le style normal n'est pas geré	'PN': layerIGN(keys.ign, 'PROTECTEDAREAS.PN', 'png'),
		'PNR': layerIGN(keys.ign, 'PROTECTEDAREAS.PNR', 'png'),
		//403	'Avalanches':	layerIGN('IGN avalanches', keys.ign,'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN'),

		'Swiss': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Swiss photo': layerSwissTopo('ch.swisstopo.swissimage'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Espagne photo': layerSpain('pnoa-ma', 'OI.OrthoimageCoverage'),
		'Italie': layerIGM(),
		'Angleterre': layerOS(keys.bing),
		'Bing': layerBing(keys.bing, 'Road'),
		'Bing photo': layerBing(keys.bing, 'Aerial'),
		'Bing mixte': layerBing(keys.bing, 'AerialWithLabels'),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google photo': layerGoogle('s'),
		'Google hybrid': layerGoogle('s,h'),
		'Stamen': layerStamen('terrain'),
		'Watercolor': layerStamen('watercolor'),
		'Neutre': new ol.layer.Tile()
	};
}