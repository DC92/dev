/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */
//jshint esversion: 9

/**
 * Site chemineur.fr, alpages.info
 * layer: verbose (full data) | cluster (grouped points) | '' (simplified)
 */
function layerGeoBB(options) {
	return layerVectorCluster({
		selectName: 'select-chem',
		...options,
		convertProperties: function(properties) {
			if (properties.id)
				return {
					url: options.host + 'viewtopic.php?t=' + properties.id,
				};
		},
		displayStyle: function(feature, properties) { //TODO resorb properties
			return {
				...styleOptIcon(feature), // Points //TODO resorb
				stroke: new ol.style.Stroke({ // Lines
					color: 'blue',
					width: 2,
				}),
				...(typeof options.displayStyle == 'function' ? options.displayStyle(...arguments) : options.displayStyle),
			};
		},
		hoverStyle: function(feature, properties, layer) {
			return {
				...styleLabel(feature, agregateText([
					properties.name,
					properties.alt ? parseInt(properties.alt) + ' m' : '',
					properties.type,
					'&copy;' + layer.options.attribution,
				])),
				stroke: new ol.style.Stroke({ // Lines
					color: 'red',
					width: 3,
				}),
			};
		},
		urlParams: function(opt, bbox, selections) {
			return {
				path: 'ext/Dominique92/GeoBB/gis.php',
				cat: selections[0], // The 1st (and only selector)
				limit: 10000,
				bbox: bbox.join(','),
				...(typeof options.urlParams == 'function' ? options.urlParams(...arguments) : options.urlParams)
			};
		},
	});
}

function layerClusterGeoBB(opt) {
	const options = {
			transitionResolution: 100,
			...opt
		},
		clusterLayer = layerGeoBB({
			minResolution: options.transitionResolution,
			urlParams: {
				layer: 'cluster',
			},
			...options
		});

	return layerGeoBB({
		maxResolution: options.transitionResolution,
		altLayer: clusterLayer,
		...options
	});
}

/**
 * Site chemineur.fr
 */
function layerChemineur(opt) {
	const options = {
		host: '//chemineur.fr/',
		...opt
	};

	//TODO BUG pas de link sur cluster layer
	return layerClusterGeoBB({
		attribution: 'Chemineur',
		convertProperties: function(properties) {
			return {
				url: options.host + 'viewtopic.php?t=' + properties.id,
				icon: chemIconUrl(properties.type),
			};
		},
		...options
	});
}

// Get icon from chemineur.fr if we only have a type
function chemIconUrl(type) {
	if (type) {
		const icons = type.split(' ');

		return '//chemineur.fr/ext/Dominique92/GeoBB/icones/' +
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
		selectName: 'select-alpages',
		strategy: ol.loadingstrategy.all,
		attribution: 'Alpages',
		...options
	});
}

/**
 * Site refuges.info
 */
function layerWri(options) {
	return layerVectorCluster({ //TODO pas de cluster si appelé directement ???
		host: '//www.refuges.info/',
		selectName: 'select-wri',
		convertProperties: function(properties) {
			return {
				url: properties.lien,
				name: properties.nom,
			};
		},
		displayStyle: function(feature, properties, layer) {
			if (properties.type)
				return {
					image: new ol.style.Icon({
						src: layer.options.host + 'images/icones/' + properties.type.icone + '.svg',
					}),
				};
		},
		hoverStyle: function(feature, properties, layer) {
			return styleLabel(feature, agregateText([
				properties.nom,
				agregateText([
					properties.coord && properties.coord.alt ? parseInt(properties.coord.alt) + ' m' : '',
					properties.places && properties.places.valeur ? parseInt(properties.places.valeur) + '\u255E\u2550\u2555' : '',
				], ', '),
				properties.type ? properties.type.valeur : '',
				'&copy;' + layer.options.attribution,
			]));
		},
		attribution: 'refuges.info',
		...options,
		urlParams: function(o, bbox, selections) {
			return {
				path: selections[1] ? 'api/massif' : 'api/bbox',
				type_points: selections[0],
				massif: selections[1],
				nb_points: 'all',
				bbox: bbox.join(','),
				...(typeof options.urlParams == 'function' ? options.urlParams(...arguments) : options.urlParams)
			};
		},
	});
}

