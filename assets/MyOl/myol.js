/*!
 * OPENLAYERS V5 ADAPTATION - https://openlayers.org/
 * (C) Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 *
 * I have designed this openlayers adaptation as simple as possible to make it maintained with basics JS skills
 * You only have to include openlayers/dist .js & .css files & my 2 & that's it !
 * A bit of classes, no jquery, no es6 modules, no nodejs build nor minification, no npm repository, ... only one file of JS functions & CSS
 * I know, I know, this is not up to date way of programming but that's my choice & you are free to take it, modifiy & adapt as you wish
 */
//TODO-BEST END http://jsbeautifier.org/ & http://jshint.com
//TODO-ARCHI map off line, application

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
 * Add common functions to the Map object
 */
ol.MyMap = function(options) {
	ol.Map.call(this, options);
	const map = this;

	// Add ol.map object reference to the html #map element
	this.getTargetElement().map_ = map;

	this.on('postrender', function() { // Each time we can
		map.getLayers().forEach(setMap);
		map.getControls().forEach(setMap);
	});

	function setMap(target) {
		if (!target.fired_) { // Only once
			target.fired_ = true;
			// Store the map on it & advise it
			target.map_ = map;
			target.dispatchEvent('myol:onadd');
		}
	}
};
ol.inherits(ol.MyMap, ol.Map);


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
 * Requires 'myol:onadd' layer event
 */
