/*!
 * OPENLAYERS V5 ADAPTATION - https://openlayers.org/
 * (C) Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 *
 * I have designed this openlayers adaptation as simple as possible to make it maintained with basics JS skills
 * You only have to include openlayers/dist .js & .css files & my 2 & that's it !
 * No classes, no jquery, no es6 modules, no nodejs build nor minification, no npm repository, ... only a pack of JS functions & CSS
 * I know, I know, this is not up to date way of programming but thtat's my choice & you are free to take it, modifiy & adapt as you wish
 */
//TODO END test with libs non debug / on mobile
//TODO END http://jsbeautifier.org/ & http://jshint.com
//TODO BEST Site off line, application

/**
 * HACK send 'onAdd' event to layers when added to a map
 */
ol.Map.prototype.renderFrame_ = function(time) {
	var layers = this.getLayerGroup().getLayerStatesArray();
	for (var i = 0, ii = layers.length; i < ii; ++i)
		if (!layers[i].layer.map_) { // Only once
			layers[i].layer.map_ = this; // Store the map where the layer is rendered
			layers[i].layer.dispatchEvent('onadd');
		}

	ol.PluggableMap.prototype.renderFrame_.call(this, time);
};

//***************************************************************
// TILE LAYERS
//***************************************************************
//BEST Superzoom
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
 * Kompas (austria)
 * Requires layerOSM
 */
function layerKompass(layer) {
	return layerOSM(
		'http://ec{0-3}.cdn.ecmaps.de/WmsGateway.ashx.jpg?' + // Not available via https
		'Experience=ecmaps&MapStyle=' + layer + '&TileX={x}&TileY={y}&ZoomLevel={z}',
		'<a href="http://www.kompass.de/livemap/">KOMPASS</a>'
	);
}

/**
 * Thunderforest
 * Requires layerOSM
 * Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
 */