function layerClusterWri(opt) {
	const options = {
			transitionResolution: 100,
			...opt
		},
		clusterLayer = layerWri({
			minResolution: options.transitionResolution,
			strategy: ol.loadingstrategy.all,
			urlParams: {
				cluster: 0.1,
			},
			...options
		});

	return layerWri({
		maxResolution: options.transitionResolution,
		altLayer: clusterLayer,
		...options
	});
}

function layerWriAreas(options) {
	return layerVector({
		host: '//www.refuges.info/',
		urlParams: {
			path: 'api/polygones',
			type_polygon: 1, // Massifs
		},
		strategy: ol.loadingstrategy.all,
		zIndex: 2, // Behind points
		selectName: 'select-massifs',
		convertProperties: function(properties) {
			return {
				name: properties.nom,
				color: properties.couleur,
				url: properties.lien,
			};
		},
		styleOptFnc: function(feature, properties) { //TODO resorb properties
			return {
				...styleOptLabel(feature),
				...styleOptPolygon(properties.color),
			};
		},
		hoverStyle: function(feature) {
			const properties = feature.getProperties();

			// Invert previous color
			const colors = properties.color
				.match(/([0-9a-f]{2})/ig)
				.map(c =>
					(255 - parseInt(c, 16))
					.toString(16).padStart(2, '0')
				)
				.join('');

			return {
				...styleOptLabel(feature, true),
				...styleOptPolygon('#' + colors, 0.3),
				stroke: new ol.style.Stroke({
					color: properties.color,
					width: 3,
				}),
			};
		},
		...options
	});
}

/**
 * Site pyrenees-refuges.com
 */
function layerPrc(options) {
	return layerVectorCluster({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		selectName: 'select-prc',
		strategy: ol.loadingstrategy.all,
		convertProperties: function(properties) {
			return {
				type: properties.type_hebergement,
				icon: chemIconUrl(properties.type_hebergement),
				url: properties.url,
				ele: properties.altitude,
				capacity: properties.cap_ete,
				attribution: 'Pyrenees-Refuges',
			};
		},
		styleOptFnc: styleOptIcon,
		hoverStyle: styleOptFullLabel,
		...options
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
					type: properties.waypoint_type,
					icon: chemIconUrl(properties.waypoint_type),
					name: properties.locales[0].title,
					ele: properties.elevation,
					url: '//www.camptocamp.org/waypoints/' + properties.document_id,
					attribution: 'campTOcamp',
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
		urlParams: function(o, b, s, extent) {
			return {
				path: 'waypoints',
				bbox: extent.join(','),
			};
		},
		selectName: 'select-c2c',
		format: format,
		styleOptFnc: styleOptIcon,
		hoverStyle: styleOptFullLabel,
		...options
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

			selectName: 'select-osm',
			maxResolution: 50,
			styleOptFnc: styleOptIcon,
			hoverStyle: styleOptFullLabel,
			...opt
		},
		format = new ol.format.OSMXML(),
		layer = layerVectorCluster({
			urlParams: urlParams,
			format: format,
			...options
		}),
		statusEl = document.getElementById(options.selectName),
		selectEls = document.getElementsByName(options.selectName);

	// List of acceptable tags in the request return
	let tags = '';

	for (let e in selectEls)
		if (selectEls[e].value)
			tags += selectEls[e].value.replace('private', '');

	function urlParams(o, bbox, selections) {
		const items = selections[0].split(','), // The 1st (and only selector)
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
						addTag(node, 'attribution', 'osm');
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