function layerTileIncomplete(extent, sources) { //TODO-ARCHI faire une classe ???
	const layer = new ol.layer.Tile(),
		backgroundSource = new ol.source.Stamen({
			layer: 'terrain'
		});
	layer.on('myol:onadd', function(evt) {
		evt.target.map_.getView().on('change', change);
		change(); // At init
	});

	// Zoom has changed
	function change() {
		const view = layer.map_.getView(),
			center = view.getCenter();
		let currentResolution = 999999; // Init loop at max resolution
		sources[currentResolution] = backgroundSource; // Add extrabound source on the top of the list

		// Search for sources according to the map resolution
		if (center &&
			ol.extent.intersects(extent, view.calculateExtent(layer.map_.getSize())))
			currentResolution = Object.keys(sources).filter(function(evt) { // HACK : use of filter to perform an action
				return evt > view.getResolution();
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

//TODO-BEST éviter d'appeler à l'init https://dev.virtualearth.net sur les cartes BING
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


/**
 * VECTORS, GEOJSON & AJAX LAYERS
 */
/**
 * Mem in cookies the checkbox content with name="selectorName"
 */
//TODO-ARCHI when unchecked, remove cookie
function controlPermanentCheckbox(selectorName, callback) {
	const checkElements = document.getElementsByName(selectorName),
		cookie =
		location.hash.match('map-' + selectorName + '=([^#,&;]*)') || // Priority to the hash
		document.cookie.match('map-' + selectorName + '=([^;]*)'); // Then the cookie

	for (let e = 0; e < checkElements.length; e++) {
		checkElements[e].addEventListener('click', permanentCheckboxClick); // Attach the action

		if (cookie) // Set the checks accordingly with the cookie
			checkElements[e].checked = cookie[1].split(',').indexOf(checkElements[e].value) !== -1;
	}

	// Call callback once at the init
	callback(null, permanentCheckboxList(selectorName));

	function permanentCheckboxClick(evt) {
		const list = permanentCheckboxList(selectorName, evt);
		if (typeof callback == 'function')
			callback(evt, list);
	}
}

// Global function, called by others
function permanentCheckboxList(selectorName, evt) {
	let checkElements = document.getElementsByName(selectorName),
		allChecks = [];

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

	// Mem in a cookie
	document.cookie = 'map-' + selectorName + '=' + allChecks.join(',') + ';path=/';

	return allChecks; // Returns list of checked values or ids
}

/**
 * BBOX dependant strategy
 * Same that bbox but reloads if we zoom in because we delivered more points when zoom in
 * Returns {ol.loadingstrategy} to be used in layer definition
 */
ol.loadingstrategy.bboxDependant = function(extent, resolution) {
	if (this.resolution != resolution)
		this.clear(); // Force loading when zoom in
	this.resolution = resolution; // Mem resolution for further requests
	return [extent];
};

/**
 * GeoJson POI layer
 * Requires 'myol:onadd' layer event
 * Requires ol.loadingstrategy.bboxDependant & controlPermanentCheckbox
 * Requires permanentCheckboxList
 */
//TODO-IE EDGE BUG une étiquette une fois sur IE & EDGE puis fixe
//TODO-BEST JSON error handling : error + URL
ol.layer.LayerVectorURL = function(o) {
	const this_ = this, // For callback functions
		options = this.options_ = ol.assign({ // Default options
			baseUrlFunction: function(bbox, list, resolution) {
				return options.baseUrl + list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
			}
		}, o);
	if (options.styleOptions)
		options.style = function(feature) {
			return new ol.style.Style(
				typeof options.styleOptions == 'function' ?
				options.styleOptions(feature.getProperties()) :
				options.styleOptions
			);
		};
	if (options.hoverStyleOptions)
		options.hoverStyle = function(feature) {
			return new ol.style.Style(
				typeof options.hoverStyleOptions == 'function' ?
				options.hoverStyleOptions(feature.getProperties()) :
				options.hoverStyleOptions
			);
		};

	// Manage source & vector objects
	const source = new ol.source.Vector(ol.assign({
		strategy: ol.loadingstrategy.bboxDependant,
		format: new ol.format.GeoJSON(),
		url: function(extent, resolution, projection) {
			source.clear(); // Redraw the layer
			const bbox = ol.proj.transformExtent(extent, projection.getCode(), 'EPSG:4326'),
				// Retreive checked parameters
				list = permanentCheckboxList(options.selectorName).filter(function(evt) {
					return evt !== 'on'; // Remove the "all" input (default value = "on")
				});
			return options.baseUrlFunction(bbox, list, resolution);
		}
	}, options));

	// Create the layer
	ol.layer.Vector.call(this, ol.assign({
		source: source,
		zIndex: 1 // Above the baselayer even if included to the map before
	}, options));

	// Optional : checkboxes to tune layer parameters
	if (options.selectorName) {
		controlPermanentCheckbox(options.selectorName, function(evt, list) {
			this_.setVisible(list.length);
			if (list.length)
				source.clear(); // Redraw the layer
		});
	}

	this.on('myol:onadd', function() {
		const map = this.map_;

		// Create the label popup
		if (!map.popElement_) { //HACK Only once for all layers
			map.popElement_ = document.createElement('a');
			map.popElement_.style.display = 'block';
			map.popup_ = new ol.Overlay({
				element: map.popElement_
			});
			map.addOverlay(map.popup_);

			// Click on a feature
			map.on('click', function(evt) {
				evt.target.forEachFeatureAtPixel(
					evt.pixel,
					function() { // Simulate a click on the label
						map.popElement_.click();
					}, {
						hitTolerance: 6
					});
			});
		}

		const select = new ol.interaction.Select({
			condition: ol.events.condition.pointerMove,
			filter: function(feature, layer) {
				return layer == this_;
			},
			hitTolerance: 6,
			style: this_.options_.hoverStyle || this_.options_.style
		});

		select.on('select', function(selectEvent) {
			const pixel = selectEvent.mapBrowserEvent.pixel;

			// Reset cursor & popup position
			map.getViewport().style.cursor = 'default'; // To get the default cursor if there is no feature here
			map.popElement_.removeAttribute('href');
			const mapRect = map.getTargetElement().getBoundingClientRect(),
				popupRect = map.popElement_.getBoundingClientRect();
			if (popupRect.left - 5 > mapRect.x + pixel[0] || mapRect.x + pixel[0] >= popupRect.right + 5 ||
				popupRect.top - 5 > mapRect.y + pixel[1] || mapRect.y + pixel[1] >= popupRect.bottom + 5)
				map.popup_.setPosition(undefined); // Hide label by default if none feature or his popup here

			// Hover the first selected
			if (selectEvent.selected.length)
				hovering(selectEvent.selected[0], this_, pixel);
		});

		map.addInteraction(select);
	});

	function hovering(feature, layer, pixel) {
		const map = layer.map_;

		if (feature && layer && layer.options_) {
			const coordinates = feature.getGeometry().flatCoordinates, // If it's a point, just over it
				ll4326 = ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326');
			if (coordinates.length == 2) // Stable if icon
				pixel = map.getPixelFromCoordinate(coordinates);

			// Hovering label
			const label = typeof layer.options_.label == 'function' ?
				layer.options_.label(feature.getProperties(), feature) :
				layer.options_.label || '',
				postLabel = typeof layer.options_.postLabel == 'function' ?
				layer.options_.postLabel(feature.getProperties(), feature, layer, pixel, ll4326) :
				layer.options_.postLabel || '';

			if (label &&
				!map.popup_.getPosition()) { // Only for the first feature on the hovered stack
				// Calculate the label's anchor
				map.popup_.setPosition(map.getView().getCenter()); // For popup size calculation

				// Fill label class & text
				map.popElement_.className = 'myPopup ' + (layer.options_.labelClass || '');
				map.popElement_.innerHTML = label + postLabel;
				if (typeof layer.options_.href == 'function') {
					map.popElement_.href = layer.options_.href(feature.getProperties());
					map.getViewport().style.cursor = 'pointer';
				}

				// Shift of the label to stay into the map regarding the pointer position
				if (pixel[1] < map.popElement_.clientHeight + 12) { // On the top of the map (not enough space for it)
					pixel[0] += pixel[0] < map.getSize()[0] / 2 ?
						10 :
						-map.popElement_.clientWidth - 10;
					pixel[1] = 2;
				} else {
					pixel[0] -= map.popElement_.clientWidth / 2;
					pixel[0] = Math.max(pixel[0], 0); // Bord gauche
					pixel[0] = Math.min(pixel[0], map.getSize()[0] - map.popElement_.clientWidth - 1); // Bord droit
					pixel[1] -= map.popElement_.clientHeight + 10;
				}
				map.popup_.setPosition(map.getCoordinateFromPixel(pixel));
			}
		}
	}
};
ol.inherits(ol.layer.LayerVectorURL, ol.layer.Vector);

/**
 * Feature format for reading data in the OSMXML format
 * Convert areas into points to display it as an icon
 */
ol.format.OSMXMLPOI = function() {
	ol.format.OSMXML.call(this);

	this.readFeatures = function(source, opt_options) {
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
		return ol.format.OSMXML.prototype.readFeatures.call(this, source, opt_options);
	};
};
ol.inherits(ol.format.OSMXMLPOI, ol.format.OSMXML);

/**
 * OSM overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 * Requires ol.layer.LayerVectorURL
 */
//TODO-IE BUG pas d'overpass sur IE
//TODO-BEST BUG quand déplace ou zoom aprés avoir changé un sélecteur : affiche des ?
//TODO-BEST afficher erreur 429 (Too Many Requests)
layerOverpass = function(o) {
	const options = ol.assign({ // Default options
			baseUrl: '//overpass-api.de/api/interpreter',
			maxResolution: 30, // Only call overpass if the map's resolution is lower
			selectorId: 'overpass', // Element containing all checkboxes
			selectorName: 'overpass', // Checboxes
			labelClass: 'label-overpass',
			iconUrlPath: '//dc9.fr/chemineur/ext/Dominique92/GeoBB/types_points/'
		}, o),
		checkElements = document.getElementsByName(options.selectorName),
		elSelector = document.getElementById(options.selectorId);
	elSelector.className = 'overpass'; // At the biginning

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

	return new ol.layer.LayerVectorURL(ol.assign({
		format: new ol.format.OSMXMLPOI(),
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
					guest_house: 'chambre d\'h&ocirc;te',
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
						'title="Voir la fiche d\'origine sur openstreetmap">',
						p.name ? (
							p.name.toLowerCase().match(language[p.tourism] || 'azertyuiop') ? '' : p.tourism
							//TODO BUG ne reconnais pas les lettres accentuées (hôtel)
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
 * Requires 'myol:onadd' layer event
 */
//TODO-BEST pointer finger sur la cible
function marker(imageUrl, display, llInit, dragged) { // imageUrl, 'id-display', [lon, lat], bool
	let format = new ol.format.GeoJSON(),
		eljson, json, elxy;

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
		this_ = new ol.layer.Vector({
			source: source,
			style: style,
			zIndex: 10
		});

	this_.on('myol:onadd', function(evt) {
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
	this_.edit = function(evt, nol, projection) {
		let coord = ol.proj.transform(point.getCoordinates(), 'EPSG:3857', 'EPSG:' + projection); // La position actuelle de l'icone
		coord[nol] = parseFloat(evt.value); // On change la valeur qui a été modifiée
		point.setCoordinates(ol.proj.transform(coord, 'EPSG:' + projection, 'EPSG:3857')); // On repositionne l'icone
		this_.map_.getView().setCenter(point.getCoordinates());
	};

	this_.getPoint = function() {
		return point;
	};

	return this_;
}

/**
 * JSON.parse handling error
 */
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
 *
 * label {string} character to be displayed in the button.
 * options.className {string} className of the button.
 * options.rightPosition {float} distance to the top when the button is on the right of the map.
 * options.title {string} displayed when the control is hovered.
 * options.render {function} called when the control is rendered.
 * options.action {function} called when the control is clicked.
 */
let nextButtonTopPos = 6; // Top position of next button (em)

ol.control.Button = function(o) {
	const this_ = this, // For callback functions
		options = this.options_ = ol.assign({
			className: '',
			activeBackgroundColor: 'white',
			group: this // Main control of a group of controls
		}, o);

	const buttonElement = document.createElement('button'),
		divElement = document.createElement('div');

	ol.control.Control.call(this, ol.assign({
		element: divElement
	}, options));

	this.active = false;

	buttonElement.innerHTML = options.label || '';
	buttonElement.addEventListener('click', function(evt) {
		evt.preventDefault();
		this_.toggle();
	});

	divElement.appendChild(buttonElement);
	divElement.className = 'ol-button ol-unselectable ol-control ' + (options.className || '');
	divElement.title = options.title;
	if (options.rightPosition) {
		divElement.style.right = '.5em';
		divElement.style.top = options.rightPosition + 'em';
	} else if (options.label) { // Don't book a button if not visible
		divElement.style.left = '.5em';
		divElement.style.top = (nextButtonTopPos += 2) + 'em';
	}

	// Toggle the button status & aspect
	// In case of group buttons, set inactive the other one
	this.toggle = function(newActive) {
		this_.map_.getControls().forEach(function(control) {
			if (control.options_ &&
				control.options_.group == options.group) { // For all controls in the same group
				const setActive =
					control != this_ ? false :
					typeof newActive != 'undefined' ? newActive :
					!control.active;

				if (setActive != control.active) {
					control.active = setActive;
					control.element.firstChild.style.backgroundColor = control.active ? control.options_.activeBackgroundColor : 'white';

					if (typeof control.options_.activate == 'function')
						control.options_.activate(control.active);
				}
			}
		});
	};
};
ol.inherits(ol.control.Button, ol.control.Control);

/**
 * Layer switcher control
 * baseLayers {[ol.layer]} layers to be chosen one to fill the map.
 * Requires ol.control.Button & controlPermanentCheckbox
 * Requires 'myol:onadd' layer event
 * Requires permanentCheckboxList
 */
function controlLayersSwitcher(baseLayers) {
	let this_ = new ol.control.Button({
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
	this_.element.appendChild(rangeElement);

	// Layer selector
	const selectorElement = document.createElement('div');
	selectorElement.style.overflow = 'auto';
	selectorElement.title = 'Ctrl+click : multicouches';
	this_.element.appendChild(selectorElement);

	this_.on('myol:onadd', function(evt) {
		const map = evt.target.map_;

		// Base layers selector init
		for (let name in baseLayers) {
			const baseElement = document.createElement('div');
			baseElement.innerHTML =
				'<input type="checkbox" name="baselayer" value="' + name + '">' +
				'<span title="">' + name + '</span>';
			selectorElement.appendChild(baseElement);
			map.addLayer(baseLayers[name]);
		}

		// Make the selector memorized by cookies
		controlPermanentCheckbox('baselayer', displayLayerSelector);

		// Hover the button open the selector
		this_.element.firstElementChild.onmouseover = displayLayerSelector;

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
		for (let layerName in baseLayers) {
			baseLayers[layerName].setVisible(list.indexOf(layerName) !== -1);
			baseLayers[layerName].setOpacity(0);
		}
		baseLayers[list[0]].setOpacity(1);
		if (list.length >= 2)
			baseLayers[list[1]].setOpacity(rangeElement.value / 100);

		// Refresh control button, range & selector
		this_.element.firstElementChild.style.display = evt ? 'none' : '';
		rangeElement.style.display = evt && list.length > 1 ? '' : 'none';
		selectorElement.style.display = evt ? '' : 'none';
		selectorElement.style.maxHeight = (this_.map_.getTargetElement().clientHeight - 58 - (list.length > 1 ? 24 : 0)) + 'px';
	}

	return this_;
}

/**
 * Permalink control
 * "map" url hash or cookie = {map=<ZOOM>/<LON>/<LAT>/<LAYER>}
 * options.defaultPos {<ZOOM>/<LON>/<LAT>/<LAYER>} if nothing else is defined.
 * Requires 'myol:onadd' layer event
 */
function controlPermalink(o) {
	//TODO-ARCHI all : commenter les options, first is default
	const options = this.options_ = ol.assign({
			hash: '?', // {?, #} the permalink delimiter
			visible: true, // {true | false} add a controlPermalink button to the map.
			init: true // {true | false} use url hash or "controlPermalink" cookie to position the map.
		}, o),
		divElement = document.createElement('div'),
		aElement = document.createElement('a');
	let this_ = new ol.control.Control({
		element: divElement,
		render: render
	});
	let params = (location.hash + location.search).match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Priority to the hash
		document.cookie.match(/map=([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/) || // Then the cookie
		(options.defaultPos || '6/2/47').match(/([-0-9\.]+)\/([-0-9\.]+)\/([-0-9\.]+)/);

	this_.paramsCenter = [parseFloat(params[2]), parseFloat(params[3])];

	if (options.visible) {
		divElement.className = 'ol-permalink';
		aElement.innerHTML = 'Permalink';
		aElement.title = 'Generate a link with map zoom & position';
		divElement.appendChild(aElement);
	}

	function render(evt) {
		const view = evt.map.getView();

		// Set center & zoom at the init
		if (options.init && // If use hash & cookies
			params) { // Only once
			view.setZoom(params[1]);
			view.setCenter(ol.proj.transform(this_.paramsCenter, 'EPSG:4326', 'EPSG:3857'));
			params = null;
		}

		// Check the current map zoom & position
		const ll4326 = ol.proj.transform(view.getCenter(), 'EPSG:3857', 'EPSG:4326'),
			newParams = [
				parseInt(view.getZoom()),
				Math.round(ll4326[0] * 100000) / 100000,
				Math.round(ll4326[1] * 100000) / 100000
			];

		// Set the new permalink
		aElement.href = options.hash + 'map=' + newParams.join('/');
		document.cookie = 'map=' + newParams.join('/') + ';path=/';
	}

	return this_;
}

/**
 * GPS control
 * Requires ol.control.Button
 */
function controlGPS() {
	// Vérify if localisation is available
	if (!window.location.href.match(/https|localhost/i))
		return new ol.control.Control({ //HACK No button
			element: document.createElement('div'),
		});

	// The position marker
	const point_ = new ol.geom.Point([0, 0]),
		layer = new ol.layer.Vector({
			source: new ol.source.Vector({
				features: [new ol.Feature({
					geometry: point_
				})]
			}),
			style: new ol.style.Style({
				image: new ol.style.Icon({
					anchor: [0.5, 0.5], // Picto marking the position on the map
					src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAMAAAAoLQ9TAAAA7VBMVEUAAAA/X39UVHFMZn9NXnRPX3RMW3VPXXNOXHJOXXNNXHNOXXFPXHNNXXFPXHFOW3NPXHNPXXJPXXFPXXNNXXFNW3NOXHJPW25PXXNRX3NSYHVSYHZ0fIx1fo13gI95hJR6go96g5B7hpZ8hZV9hpZ9h5d/iZiBi5ucoquepa+fpbGhqbSiqbXNbm7Ob2/OcHDOcXHOcnLPdHTQdXXWiIjXiorXjIzenp7eoKDgpKTgpaXgpqbks7TktLTktbXnubnr2drr5+nr6Ons29vs29zs6Ors6ert6uvt6uzu6uz18fH18fL68PD++/v+/Pw8gTaQAAAAFnRSTlMACAkKLjAylJWWmJmdv8HD19ja2/n6GaRWtgAAAMxJREFUGBkFwctqwkAUgOH/nMnVzuDGFhRKKVjf/226cKWbQgNVkphMzFz6fQJQlY0S/boCAqa1AMAwJwRjW4wtcxgS05gEa3HHOYipzxP9ZKot9tR5ZfIff7FetMQcf4tDVexNd1IKbbA+7S59f9mlZGmMVVdpXN+3gwh+RiGLAjkDGTQSjHfhes3OV0+CkXrdL/4gzVunxQ+DYZNvn+Mg6aav35GH8OJS/SUrVTw/9e4FtRvypsbPwmPMAto6AOC+ZASgLBpDmGMA/gHW2Vtk8HXNjQAAAABJRU5ErkJggg=='
				})
			})
		}),

		// The control button
		this_ = new ol.control.Button({
			className: 'gps-button',
			title: 'Centrer sur la position GPS',
			activeBackgroundColor: '#ef3',
			activate: function(active) {
				geolocation.setTracking(active);
				if (active)
					this_.getMap().addLayer(layer);
				else
					this_.getMap().removeLayer(layer);
			}
		}),

		// Interface with the system GPS
		geolocation = new ol.Geolocation();

	geolocation.on('error', function(error) {
		alert('Geolocation error: ' + error.message);
	});

	geolocation.on('change', function() {
		const position = ol.proj.fromLonLat(this.getPosition());
		this_.getMap().getView().setCenter(position);
		point_.setCoordinates(position);
		if (typeof this_.callBack == 'function')
			this_.callBack(position);
	});

	return this_;
}

/**
 * Control to displays the length of a line overflown
 * Requires 'myol:onadd' layer event
 */
function controlLengthLine() {
	const divElement = document.createElement('div'),
		this_ = new ol.control.Control({
			element: divElement
		});

	this_.on('myol:onadd', function(evt) {
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

	return this_;
}

/**
 * GPX file loader control
 * Requires ol.control.Button
 */
//TODO-BEST En cas de chargement de trace GPS, colorier de façon différente des traces de la carte.
//TODO-BEST Pas d'upload/download sur mobile (-> va vers photos !)
function controlLoadGPX() {
	const inputElement = document.createElement('input'),
		this_ = new ol.control.Button({
			label: '&uArr;',
			title: 'Visualiser un fichier GPX sur la carte',
			activate: function() {
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
		const map = this_.getMap(),
			features = format.readFeatures(reader.result, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857'
			});

		if (map.editSource) { // If there is an active editor
			map.editSource.addFeatures(features); // Add the track to the editor

			// Zoom the map on the added features
			const extent = ol.extent.createEmpty();
			for (let f in features)
				ol.extent.extend(extent, features[f].getGeometry().getExtent());
			this_.getMap().getView().fit(extent);
		} else {
			// Display the track on the map
			const source = new ol.source.Vector({
					format: format,
					features: features
				}),
				vector = new ol.layer.Vector({
					source: source
				});
			this_.getMap().addLayer(vector);
			this_.getMap().getView().fit(source.getExtent());
		}
	};
	return this_;
}

/**
 * GPX file downloader control
 * Requires ol.control.Button
 * Requires 'myol:onadd' layer event
 */
function controlDownloadGPX(o) {
	const options = ol.assign({
			label: '&dArr;',
			title: 'Obtenir un fichier GPX contenant les éléments visibles dans la fenêtre.',
			fileName: 'trace.gpx'
		}, o),
		hiddenElement = document.createElement('a');

	//HACK for Moz
	hiddenElement.target = '_blank';
	hiddenElement.style = 'display:none;opacity:0;color:transparent;';
	(document.body || document.documentElement).appendChild(hiddenElement);

	options.activate = function(evt) {
		let features = [],
			extent = this.group.map_.getView().calculateExtent();

		// Get all visible features
		this.group.map_.getLayers().forEach(function(layer) {
			if (layer.getSource() && layer.getSource().forEachFeatureInExtent) // For vector layers only
				layer.getSource().forEachFeatureInExtent(extent, function(feature) {
					features.push(feature);
				});
		});

		// Write in GPX format
		const gpx = new ol.format.GPX().writeFeatures(features, {
				dataProjection: 'EPSG:4326',
				featureProjection: 'EPSG:3857',
				decimals: 5
			}),
			file = new Blob([gpx.replace(/>/g, ">\n")], {
				type: 'application/gpx+xml'
			});

		//HACK for IE/Edge
		if (typeof navigator.msSaveOrOpenBlob !== 'undefined')
			return navigator.msSaveOrOpenBlob(file, options.fileName);
		else if (typeof navigator.msSaveBlob !== 'undefined')
			return navigator.msSaveBlob(file, options.fileName);

		hiddenElement.href = URL.createObjectURL(file);
		hiddenElement.download = options.fileName;

		// Simulate the click & download the .gpx file
		if (typeof hiddenElement.click === 'function')
			hiddenElement.click();
		else
			hiddenElement.dispatchEvent(new MouseEvent('click', {
				view: window,
				bubbles: true,
				cancelable: true
			}));
	}

	return new ol.control.Button(options);
}

// HACK to display a title on the geocoder
//TODO-BEST ajuster le zoom geocoder pour le bon niveau IGN top25
window.addEventListener('load', function() {
	const buttonElement = document.getElementById('gcd-button-control');
	if (buttonElement)
		buttonElement.title = 'Recherche de lieu par son nom';
});

/**
 * Print control
 */
//TODO-RANDO impression full format page -> CSS
function controlPrint() {
	return new ol.control.Button({
		className: 'print-button',
		title: 'Imprimer la carte',
		activate: function() {
			window.print();
		}
	});
}

/**
 * Line & Polygons Editor
 * Requires ol.control.Button
 * Requires 'myol:onadd' layer event
 */
function controlEdit(inputId, options) {
	const inputEl = document.getElementById(inputId), // Read data in an html element
		format = new ol.format.GeoJSON(),
		features = format.readFeatures(
			JSONparse(inputEl.value || '{"type":"FeatureCollection","features":[]}'), {
				featureProjection: 'EPSG:3857' // Read/write data as ESPG:4326 by default
			}
		),
		source = new ol.source.Vector({
			features: features,
			wrapX: false
		}),
		layer = new ol.layer.Vector({
			source: source,
			zIndex: 20
		}),
		this_ = new ol.control.Button(ol.assign({
			label: 'M',
			title: 'Activer "M" (couleur jaune) puis\n' +
				'Cliquer et déplacer un sommet pour modifier une ligne ou un polygone\n' +
				'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
				'Alt+cliquer sur un sommet pour le supprimer\n' +
				'Alt+cliquer  sur un segment à supprimer dans une ligne pour la couper\n' +
				'Alt+cliquer  sur un segment à supprimer d\'un polygone pour le transformer en ligne\n' +
				'Joindre les extrémités deux lignes pour les fusionner\n' +
				'Joindre les extrémités d\'une ligne pour la transformer en polygone\n' +
				'Ctrl+Alt+cliquer sur un côté d\'une ligne ou d\'un polygone pour les supprimer',
			activeBackgroundColor: '#ef3',
			activate: function(active) {
				modify.setActive(active);
			}
		}, options));

	if (options.styleOptions) {
		layer.setStyle(
			new ol.style.Style(options.styleOptions)
		);
		options.editStyle = new ol.style.Style(ol.assign(
			options.styleOptions,
			options.editStyleOptions
		));
	}

	const hover = new ol.interaction.Select({
			layers: [layer],
			style: options.editStyle,
			condition: ol.events.condition.pointerMove,
			hitTolerance: 6
		}),
		snap = new ol.interaction.Snap({
			source: source
		}),
		modify = new ol.interaction.Modify({
			source: source,
			style: options.editStyle
		});

	this_.on('myol:onadd', function(evt) {
		const map = evt.target.map_;

		map.addLayer(layer);
		this_.toggle(options.enableAtInit); //TODO TEST : enable quand meme à l'init si toggle(false)

		//HACK Avoid zooming when you leave the mode by doubleclick
		//TODO-ARCHI ??? options.condition : singleClick;
		map.getInteractions().getArray().forEach(function(i) {
			if (i instanceof ol.interaction.DoubleClickZoom)
				map.removeInteraction(i);
		});

		// Add the draw buttons & interaction
		options.draw.forEach(function(drawOption) {
			const draw = new ol.interaction.Draw({
				type: drawOption.type,
				source: source,
				style: options.editStyle
			});
			map.addInteraction(draw);
			draw.setActive(false);
			draw.on(['drawend'], function(evt) {
				this_.toggle(true);
				this_.modified = true; // Optimize the source
			});

			map.addControl(new ol.control.Button(ol.assign({
				group: this_,
				label: drawOption.type.charAt(0),
				title: 'Activer "' + drawOption.type.charAt(0) + '" puis\n' +
					'Cliquer sur la carte et sur chaque désiré pour dessiner ' +
					(drawOption.type == 'Polygon' ? 'un polygone' : 'une ligne') +
					',\ndouble cliquer pour terminer.\n' +
					(drawOption.type == 'Polygon' ?
						'Si le nouveau polygone est entièrement compris dans un autre, il crée un "trou".' :
						'Cliquer sur une extrémité d\'une ligne pour l\'étendre'),
				activeBackgroundColor: '#ef3',
				activate: function(active) {
					draw.setActive(active);
				}
			}, drawOption)));
		});

		map.addInteraction(modify);
		map.addInteraction(snap);
		map.on('pointermove', function(evt) {
			map.addInteraction(hover);
		});

		// Snap on features external to the editor
		if (options.snapLayers)
			options.snapLayers.forEach(function(layer) {
				layer.getSource().on('change', function() {
					const fs = this.getFeatures();
					for (let f in fs)
						snap.addFeature(fs[f]);
				});
			});
	});

	modify.on('modifyend', function(evt) {
		const map = evt.target.map_;

		map.removeInteraction(hover);
		if (evt.mapBrowserEvent.originalEvent.altKey) {
			// altKey + ctrlKey : delete feature
			if (evt.mapBrowserEvent.originalEvent.ctrlKey) {
				const features = map.getFeaturesAtPixel(evt.mapBrowserEvent.pixel, {
					hitTolerance: 6
				});
				for (let f in features)
					if (features[f].getGeometry().getType() != 'Point')
						source.removeFeature(features[f]); // We delete the pointed feature
			}
			// altKey : delete segment
			else if (evt.target.vertexFeature_) // Click on a segment
				return editorActions(evt.target.vertexFeature_.getGeometry().getCoordinates());
		}
		// Other actions
		editorActions();
	});

	source.on(['change'], function() {
		if (this_.modified) { // Only when required to avoid recursive loops
			this_.modified = false;
			editorActions(); // Do it now as a feature has been added or changed
		}
	});

	function editorActions(pointerPosition) {
		// Get flattened list of multipoints coords
		const features = source.getFeatures(),
			lines = [],
			polys = [];
		for (let f in features)
			flatCoord(lines, features[f].getGeometry().getCoordinates(), pointerPosition);
		source.clear(); // And clear the edited layer

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

		// Save lines in <EL> as geoJSON at every change
		inputEl.value = format.writeFeatures(source.getFeatures(), {
			featureProjection: 'EPSG:3857',
			decimals: 5
		});
	}

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

	this_.source = source; // HACK for getting info from the edited features
	return this_;
}


/**
 * Controls examples
 */
var controlgps = controlGPS(); //TODO ARCHI intégrer ??

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
		//TODO-IE BUG : pas de géocodeur sur IE
		new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'FR',
			keepOpen: true,
			placeholder: 'Saisir un nom' // Initialization of the input field
		}),
		controlgps,
		controlLoadGPX(),
		controlDownloadGPX()
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
		'OSM trains': layerThunderforest('pioneer', keys.thunderforest),
		'OSM villes': layerThunderforest('neighbourhood', keys.thunderforest),
		'OSM contraste': layerThunderforest('mobile-atlas', keys.thunderforest),
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
		'Bing mixte': layerBing('AerialWithLabels', keys.bing),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google photo': layerGoogle('s'),
		'Google hybrid': layerGoogle('s,h'),
		Stamen: layerStamen('terrain'),
		Watercolor: layerStamen('watercolor'),
		'Neutre': new ol.layer.Tile()
	};
}
