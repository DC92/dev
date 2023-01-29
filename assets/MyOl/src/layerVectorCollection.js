/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */
//jshint esversion: 9

/**
 * Site chemineur.fr, alpages.info
 */
function layerGeoBB(options) {
	return layerVectorCluster({
		strategy: ol.loadingstrategy.bbox,
		...options,
		urlParams: (opt, bbox, selections) => ({
			path: 'ext/Dominique92/GeoBB/gis.php',
			cat: selections[0] == 'on' ? null : selections[0], // The 1st (and only) selector
			limit: 10000,
			bbox: bbox.join(','),
			...functionLike(options.urlParams, ...arguments),
		}),
		convertProperties: function(properties) {
			return {
				url: properties.id ? options.host + 'viewtopic.php?t=' + properties.id : null,
				...functionLike(options.convertProperties, ...arguments),
			};
		},
	});
}

function layerClusterGeoBB(opt) {
	const options = {
			transitionResolution: 100,
			...opt,
		},
		clusterLayer = layerGeoBB({
			minResolution: options.transitionResolution,
			urlParams: {
				layer: 'cluster',
			},
			...options,
		});

	return layerGeoBB({
		maxResolution: options.transitionResolution,
		altLayer: clusterLayer,
		...options,
	});
}

/**
 * Site chemineur.fr
 */
function layerChemineur(options) {
	return layerClusterGeoBB({
		host: '//chemineur.fr/',
		...options,
		convertProperties: (properties, opt) => ({
			url: opt.host + 'viewtopic.php?t=' + properties.id,
			icon: chemIconUrl(properties.type),
			attribution: '&copy;Chemineur',
			...functionLike(options.convertProperties, ...arguments),
		}),
		displayStyle: {
			// Lines
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
		},
		hoverStyle: function(feature, properties) {
			const elLabel = document.createElement('span');
			elLabel.innerHTML = properties.name;

			// Lines labels
			if (ol.extent.getArea(feature.getGeometry().getExtent()))
				return {
					text: new ol.style.Text({
						text: elLabel.innerHTML,
						placement: 'line',
						textBaseline: 'middle',
						overflow: true,
						offsetY: -8,
						font: '12px Verdana',
						fill: new ol.style.Fill({
							color: 'blue',
						}),
						stroke: new ol.style.Stroke({
							color: 'white',
							width: 5,
						}),
					}),
				};
		},
	});
}

// Get icon from chemineur.fr if we only have a type
function chemIconUrl(type) {
	if (type) {
		const icons = type.split(' ');

		return 'https://chemineur.fr/ext/Dominique92/GeoBB/icones/' +
			icons[0] + (icons.length > 1 ? '_' + icons[1] : '') + // Limit to 2 type names & ' ' -> '_'
			'.svg';
	}
}

/**
 * Site alpages.info
 */
function layerAlpages(options) {
	return layerGeoBB({
		host: '//alpages.info/',
		...options,
		urlParams: {
			forums: '4,5',
			cat: null,
		},
		convertProperties: function(properties) {
			return {
				icon: chemIconUrl(properties.type),
				attribution: '&copy;Alpages.info',
			};
		},
	});
}

/**
 * Site refuges.info
 */
function layerWri(options) {
	return layerVectorCluster({ //BEST cas de WRI sans cluster local ?
		host: '//www.refuges.info/',
		strategy: ol.loadingstrategy.bbox,
		...options,
		urlParams: function(o, bbox, selections) {
			return {
				path: selections[1] ? 'api/massif' : 'api/bbox',
				type_points: selections[0],
				massif: selections[1],
				nb_points: 'all',
				bbox: bbox.join(','),
				...functionLike(options.urlParams, ...arguments),
			};
		},
		convertProperties: function(properties, opt) {
			return {
				name: properties.nom,
				url: properties.lien,
				icon: opt.host + 'images/icones/' + properties.type.icone + '.svg',
				ele: properties.coord ? properties.coord.alt : 0,
				bed: properties.places ? properties.places.valeur : 0,
				type: properties.type ? properties.type.valeur : null,
				attribution: '&copy;Refuges.info',
				...functionLike(options.convertProperties, ...arguments),
			};
		},
	});
}