function layerThunderforest(layer, key) {
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
			url: '//mt{0-3}.google.com/vt/lyrs=' + layer + '&x={x}&y={y}&z={z}',
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
 * Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
 */
function layerIGN(key, layer, format) {
	var IGNresolutions = [],
		IGNmatrixIds = [];
	for (var i = 0; i < 18; i++) {
		IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
		IGNmatrixIds[i] = i.toString();
	}
	var IGNtileGrid = new ol.tilegrid.WMTS({
		origin: [-20037508, 20037508],
		resolutions: IGNresolutions,
		matrixIds: IGNmatrixIds
	});

	return new ol.layer.Tile({
		source: new ol.source.WMTS({
			url: '//wxs.ign.fr/' + key + '/wmts',
			layer: layer,
			matrixSet: 'PM',
			format: format || 'image/jpeg',
			tileGrid: IGNtileGrid,
			style: 'normal',
			attributions: '<a href="http://www.geoportail.fr/" target="_blank">' +
				'<img src="https://api.ign.fr/geoportail/api/js/latest/theme/geoportal/img/logo_gp.gif"></a>'
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
 * Requires 'onadd' layer event
 */
function layerTileIncomplete(extent, sources) {
	var layer = new ol.layer.Tile(),
		backgroundSource = new ol.source.Stamen({
			layer: 'terrain'
		});
	layer.on('onadd', function(event) {
		event.target.map_.getView().on('change', change);
		change(); // At init
	});

	// Zoom has changed
	function change() {
		var view = layer.map_.getView(),
			center = view.getCenter(),
			currentResolution = 999999; // Init loop at max resolution
		sources[currentResolution] = backgroundSource; // Add extrabound source on the top of the list

		// Search for sources according to the map resolution
		if (center &&
			ol.extent.intersects(extent, view.calculateExtent(layer.map_.getSize())))
			currentResolution = Object.keys(sources).filter(function(event) { // HACK : use of filter to perform an action
				return event > view.getResolution();
			})[0];

		// Update layer if necessary
		if (layer.getSource() != sources[currentResolution])
			layer.setSource(sources[currentResolution]);
	}

	return layer;
}

/**
 * Swisstopo https://api.geo.admin.ch/
 * Register your domain: https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
 * Requires layerTileIncomplete
 */
function layerSwissTopo(layer) {
	var projectionExtent = ol.proj.get('EPSG:3857').getExtent(),
		resolutions = [],
		matrixIds = [];
	for (var r = 0; r < 18; ++r) {
		resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}
	var tileGrid = new ol.tilegrid.WMTS({
		origin: ol.extent.getTopLeft(projectionExtent),
		resolutions: resolutions,
		matrixIds: matrixIds
	});

	return layerTileIncomplete([664577, 5753148, 1167741, 6075303], {
		500: new ol.source.WMTS(({
			crossOrigin: 'anonymous',
			url: '//wmts2{0-4}.geo.admin.ch/1.0.0/' + layer + '/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
			tileGrid: tileGrid,
			requestEncoding: 'REST',
			attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>'
		}))
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

	return layerTileIncomplete([660124, 4131313, 2113957, 5958411], { // EPSG:6875 (Italie)
		100: igmSource('IGM_250000', 'CB.IGM250000'),
		25: igmSource('IGM_100000', 'MB.IGM100000'),
		5: igmSource('IGM_25000', 'CB.IGM25000')
	});
}

//BEST éviter d'appeler à l'init https://dev.virtualearth.net sur les cartes BING
/**
 * Ordnance Survey : Great Britain
 * Requires layerTileIncomplete
 */
function layerOS(key) {
	return layerTileIncomplete([-841575, 6439351, 198148, 8589177], { // EPSG:27700 (G.B.)
		100: new ol.source.BingMaps({
			imagerySet: 'ordnanceSurvey',
			key: key
		})
	});
}

/**
 * Bing (Microsoft)
 * Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
 */
function layerBing(layer, key) {
	return new ol.layer.Tile({
		source: new ol.source.BingMaps({
			imagerySet: layer,
			key: key,
		})
	});
}

//***************************************************************
// VECTORS, GEOJSON & AJAX LAYERS
//***************************************************************
/**
 * Mem in cookies the checkbox content with name="name"
 */
//TODO BEST when unchecked, remove cookie
function controlPermanentCheckbox(name, callback) {
	var checkElements = document.getElementsByName(name),
		cookie =
		location.hash.match('map-' + name + '=([^#,&;]*)') || // Priority to the hash
		document.cookie.match('map-' + name + '=([^;]*)'); // Then the cookie

	for (var e = 0; e < checkElements.length; e++) {
		checkElements[e].addEventListener('click', permanentCheckboxClick); // Attach the action

		if (cookie) // Set the checks accordingly with the cookie
			checkElements[e].checked = cookie[1].split(',').indexOf(checkElements[e].value) !== -1;
	}

	// Call callback once at the init
	callback(null, permanentCheckboxList(name));

	function permanentCheckboxClick(event) {
		var list = permanentCheckboxList(name, event);
		if (typeof callback == 'function')
			callback(event, list);
	}
}

function permanentCheckboxList(name, event) {
	var checkElements = document.getElementsByName(name),
		allChecks = [];

	for (var e = 0; e < checkElements.length; e++) {
		// Select/deselect all (clicking an <input> without value)
		if (event) {
			if (event.target.value == 'on') // The Select/deselect has a default value = "on"
				checkElements[e].checked = event.target.checked; // Check all if "all" is clicked
			else if (checkElements[e].value == 'on')
				checkElements[e].checked = false; // Reset the "all" checks if another check is clicked
		}

		// Get status of all checks
		if (checkElements[e].checked) // List checked elements
			allChecks.push(checkElements[e].value);
	}

	// Mem in a cookie
	document.cookie = 'map-' + name + '=' + allChecks.join(',') + ';path=/';

	return allChecks; // Returns list of checked values or ids
}

/**
 * BBOX dependant strategy
 * Same that bbox but reloads if we zoom in because we delivered more points when zoom in
 * Returns {ol.loadingstrategy} to be used in layer definition
 */
ol.loadingstrategy.bboxDependant = function(extent, resolution) {
	if (this.resolution != resolution) // Force loading when zoom in
		this.clear();
	this.resolution = resolution; // Mem resolution for further requests
	return [extent];
};

/**
 * GeoJson POI layer
 * Requires 'onadd' layer event
 * Requires ol.loadingstrategy.bboxDependant & controlPermanentCheckbox
 */
//TODO BUG Uncaught SyntaxError: Unexpected token < in JSON at position 46735
function layerVectorURL(options) {
	var source = new ol.source.Vector({
			strategy: ol.loadingstrategy.bboxDependant,
			url: function(extent, resolution, projection) {
				source.clear(); // Redraw the layer
				var bbox = ol.proj.transformExtent(extent, projection.getCode(), 'EPSG:4326'),
					list = permanentCheckboxList(options.selectorName).filter(function(event) {
						return event !== 'on'; // Remove the "all" input (default value = "on")
					});
				return typeof options.url == 'function' ?
					options.url(bbox, list, resolution) :
					options.url + list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
			},
			format: options.format || new ol.format.GeoJSON()
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 1, // Above baselayer even if included to the map before
			style: typeof options.style != 'function' ?
				ol.style.Style.defaultFunction : function(feature) {
					return new ol.style.Style(options.style(feature.getProperties()));
				}
		});

	// Optional checkboxes to tune layer parameters
	if (options.selectorName) {
		controlPermanentCheckbox(options.selectorName, function(event, list) {
			layer.setVisible(list.length);
			if (list.length)
				source.clear(); // Redraw the layer
		});
	}

	layer.options_ = options; //HACK Mem options for interactions
	layer.on('onadd', initLayerVectorURLListeners);

	return layer;
}

// We use only one listener for hover and one for click on all vector layers
function initLayerVectorURLListeners(e) {
	var map = e.target.map_;
	if (!map.popElement_) { //HACK Only once for all layers
		// Display a label when hover the feature
		map.popElement_ = document.createElement('div');
		var dx = 0.4, xAnchor, // Spread too closes icons
			hovered = [],
			popup = new ol.Overlay({
				element: map.popElement_
			});
		map.addOverlay(popup);

		map.on('pointermove', pointerMove);

		function pointerMove(event) {
			// Reset cursor & popup position
			map.getViewport().style.cursor = 'default'; // To get the default cursor if there is no feature here

			var mapRect = map.getTargetElement().getBoundingClientRect(),
				popupRect = map.popElement_.getBoundingClientRect();
			if (popupRect.left - 5 > mapRect.x + event.pixel[0] || mapRect.x + event.pixel[0] >= popupRect.right + 5 ||
				popupRect.top - 5 > mapRect.y + event.pixel[1] || mapRect.y + event.pixel[1] >= popupRect.bottom + 5)
				popup.setPosition(undefined); // Hide label by default if none feature or his popup here

			// Reset previous hovered styles
			if (hovered)
				hovered.forEach(function(h) {
					if (h.layer && h.options)
						h.feature.setStyle(new ol.style.Style(h.options.style(h.feature.getProperties())));
				});

			// Search the hovered the feature(s)
			hovered = [];
			map.forEachFeatureAtPixel(event.pixel, function(f, l) {
				if (l && l.options_) {
					var h = {
						event: event,
						pixel: event.pixel, // Follow the mouse if line or surface
						feature: f,
						layer: l,
						options: l.options_,
						properties: f.getProperties(),
						coordinates: f.getGeometry().flatCoordinates // If it's a point, just over it
					};
					if (h.coordinates.length == 2) // Stable if icon
						h.pixel = map.getPixelFromCoordinate(h.coordinates);
					h.ll4326 = ol.proj.transform(h.coordinates, 'EPSG:3857', 'EPSG:4326');
					hovered.push(h);
				}
			});

			if (hovered) {
				// Sort features left to right
				hovered.sort(function(a, b) {
					if (a.coordinates.length > 2) return 999; // Lines & surfaces under of the pile !
					if (b.coordinates.length > 2) return -999;
					return a.pixel[0] - b.pixel[0];
				});
				xAnchor = 0.5 + dx * (hovered.length + 1) / 2; // dx left because we begin to remove dx at the first icon
				hovered.forEach(checkHovered);
			}
		}

		function checkHovered(h) {
			// Hover a clikable feature
			if (h.options.click)
				map.getViewport().style.cursor = 'pointer';

			// Apply hover if any
			var style = (h.options.hover || h.options.style)(h.properties);

			// Spread too closes icons //TODO BUG don't allow to click on the last !!
			if (hovered.length > 1 &&
				style.image)
				style.image.anchor_[0] = xAnchor -= dx;
			h.feature.setStyle(new ol.style.Style(style));

			if (h.options.label &&
				!popup.getPosition()) { // Only for the first feature on the hovered stack
				// Calculate the label' anchor
				popup.setPosition(map.getView().getCenter()); // For popup size calculation

				// Fill label class & text
				map.popElement_.className = 'popup ' + (h.layer.options_.labelClass || '');
				map.popElement_.innerHTML = typeof h.options.label == 'function' ?
					h.options.label(h.properties, h.feature, h.layer) :
					h.options.label;

				// Shift of the label to stay into the map regarding the pointer position
				if (h.pixel[1] < map.popElement_.clientHeight + 12) { // On the top of the map (not enough space for it)
					h.pixel[0] += h.pixel[0] < map.getSize()[0] / 2 ? 10 : -map.popElement_.clientWidth - 10;
					h.pixel[1] = 2;
				} else {
					h.pixel[0] -= map.popElement_.clientWidth / 2;
					h.pixel[0] = Math.max(h.pixel[0], 0); // Bord gauche
					h.pixel[0] = Math.min(h.pixel[0], map.getSize()[0] - map.popElement_.clientWidth - 1); // Bord droit
					h.pixel[1] -= map.popElement_.clientHeight + 10;
				}
				popup.setPosition(map.getCoordinateFromPixel(h.pixel));
			}
		}

		// Click on a feature
		map.on('click', function(event) {
			if (!event.originalEvent.shiftKey &&
				!event.originalEvent.ctrlKey &&
				!event.originalEvent.altKey)
				map.forEachFeatureAtPixel(
					event.pixel,
					function(feature, layer) {
						if (layer && layer.options_ &&
							typeof layer.options_.click == 'function')
							layer.options_.click(feature.getProperties());
					}, {
						hitTolerance: 6
					});
		});
	}
}

/**
 * Feature format for reading data in the OSMXML format
 * Convert areas into points to display it as an icon
 */
ol.format.OSMXMLPOI = function() {
	ol.format.OSMXML.call(this);

	this.readFeatures = function(source, opt_options) {
		for (var node = source.documentElement.firstChild; node; node = node.nextSibling)
			if (node.nodeName == 'way') {
				// Create a new 'node' element centered on the surface
				var newNode = source.createElement('node');
				source.documentElement.appendChild(newNode);
				newNode.id = node.id;

				// Add a tag to mem what node type it was
				var newTag = source.createElement('tag');
				newTag.setAttribute('k', 'nodetype');
				newTag.setAttribute('v', 'way');
				newNode.appendChild(newTag);

				for (var subTagNode = node.firstChild; subTagNode; subTagNode = subTagNode.nextSibling)
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
		return ol.format.OSMXML.prototype.readFeatures.call(this, source, opt_options);
	};
};
ol.inherits(ol.format.OSMXMLPOI, ol.format.OSMXML);

/**
 * OSM overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 * Requires layerVectorURL
 */
//TODO BUG quand déplace ou zoom aprés avoir changer un sélecteur : affiche des ?
function layerOverpass(options) {
	var layer = layerVectorURL({
		url: function(bbox, list, resolution) {
			var bb = '(' + bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2] + ');',
				args = [],
				elSelector = document.getElementById(options.selectorId);

			if (resolution < (options.maxResolution || 30)) { // Only for small areas
				for (var l = 0; l < list.length; l++) {
					var lists = list[l].split('+');
					for (var ls = 0; ls < lists.length; ls++)
						args.push(
							'node' + lists[ls] + bb + // Ask for nodes in the bbox
							'way' + lists[ls] + bb // Also ask for areas
						);
				}
				if (elSelector)
					elSelector.style.color =
					elSelector.title = '';
			} else if (elSelector) {
				elSelector.style.color = 'red';
				elSelector.title = 'Zoom in to enable see the points.';
			}

			return options.url +
				'?data=[timeout:5];(' + // Not too much !
				args.join('') +
				');out center;'; // add center of areas
		},
		format: new ol.format.OSMXMLPOI(),
		selectorName: options.selectorName, // The layer is cleared & reloaded if one selector check is clicked
		style: function(properties) {
			return {
				image: new ol.style.Icon({
					src: options.iconUrlPath + overpassType(properties) + '.png'
				})
			};
		},
		labelClass: options.labelClass,
		label: formatLabel
	});

	//TODO : afficher erreur 429 (Too Many Requests)
	//TODO : afficher affichage OK, ...
	function formatLabel(p, f) { // p = properties, f = feature
		var language = {
				alpine_hut: 'Refuge gard&egrave;',
				hotel: 'h&ocirc;tel',
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
				(p.name ? '<b>' + p.name + '</b>' : '') +
				(p.alt_name ? '<b>' + p.alt_name + '</b>' : '') +
				(p.short_name ? '<b>' + p.short_name + '</b>' : ''),
				[(p.name || '').toLowerCase().match(language[p.tourism]) ? '' : p.tourism ? language[p.tourism] : p.tourism,
					'*'.repeat(p.stars),
					p.shelter_type == 'basic_hut' ? 'Abri' : '',
					p.building == 'cabin' ? 'Cabane non gard&egrave;e' : '',
					p.highway == 'bus_stop' ? 'Arr&ecirc;t de bus' : '',
					p.waterway == 'water_point' ? 'Point d&apos;eau' : '',
					p.natural == 'spring' ? 'Source' : '',
					p.man_made == 'water_well' ? 'Puits' : '',
					p.shop ? 'alimentation' : '',
					typeof language[p.amenity] == 'string' ? language[p.amenity] : p.amenity,
					p.rooms ? p.rooms + ' chambres' : '',
					p.beds ? p.beds + ' lits' : '',
					p.place ? p.place + ' places' : '',
					p.capacity ? p.capacity + ' places' : '',
					p.ele ? parseInt(p.ele, 10) + 'm' : '',
				].join(' '),
				phone ? '&phone;<a title="Appeler" href="tel:' + phone.replace(/[^0-9\+]+/ig, '') + '">' + phone + '</a>' : '',
				p.email ? '&#9993;<a title="Envoyer un mail" href="mailto:' + p.email + '">' + p.email + '</a>' : '',
				p['addr:street'] ? address.join(' ') : '',
				p.website ? '&#8943;<a title="Voir le site web" target="_blank" href="' + p.website + '">' + (p.website.split('/')[2] || p.website) + '</a>' : '',
				p.opening_hours ? 'ouvert ' + p.opening_hours : '',
				p.note ? p.note : ''
			];

		// Other paramaters
		var done = [ // These that have no added value or already included
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
		for (var k in p) {
			var k0 = k.split(':')[0];
			if (!done.includes(k0))
				switch (k0) {
					case 'internet_access':
						if (p[k] != 'no' && !nbInternet++)
							popup.push('Accès internet');
						break;
					default:
						popup.push(k + ' : ' + p[k]);
				}
		}

		// Label tail with OSM reference & user specific function
		popup.push(
			p.description,
			'<hr/><a title="Voir la fiche d\'origine sur openstreetmap" ' +
			'href="http://www.openstreetmap.org/' + (p.nodetype ? p.nodetype : 'node') + '/' + f.getId() + '" ' +
			'target="_blank">Voir sur OSM</a>',
			typeof options.postLabel == 'function' ? options.postLabel(overpassType(p), p, f) : options.postLabel || ''
		);
		return ('<p>' + popup.join('</p><p>') + '</p>').replace(/<p>\s*<\/p>/ig, '');
	}

	function overpassType(properties) {
		var checkElements = document.getElementsByName(options.selectorName);
		for (var e = 0; e < checkElements.length; e++)
			if (checkElements[e].checked) {
				var tags = checkElements[e].value.split('+');
				for (var t = 0; t < tags.length; t++) {
					var conditions = tags[t].split('"');
					if (properties[conditions[1]] &&
						properties[conditions[1]].match(conditions[3]))
						return checkElements[e].id;
				}
			}
		return 'inconnu';
	}

	return layer;
}

/**
 * Marker
 * Requires proj4.js for swiss coordinates
 * Requires 'onadd' layer event
 */
//TODO pointer finger sur la cible
function marker(imageUrl, display, llInit, dragged) { // imageUrl, 'id-display', [lon, lat], bool
	var format = new ol.format.GeoJSON(),
		eljson, json, ellon, ellat, elxy;

	if (typeof display == 'string') {
		eljson = document.getElementById(display + '-json');
		elxy = document.getElementById(display + '-xy');
	}
	// Use json field values if any
	if (eljson)
		json = eljson.value || eljson.innerHTML;
	if (json)
		llInit = JSON.parse(json).coordinates;

	var style = new ol.style.Style({
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
			zIndex: 2
		});

	layer.on('onadd', function(event) {
		if (dragged) {
			// Drag and drop
			event.target.map_.addInteraction(new ol.interaction.Modify({
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
		var ll4326 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:4326'),
			values = {
				lon: Math.round(ll4326[0] * 100000) / 100000,
				lat: Math.round(ll4326[1] * 100000) / 100000,
				json: JSON.stringify(format.writeGeometryObject(point, { //TODO writeGeometryObject {decimals: 5}
					featureProjection: 'EPSG:3857'
				}))
			};
		// Specific Swiss coordinates EPSG:21781 (CH1903 / LV03)
		if (typeof proj4 == 'function' &&
			ol.extent.containsCoordinate([664577, 5753148, 1167741, 6075303], ll)) { // Si on est dans la zone suisse EPSG:21781
			var c21781 = ol.proj.transform(ll, 'EPSG:3857', 'EPSG:21781');
			values.x = Math.round(c21781[0]);
			values.y = Math.round(c21781[1]);
		}
		if (elxy)
			elxy.style.display = values.x ? '' : 'none';

		// We insert the resulting HTML string where it is going
		for (var v in values) {
			var el = document.getElementById(display + '-' + v);
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
	layer.edit = function(event, nol, projection) {
		var coord = ol.proj.transform(point.getCoordinates(), 'EPSG:3857', 'EPSG:' + projection); // La position actuelle de l'icone
		coord[nol] = parseFloat(event.value); // On change la valeur qui a été modifiée
		point.setCoordinates(ol.proj.transform(coord, 'EPSG:' + projection, 'EPSG:3857')); // On repositionne l'icone
		layer.map_.getView().setCenter(point.getCoordinates());
	};

	layer.getPoint = function() {
		return point;
	};

	return layer;
}

// Basic images
var markerImage =
	'data:image/svg+xml;utf8,' +
	'<svg xmlns="http://www.w3.org/2000/svg" width="31" height="43" ' +
	'style="stroke-width:4;stroke:rgb(255,0,0,.5);fill:rgb(0,0,0,0)">' +
	'<rect width="31" height="43" />' +
	'</svg>',
	targetImage = 'data:image/svg+xml;utf8,' +
	'<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" ' +
	'style="stroke-width:3;stroke:rgb(255,208,0);fill:rgb(0,0,0,0)">' +
	'<circle cx="15" cy="15" r="13.5" />' +
	'<line x1="15" y1="0" x2="15" y2="30" />' +
	'<line x1="0" y1="15" x2="30" y2="15" />' +
	'</svg>';

//******************************************************************************
// CONTROLS
//******************************************************************************
/**
 * Control buttons
 * Abstract definition to be used by other control buttons definitions
 *
 * label {string} character to be displayed in the button.
 * options.className {string} className of the button.
 * options.rightPosition {float} distance to the top when the button is on the right of the map.
 * options.title {string} displayed when the control is hovered.
 * options.render {function} called when the control is rendered.
 * options.action {function} called when the control is clicked.
 */
var nextButtonTopPos = 6; // Top position of next button (em)

function controlButton(options) {
	options = options || {
		className: 'ol-control-hidden'
	};
	var buttonElement = document.createElement('button');
	buttonElement.innerHTML = options.label || '';
	buttonElement.addEventListener('click', options.action);

	var divElement = document.createElement('div');
	if (options.rightPosition) {
		divElement.style.right = '.5em';
		divElement.style.top = options.rightPosition + 'em';
	} else if (options.action) {
		divElement.style.left = '.5em';
		divElement.style.top = (nextButtonTopPos += 2) + 'em';
	}
	divElement.className = 'ol-button ol-unselectable ol-control ' + (options.className || '');
	divElement.title = options.title;
	divElement.appendChild(buttonElement);

	var control = new ol.control.Control({
		element: divElement,
		render: options.render
	});

/* //TODO DELETE ???
	control.action = function (event) {
		options.action({
			event.preventDefault();
			target: buttonElement
		});
	}
*/

	return control;
}

/**
 * Layer switcher control
 * baseLayers {[ol.layer]} layers to be chosen one to fill the map.
 * Requires controlButton & controlPermanentCheckbox
 */
function controlLayersSwitcher(baseLayers) {
	var control = controlButton({
		label: '&hellip;',
		className: 'switch-layer',
		title: 'Liste des cartes',
		rightPosition: 0.5,
		render: render
	});

	// Transparency slider (first position)
	var rangeElement = document.createElement('input');
	rangeElement.type = 'range';
	rangeElement.className = 'range-layer';
	rangeElement.oninput = displayLayerSelector;
	rangeElement.title = 'Glisser pour faire varier la tranparence';
	control.element.appendChild(rangeElement);

	// Layer selector
	var selectorElement = document.createElement('div');
	selectorElement.style.overflow = 'auto';
	selectorElement.title = 'Ctrl+click : multicouches';
	control.element.appendChild(selectorElement);

	// When the map is created & rendered
	var map;

	function render(event) {
		if (!map) { // Only the first time
			map = event.map; // mem map for further use

			// Base layers selector init
			for (var name in baseLayers) {
				var baseElement = document.createElement('div');
				baseElement.innerHTML =
					'<input type="checkbox" name="baselayer" value="' + name + '">' +
					'<span title="">' + name + '</span>';
				selectorElement.appendChild(baseElement);
				map.addLayer(baseLayers[name]);
			}

			// Make the selector memorized by cookies
			controlPermanentCheckbox('baselayer', displayLayerSelector);

			// Hover the button open the selector
			control.element.firstElementChild.onmouseover = displayLayerSelector;

			// Click or change map size close the selector
			map.on(['click', 'change:size'], function() {
				displayLayerSelector();
			});

			// Leaving the map close the selector
			window.addEventListener('mousemove', function(event) {
				var divRect = map.getTargetElement().getBoundingClientRect();
				if (event.clientX < divRect.left || event.clientX > divRect.right ||
					event.clientY < divRect.top || event.clientY > divRect.bottom)
					displayLayerSelector();
			});
		}
	}

	function displayLayerSelector(event, list) {
		// Check the first if none checked
		if (list && list.length === 0)
			selectorElement.firstChild.firstChild.checked = true;

		// Leave only one checked except if Ctrl key is on
		if (event && event.type == 'click' && !event.ctrlKey) {
			var checkElements = document.getElementsByName('baselayer');
			for (var e = 0; e < checkElements.length; e++)
				if (checkElements[e] != event.target)
					checkElements[e].checked = false;
		}

		list = permanentCheckboxList('baselayer');

		// Refresh layers visibility & opacity
		for (var layerName in baseLayers) {
			baseLayers[layerName].setVisible(list.indexOf(layerName) !== -1);
			baseLayers[layerName].setOpacity(0);
		}
		baseLayers[list[0]].setOpacity(1);
		if (list.length >= 2)
			baseLayers[list[1]].setOpacity(rangeElement.value / 100);

		// Refresh control button, range & selector
		control.element.firstElementChild.style.display = event ? 'none' : '';
		rangeElement.style.display = event && list.length > 1 ? '' : 'none';
		selectorElement.style.display = event ? '' : 'none';
		selectorElement.style.maxHeight = (map.getTargetElement().clientHeight - 58 - (list.length > 1 ? 24 : 0)) + 'px';
	}

	return control;
}

/**
 * Permalink control
 * options.visible {true | false | undefined} add a controlPermalink button to the map.
 * options.init {true | false | undefined} use url hash or "controlPermalink" cookie to position the map.
 * "map" url hash or cookie = {map=<ZOOM>/<LON>/<LAT>/<LAYER>}
 * options.defaultPos {<ZOOM>/<LON>/<LAT>/<LAYER>} if nothing else is defined.
 */
function controlPermalink(options) {
	var divElement = document.createElement('div'),
		aElement = document.createElement('a'),
		control = new ol.control.Control({
			element: divElement,
			render: render
		}),
		params =
			location.hash.match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Priority to the hash
			document.cookie.match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Then the cookie
			(options.defaultPos || '6/2/47').match(/([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/);
	control.paramsCenter = [parseFloat(params[2]), parseFloat(params[3])];

	if (options.visible) {
		divElement.className = 'ol-permalink';
		aElement.innerHTML = 'Permalink';
		aElement.title = 'Generate a link with map zoom & position';
		divElement.appendChild(aElement);
	}

	function render(event) {
		var view = event.map.getView();

		// Set the map at the init
		if (options.init !== false && // If use hash & cookies
			params) { // Only once
			view.setZoom(params[1]);
			view.setCenter(ol.proj.transform(control.paramsCenter, 'EPSG:4326', 'EPSG:3857'));
			params = null;
		}

		// Check the current map zoom & position
		var ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
			newParams = [
				parseInt(view.getZoom()),
				Math.round(ll4326[0] * 100000) / 100000,
				Math.round(ll4326[1] * 100000) / 100000
			];

		// Set the new permalink
		aElement.href = '#map=' + newParams.join('/');
		document.cookie = 'map=' + newParams.join('/') + ';path=/';
	}

	return control;
}

/**
 * GPS control
 * Requires controlButton
 */
function controlGPS() {
	if (!window.location.href.match(/https|localhost/i))
		return controlButton();

	// The position marker
	var point_ = new ol.geom.Point([0, 0]),
		source_ = new ol.source.Vector({
			features: [new ol.Feature({
				geometry: point_
			})]
		}),
		style_ = new ol.style.Style({
			image: new ol.style.Icon({
				anchor: [0.5, 0.5], // Picto marking the position on the map
				src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAA7VBMVEUAAAA/X39UVHFMZn9NXnRPX3RMW3VPXXNOXHJOXXNNXHNOXXFPXHNNXXFPXHFOW3NPXHNPXXJPXXFPXXNNXXFNW3NOXHJPW25PXXNRX3NSYHVSYHZ0fIx1fo13gI95hJR6go96g5B7hpZ8hZV9hpZ9h5d/iZiBi5ucoquepa+fpbGhqbSiqbXNbm7Ob2/OcHDOcXHOcnLPdHTQdXXWiIjXiorXjIzenp7eoKDgpKTgpaXgpqbks7TktLTktbXnubnr2drr5+nr6Ons29vs29zs6Ors6ert6uvt6uzu6uz18fH18fL68PD++/v+/Pw8gTaQAAAAFnRSTlMACAkKLjAylJWWmJmdv8HD19ja2/n6GaRWtgAAAMxJREFUGBkFwctqwkAUgOH/nMnVzuDGFhRKKVjf/226cKWbQgNVkphMzFz6fQJQlY0S/boCAqa1AMAwJwRjW4wtcxgS05gEa3HHOYipzxP9ZKot9tR5ZfIff7FetMQcf4tDVexNd1IKbbA+7S59f9mlZGmMVVdpXN+3gwh+RiGLAjkDGTQSjHfhes3OV0+CkXrdL/4gzVunxQ+DYZNvn+Mg6aav35GH8OJS/SUrVTw/9e4FtRvypsbPwmPMAto6AOC+ZASgLBpDmGMA/gHW2Vtk8HXNjQAAAABJRU5ErkJggg=='
			})
		}),
		layer = new ol.layer.Vector({
			source: source_,
			style: style_
		});

	// Interface with the system GPS
	var geolocation = new ol.Geolocation();
	geolocation.on('error', function(error) {
		alert('Geolocation error: ' + error.message);
	});

	var active = false,
		action = function(event) {
			event.preventDefault();
			active ^= 1; // Toggle on / off
			event.target.style.color = active ? 'black' : 'white'; // Color button
			geolocation.setTracking(active); // Turn on / off
			if (active)
				bouton.getMap().addLayer(layer);
			else
				bouton.getMap().removeLayer(layer);
		},
		bouton = controlButton({
			className: 'gps-button',
			title: 'Centrer sur la position GPS',
			action: action
		});

	geolocation.on('change', function() {
		var position = ol.proj.fromLonLat(this.getPosition());
		bouton.getMap().getView().setCenter(position);
		point_.setCoordinates(position);
		if (typeof bouton.callBack == 'function')
			bouton.callBack(position);
	});

	return bouton;
}

/**
 * Control to displays the length of a line overflown
 */
function controlLengthLine() {
	var divElement = document.createElement('div'),
		control = new ol.control.Control({
			element: divElement,
			render: render
		});

	function render(event) {
		if (!divElement.className) { // Only once
			divElement.className = 'ol-length-line';

			event.map.on(['pointermove'], function(event) {
				divElement.innerHTML = ''; // Clear the measure if hover no feature

				event.map.forEachFeatureAtPixel(event.pixel, calculateLength, {
					hitTolerance: 6
				});
			});
		}
	}

	function calculateLength(f) {
		var length = ol.sphere.getLength(f.getGeometry());
		if (length >= 100000)
			divElement.innerHTML = (Math.round(length / 1000)) + ' km';
		else if (length >= 10000)
			divElement.innerHTML = (Math.round(length / 1000 * 10) / 10) + ' km';
		else if (length >= 1000)
			divElement.innerHTML = (Math.round(length / 1000 * 100) / 100) + ' km';
		else if (length >= 1)
			divElement.innerHTML = (Math.round(length)) + ' m';
		return false; // Continue detection (for editor that has temporary layers)
	}

	return control;
}

/**
 * GPX file loader control
 * Requires controlButton
 */
//BEST Pas d'upload/download sur mobile (-> va vers photos !)
function controlLoadGPX() {
	var inputElement = document.createElement('input'),
		button = controlButton({
			label: '&uArr;',
			title: 'Visualiser un fichier GPX sur la carte',
			action: function(event) {
				event.preventDefault();
				inputElement.click();
			}
		}),
		format = new ol.format.GPX(),
		reader = new FileReader();

	inputElement.type = 'file';
	inputElement.addEventListener('change', function() {
		reader.readAsText(inputElement.files[0]);
	});

	reader.onload = function() {
		var map = button.getMap(),
			features = format.readFeatures(reader.result, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			});

		if (map.sourceEditor) { // If there is an active editor
			map.sourceEditor.addFeatures(features); // Add the track to the editor

			// Zoom the map on the added features
			var extent = ol.extent.createEmpty();
			for (var f in features)
				ol.extent.extend(extent, features[f].getGeometry().getExtent());
			button.getMap().getView().fit(extent);
		} else {
			// Display the track on the map
			var source = new ol.source.Vector({
					format: format,
					features: features
				}),
				vector = new ol.layer.Vector({
					source: source
				});
			button.getMap().addLayer(vector);
			button.getMap().getView().fit(source.getExtent());
		}
	};
	return button;
}

/**
 * GPX file downloader control
 * Requires controlButton
 */
function controlDownloadGPX() {
	var map,
		selectedFeatures = [],
		hiddenElement = document.createElement('a'),
		button = controlButton({
			label: '&dArr;',
			title: 'Obtenir un fichier GPX',
			render: render,
			action: function(event) {
				event.preventDefault();
				if (map.sourceEditor) // If there is an active editor
					download(map.sourceEditor.getFeatures());
				else if (selectedFeatures.length) // If there are selected features
					download(selectedFeatures);
				else
					alert('Sélectionnez une ou plusieurs traces à sauvegarder avec "Shift+Clic"');
			}
		});

	//HACK for Moz
	hiddenElement.target = '_blank';
	hiddenElement.style = 'display:none;opacity:0;color:transparent;';
	(document.body || document.documentElement).appendChild(hiddenElement);

	function render(event) {
		if (!map) {
			map = event.map;

			// Selection of lines
			var select = new ol.interaction.Select({
				condition: function(event) {
					return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.click(event);
				},
				filter: function(f) {
					return f.getGeometry().getType().indexOf('Line') !== -1;
				},
				hitTolerance: 6
			});
			select.on('select', function(event) {
				selectedFeatures = event.target.getFeatures().getArray();
			});
			map.addInteraction(select);
		}
	}

	function download(layers) {
		var fileName = 'trace.gpx',
			gpx = new ol.format.GPX().writeFeatures(layers, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			}),
			file = new Blob([gpx.replace(/>/g, ">\n")], {
				type: 'application/gpx+xml'
			});

		//HACK for IE/Edge
		if (typeof navigator.msSaveOrOpenBlob !== 'undefined')
			return navigator.msSaveOrOpenBlob(file, fileName);
		else if (typeof navigator.msSaveBlob !== 'undefined')
			return navigator.msSaveBlob(file, fileName);

		hiddenElement.href = URL.createObjectURL(file);
		hiddenElement.download = fileName;

		if (typeof hiddenElement.click === 'function')
			hiddenElement.click();
		else
			hiddenElement.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			}));
	}

	return button;
}

// HACK to display a title on the geocoder
window.addEventListener('load', function() {
	var buttonElement = document.getElementById('gcd-button-control');
	if (buttonElement)
		buttonElement.title = 'Recherche de lieu par son nom';
});

/**
 * Print control
 */
function controlPrint() {
//TODO impression full format page -> CSS
	return controlButton({
		className: 'print-button',
		title: 'Imprimer la carte',
		action: function(event) {
			event.preventDefault();
			window.print();
		}
	});
}

/**
 * Line & Polygons Editor
 * Requires controlButton
 * Requires activated controlLengthLine //TODO pourquoi ???
 */
function controlEditor(inputId, snapLayers, type) {
	var inputEl = document.getElementById(inputId), // Read data in an html element
		format = new ol.format.GeoJSON(),
		features = format.readFeatures(
			JSON.parse(inputEl.value), {
				featureProjection: 'EPSG:3857' // Read/write data as ESPG:4326 by default
			}
		),
		source = new ol.source.Vector({
			features: features,
			wrapX: false
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 3
		}),
		interactions = {
			snap: new ol.interaction.Snap({
				source: source
			}),
			modify: new ol.interaction.Modify({
				source: source,
				deleteCondition: function(event) {
					//HACK because the system don't trig singleClick
					return ol.events.condition.altKeyOnly(event) && ol.events.condition.click(event);
				}
			}),
			draw: new ol.interaction.Draw({
				source: source,
				type: type || 'LineString'
			}),
			hover: new ol.interaction.Select({
				layers: [layer],
				condition: ol.events.condition.pointerMove,
				hitTolerance: 6
			})
		},
		editMode = true, // Versus false if insert line mode
		bouton = controlButton({
			label: 'E',
			render: render,
			title: "Editeur de lignes\n" +
				"Click sur E pour ajouter ou étendre une ligne, doubleclick pour finir\n" +
				"Click sur un sommet puis déplacer pour modifier\n" +
				"Click sur un segment puis déplacer pour créer un sommet\n" +
				"Alt+click sur un sommet pour le supprimer\n" +
				"Alt+click sur un segment pour le supprimer et couper la ligne\n" +
				"Ctrl+Alt+click sur une ligne pour la supprimer",
			action: function(event) {
				event.preventDefault();
				setMode(editMode ^= 1); // Alternately switch modes
			}
		}),
		map;

	function render(event) {
		if (!map) { // Only once
			map = event.map;
			map.sourceEditor = source; //HACK to make other control acting differently when there is an editor
			map.addLayer(layer);
			//HACK Avoid zooming when you leave the mode by doubleclick
			map.getInteractions().getArray().forEach(function(i) {
				if (i instanceof ol.interaction.DoubleClickZoom)
					map.removeInteraction(i);
			});

			// Snap on features external to the editor
			if (snapLayers)
				for (var s in snapLayers)
					snapLayers[s].getSource().on('change', snapFeatures);

			setMode(true); // Set edit mode by default
		}
	}

	function snapFeatures() {
		this.forEachFeature(
			function(f) {
				interactions.snap.addFeature(f);
			}
		);
	}

	function setMode(em) {
		editMode = em;
		bouton.element.firstChild.innerHTML = editMode ? 'E' : '+';
		bouton.element.firstChild.style.color = editMode ? 'white' : 'black';
		for (var i in interactions)
			map.removeInteraction(interactions[i]);
		map.addInteraction(editMode ? interactions.modify : interactions.draw);
		map.addInteraction(interactions.snap);
		map.addInteraction(interactions.hover);
	}

	interactions.draw.on(['drawend'], function() {
		setMode(true); // We close the creation mode
	});

	source.on(['change'], function() {
		// Save lines in <EL> as geoJSON at every change
		inputEl.value = format.writeFeatures(source.getFeatures(), {
			featureProjection: 'EPSG:3857'
		});
		map.dispatchEvent('changed'); //HACK Reset hover if any
	});

	source.on(['addfeature'], function() {
		editorActions();
	});

	//TODO BUG : n'efface que quand le curseur bouge / reste quelque chose à cet endroit
	interactions.modify.on('modifyend', function(event) {
		if (event.mapBrowserEvent.originalEvent.altKey) {
			// altKey + ctrlKey : delete feature
			if (event.mapBrowserEvent.originalEvent.ctrlKey)
				deleteFeatureAt(event.mapBrowserEvent.pixel);

			// altKey : delete segment
			else
				editorActions(event.mapBrowserEvent.coordinate);
		} else

			// Other changes
			editorActions();
	});

	// Makes the required changes / reorganize edited geometries
	var semaphore = 0;

	function deleteFeatureAt(pixel) {
		var features = map.getFeaturesAtPixel(pixel, {
			hitTolerance: 6
		});
		for (var f in features)
			if (features[f].getGeometry().getType() != 'Point')
				source.removeFeature(features[f]); // We delete the pointed feature
	}

	function editorActions(pointerPosition) {
		if (!semaphore++) { // Don't reenter when adding features from the function

			// Get flattened list of multipoints coords
			var features = source.getFeatures(),
				lines = [],
				polys = [];
			for (var f in features)
				flatCoord(lines, features[f].getGeometry().getCoordinates(), pointerPosition);
			source.clear(); // And clear the edited layer

			for (var a in lines) {
				// Exclude 1 coord features (points)
				if (lines[a] && lines[a].length < 2)
					lines[a] = null;

				// Treat closed lines as polygons
				if (compareCoords(lines[a])) {
					polys.push([lines[a]]);
					lines[a] = null;
				}

				// Merge lines having a common end
				for (var b in lines)
					if (a < b) {
						var m = [a, b];
						for (var i = 4; i; i--) // 4 times
							if (lines[m[0]] && lines[m[1]]) {
								// Shake lines end to explore all possibilities
								m.reverse();
								lines[m[0]].reverse();
								if (compareCoords(lines[m[0]][lines[m[0]].length - 1], lines[m[1]][0])) {

									// Merge 2 lines matching ends
									lines[m[0]] = lines[m[0]].concat(lines[m[1]]);
									lines[m[1]] = 0;

									// Re-check if the new line is closed
									if (compareCoords(lines[m[0]])) {
										polys.push([lines[m[0]]]);
										lines[m[0]] = null;
									}
								}
							}
					}
			}

			// Makes holes if a polygon is included in a biggest one
			for (var f in polys)
				if (polys[f]) {
					var fs = new ol.geom.Polygon(polys[f]);
					for (var p in polys)
						if (p != f &&
							polys[p]) {
							var intersects = true;
							for (var c in polys[p][0])
								if (!fs.intersectsCoordinate(polys[p][0][c]))
									intersects = false;
							if (intersects) {
								polys[f].push(polys[p][0]);
								polys[p] = null;
							}
						}
				}

			// Recreate modified features
			for (var l in lines)
				if (lines[l])
					source.addFeature(new ol.Feature({
						geometry: new ol.geom.LineString(lines[l])
					}));
			for (var p in polys)
				if (polys[p])
					source.addFeature(new ol.Feature({
						geometry: new ol.geom.Polygon(polys[p])
					}));
		}
		semaphore--;
	}

	function flatCoord(existingCoords, newCoords, pointerPosition) {
		if (typeof newCoords[0][0] == 'object')
			for (var c in newCoords)
				flatCoord(existingCoords, newCoords[c], pointerPosition);
		else {
			existingCoords.push([]); // Increment existingCoords array
			for (var c in newCoords)
				if (pointerPosition && compareCoords(newCoords[c], pointerPosition)) { // If this is the pointed one, forget it &
					existingCoords.push([]); // Increment existingCoords array
				} else
					existingCoords[existingCoords.length - 1].push(newCoords[c]); // Stack on the last existingCoords array
		}
	}

	function compareCoords(a, b) {
		if (!a)
			return false;
		if (!b)
			return compareCoords(a[0], a[a.length - 1]); // Compare start with end
		return a[0] == b[0] && a[1] == b[1]; // 2 coords
	}

	return bouton;
}

/**
 * Controls examples
 */
var controlgps = controlGPS();
function controlsCollection() {
	return [
		new ol.control.ScaleLine(),
		new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(5),
			projection: 'EPSG:4326',
			className: 'ol-coordinate',
			undefinedHTML: String.fromCharCode(0)
		}),
		new ol.control.Attribution({
			collapsible: false // Attribution always open
		}),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '',
			labelActive: '',
			tipLabel: 'Plein écran'
		}),
		controlLengthLine(),
		controlPermalink({
			init: true,
			visible: true
		}),
		// Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
		// Requires hack to display a title on the geocoder
		new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'FR',
			keepOpen: true,
			placeholder: 'Saisir un nom' // Initialization of the input field
		}),
		controlgps,
		controlLoadGPX(),
		controlDownloadGPX(),
//		controlPrint(),
	];
}

/**
 * Tile layers examples
 * Requires many
 */
function layersCollection(keys) {
	return {
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
		'OSM outdoors': layerThunderforest('outdoors', keys.thunderforest),
		'OSM cycle': layerThunderforest('cycle', keys.thunderforest),
		'OSM landscape': layerThunderforest('landscape', keys.thunderforest),
		'OSM transport': layerThunderforest('transport', keys.thunderforest),
		'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN TOP 25': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		'IGN classique': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'IGN photos': layerIGN(keys.IGN, 'ORTHOIMAGERY.ORTHOPHOTOS'),
		'IGN Spot': layerIGN(keys.IGN, 'ORTHOIMAGERY.ORTHO-SAT.SPOT.2017'),
		'IGN plan': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.PLANIGN'),
		'Etat major': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40'),
		// NOT YET	layerIGN('IGN avalanches', keys.IGN,'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN'),
		'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png'),
		'Swiss': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Swiss photo': layerSwissTopo('ch.swisstopo.swissimage'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Espagne photo': layerSpain('pnoa-ma', 'OI.OrthoimageCoverage'),
		'Italie': layerIGM(),
		'Angleterre': layerOS(keys.bing),
		'Bing': layerBing('Road', keys.bing),
		'Bing photo': layerBing('Aerial', keys.bing),
		'Bing mixte': layerBing ('AerialWithLabels', keys.bing),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google photo': layerGoogle('s'),
		'Google hybrid': layerGoogle('s,h'),
		Stamen: layerStamen('terrain'),
		Watercolor: layerStamen('watercolor'),
		'Neutre': new ol.layer.Tile()
	};
}