function layerClusterWri(opt) {
	const options = {
			transitionResolution: 100,
			...opt,
		},
		clusterLayer = layerWri({
			minResolution: options.transitionResolution,
			...options,
			urlParams: {
				cluster: 0.1,
			},
		});

	return layerWri({
		maxResolution: options.transitionResolution,
		altLayer: clusterLayer,
		...options,
	});
}

// Specific format used by refuges.info
function layerWriWri(options) {
	function labelOptions(feature, properties, layer, resolution) {
		const coordinates = feature.getGeometry().getCoordinates(),
			closest = layer.getSource().getClosestFeatureToCoordinate(coordinates, f => f != feature),
			distance = ol.sphere.getDistance(
				ol.proj.transform(coordinates, 'EPSG:3857', 'EPSG:4326'),
				ol.proj.transform(closest.getGeometry().getCoordinates(), 'EPSG:3857', 'EPSG:4326'),
			),
			anchor = feature.getId() * 3.14 % 1.6 - .03;

		if (distance < 16 * resolution &&
			resolution < layer.options.minClusterResolution)
			return {
				offsetX: -anchor * 24 + 24,
				offsetY: -anchor * 24 + 6,
				textAlign: 'left',
				anchor: anchor,
			};
	}

	return layerClusterWri({
		// Specific formats to be added to the basic one
		displayStyle: function(feature, properties, layer, resolution) {
			const lo = labelOptions(feature, properties, layer, resolution);

			// Shift anchor of features too closed
			if (properties.icon)
				return {
					...styleLabel(feature, properties.nom, lo),
					image: new ol.style.Icon({
						src: properties.icon,
						anchor: lo ? [lo.anchor, lo.anchor] : [0.5, 0.5],
					}),
				};
		},
		hoverStyle: (feature, properties, layer, resolution) => styleLabelFull(
			feature,
			properties,
			labelOptions(...arguments),
		),

		// Don't display attribution on labels
		convertProperties: {
			attribution: null,
		},

		// Don't cluster under resolution = 5
		minClusterResolution: 5,

		...options,
	})
}

function layerWriAreas(options) {
	return layerVector({
		host: '//www.refuges.info/',
		urlParams: {
			path: 'api/polygones',
			type_polygon: 1, // Massifs
		},
		zIndex: 2, // Behind points
		...options,
		convertProperties: properties => ({
			url: properties.lien,
		}),
		displayStyle: function(feature, properties) {
			// Build color and transparency
			const colors = properties.couleur
				.match(/([0-9a-f]{2})/ig)
				.map(c => parseInt(c, 16));

			return {
				...styleLabel(feature, properties.nom, {
					padding: [1, -1, -1, 1],
					backgroundStroke: null,
					font: null,
				}),
				fill: new ol.style.Fill({
					color: 'rgba(' + colors.join(',') + ',0.3)'
				}),
			};
		},
		hoverStyle: (feature, properties) => ({
			...styleLabel(feature, properties.nom, {
				padding: [1, 0, -1, 2],
				font: '12px Verdana',
				overflow: true, // Force display even if no place
			}),
			fill: new ol.style.Fill({
				color: 'rgba(0,0,0,0)', // Transparent
			}),
			stroke: new ol.style.Stroke({
				color: properties.couleur,
				width: 2,
			}),
		}),
	});
}

/**
 * Site pyrenees-refuges.com
 */
function layerPrc(options) {
	return layerVectorCluster({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		convertProperties: properties => ({
			type: properties.type_hebergement,
			url: properties.url,
			icon: chemIconUrl(properties.type_hebergement),
			ele: properties.altitude,
			capacity: properties.cap_ete,
			attribution: '&copy;Pyrenees-Refuges',
		}),
		...options,
	});
}

/**
 * Site camptocamp.org
 */
function layerC2C(options) {
	const format = new ol.format.GeoJSON({ // Format of received data
		dataProjection: 'EPSG:3857',
	});

	format.readFeatures = function(json, opt) {
		const features = [],
			objects = JSONparse(json);

		for (let o in objects.documents) {
			const properties = objects.documents[o];

			features.push({
				id: properties.document_id,
				type: 'Feature',
				geometry: JSONparse(properties.geometry.geom),
				properties: {
					name: properties.locales[0].title,
					type: properties.waypoint_type,
					icon: chemIconUrl(properties.waypoint_type),
					ele: properties.elevation,
					url: '//www.camptocamp.org/waypoints/' + properties.document_id,
					attribution: '&copy;Camp2camp',
				},
			});
		}
		return format.readFeaturesFromObject({
				type: 'FeatureCollection',
				features: features,
			},
			format.getReadOptions(json, opt)
		);
	};

	return layerVectorCluster({
		host: 'https://api.camptocamp.org/',
		strategy: ol.loadingstrategy.bbox,
		format: format,
		...options,
		urlParams: (o, b, s, extent) => ({
			path: 'waypoints',
			bbox: extent.join(','),
		}),
	});
}

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
function layerOverpass(opt) {
	const options = {
			//host: 'https://overpass-api.de',
			//host: 'https://lz4.overpass-api.de',
			//host: 'https://overpass.openstreetmap.fr', // Out of order
			//host: 'https://overpass.nchc.org.tw',
			host: 'https://overpass.kumi.systems',
			maxResolution: 50,
			...opt,
		},
		format = new ol.format.OSMXML(),
		layer = layerVectorCluster({
			strategy: ol.loadingstrategy.bbox,
			urlParams: urlParams,
			format: format,
			...options,
		}),
		statusEl = document.getElementById(options.selectName),
		selectEls = document.getElementsByName(options.selectName);

	// List of acceptable tags in the request return
	let tags = '';

	for (let e in selectEls)
		if (selectEls[e].value)
			tags += selectEls[e].value.replace('private', '');

	function urlParams(o, bbox, selections) {
		const items = selections[0].split(','), // The 1st (and only) selector
			bb = '(' + bbox[1] + ',' + bbox[0] + ',' + bbox[3] + ',' + bbox[2] + ');',
			args = [];

		// Convert selected items on overpass_api language
		for (let l = 0; l < items.length; l++) {
			const champs = items[l].split('+');

			for (let ls = 0; ls < champs.length; ls++)
				args.push(
					'node' + champs[ls] + bb + // Ask for nodes in the bbox
					'way' + champs[ls] + bb // Also ask for areas
				);
		}

		return {
			path: '/api/interpreter',
			data: '[timeout:5];(' + args.join('') + ');out center;',
		};
	}

	// Extract features from data when received
	format.readFeatures = function(doc, opt) {
		// Transform an area to a node (picto) at the center of this area

		for (let node = doc.documentElement.firstElementChild; node; node = node.nextSibling) {
			// Translate attributes to standard MyOl
			for (let tag = node.firstElementChild; tag; tag = tag.nextSibling)
				if (tag.attributes) {
					if (tags.indexOf(tag.getAttribute('k')) !== -1 &&
						tags.indexOf(tag.getAttribute('v')) !== -1 &&
						tag.getAttribute('k') != 'type') {
						addTag(node, 'type', tag.getAttribute('v'));
						addTag(node, 'icon', chemIconUrl(tag.getAttribute('v')));
						// Only once for a node
						addTag(node, 'url', 'https://www.openstreetmap.org/node/' + node.id);
						addTag(node, 'attribution', '&copy;OpenStreetMap');
					}

					if (tag.getAttribute('k') && tag.getAttribute('k').includes('capacity:'))
						addTag(node, 'capacity', tag.getAttribute('v'));
				}

			// Create a new 'node' element centered on the surface
			if (node.nodeName == 'way') {
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
							addTag(newNode, 'nodetype', node.nodeName);
						}
					}
			}

			// Status 200 / error message
			if (node.nodeName == 'remark' && statusEl)
				statusEl.textContent = node.textContent;
		}

		function addTag(node, k, v) {
			const newTag = doc.createElement('tag');
			newTag.setAttribute('k', k);
			newTag.setAttribute('v', v);
			node.appendChild(newTag);
		}

		return ol.format.OSMXML.prototype.readFeatures.call(this, doc, opt);
	};

	return layer;
}

/**
 * Vectors layers examples
 */
function layerVectorCollection(options) {
	options = options || {};

	return [
		layerClusterWri(options.wri),
		layerWriAreas(options.wriAreas),
		layerPrc(options.prc),
		layerC2C(options.c2c),
		layerOverpass(options.osm),
		layerChemineur(options.chemineur),
		layerAlpages(options.alpages),
	];
}