/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */

/**
 * Site chemineur.fr, alpages.info
 * layer: verbose (full data) | cluster (grouped points) | '' (simplified)
 */
function layerGeoBB(opt) {
	return layerVectorCluster({
		argSelName: 'cat',
		urlArgsFunction: function(options, bbox, selections) {
			return {
				url: options.host + 'ext/Dominique92/GeoBB/gis.php',
				limit: 10000,
				layer: options.cluster ? 'cluster' : null,
				[options.argSelName]: selections[0], // The 1st (and only selector)
				bbox: bbox.join(','),
			};
		},
		convertProperties: function(properties, f, options) {
			return {
				icon: properties.type ?
					options.host + 'ext/Dominique92/GeoBB/icones/' + properties.type + '.' + iconCanvasExt() : null,
				url: properties.id ?
					options.host + 'viewtopic.php?t=' + properties.id : null,
				attribution: options.attribution,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return {
				...styleOptionsIcon(properties.icon), // Points
				...styleOptionsPolygon(properties.color, 0.5), // Polygons with color
				stroke: new ol.style.Stroke({ // Lines
					color: 'blue',
					width: 2,
				}),
			};
		},
		hoverStyleOptionsFunction: function(f, properties) {
			return {
				...styleOptionsFullLabel(properties), // Labels
				stroke: new ol.style.Stroke({ // Lines
					color: 'red',
					width: 3,
				}),
			};
		},
		...opt
	});
}

/**
 * Site refuges.info
 */
function layerWri(options) {
	return layerVectorCluster({
		host: '//www.refuges.info/',
		urlArgsFunction: function(opt, bbox, selections) {
			return {
				url: opt.host + (selections[1] ? 'api/massif' : 'api/bbox'),
				type_points: selections[0],
				massif: selections[1],
				cluster: options.cluster,
				nb_points: 'all',
				bbox: bbox.join(','),
			};
		},
		convertProperties: function(properties, f, opt) {
			return {
				type: properties.type.valeur,
				name: properties.nom,
				icon: opt.host + 'images/icones/' + properties.type.icone + '.' + iconCanvasExt(),
				ele: properties.coord ? properties.coord.alt : null,
				capacity: properties.places ? properties.places.valeur : null,
				url: opt.noClick ? null : properties.lien,
				attribution: opt.attribution,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIcon(properties.icon);
		},
		hoverStyleOptionsFunction: function(f, properties) {
			return styleOptionsFullLabel(properties);
		},
		attribution: '<a href="https://www.refuges.info">Refuges.info</a>',
		...options
	});
}

function layerWriAreas(options) {
	return layerVector({
		host: '//www.refuges.info/',
		strategy: ol.loadingstrategy.all,
		polygon: 1, // Massifs
		zIndex: 2, // Behind points
		urlArgsFunction: function(opt) {
			return {
				url: opt.host + 'api/polygones',
				type_polygon: opt.polygon,
			};
		},
		convertProperties: function(properties) {
			return {
				name: properties.nom,
				color: properties.couleur,
				url: properties.lien,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return {
				...styleOptionsLabel(properties.name, properties),
				...styleOptionsPolygon(properties.color, 0.5),
			};
		},
		hoverStyleOptionsFunction: function(f, properties) {
			// Invert previous color
			const colors = properties.color
				.match(/([0-9a-f]{2})/ig)
				.map(c =>
					(255 - parseInt(c, 16))
					.toString(16).padStart(2, '0')
				)
				.join('');

			return {
				...styleOptionsLabel(properties.name, properties, true),
				...styleOptionsPolygon('#' + colors, 0.3),
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
//TODO BUG rame au chargement
function layerPyreneesRefuges(options) {
	return layerVectorCluster({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		strategy: ol.loadingstrategy.all,
		convertProperties: function(properties) {
			return {
				type: properties.type_hebergement,
				url: properties.url,
				ele: properties.altitude,
				capacity: properties.cap_ete,
				attribution: '<a href="https://pyrenees-refuges.com">Pyrenees-Refuges</a>',
			};
		},
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIconChemineur(properties.type_hebergement);
		},
		hoverStyleOptionsFunction: function(f, properties) {
			return styleOptionsFullLabel(properties);
		},
		...options
	});
}

/**
 * Site camptocamp.org
 */
//TODO BUG pas d'étiquettes au survol
function layerC2C(opt) {
	const format = new ol.format.GeoJSON({ // Format of received data
		dataProjection: 'EPSG:3857',
	});

	format.readFeatures = function(json, options) {
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
					name: properties.locales[0].title,
					ele: properties.elevation,
					url: '//www.camptocamp.org/waypoints/' + properties.document_id,
					attribution: '<a href="https://www.camptocamp.org">CampToCamp</a>',
				},
			});
		}
		return format.readFeaturesFromObject({
				type: 'FeatureCollection',
				features: features,
			},
			format.getReadOptions(json, options)
		);
	};

	return layerVectorCluster({
		urlArgsFunction: function(o, b, s, extent) {
			return {
				url: 'https://api.camptocamp.org/waypoints',
				bbox: extent.join(','),
			};
		},
		format: format,
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIconChemineur(properties.type);
		},
		hoverStyleOptionsFunction: function(f, properties) {
			return styleOptionsFullLabel(properties);
		},
		...opt
	});
}

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
function layerOverpass(opt) {
	const format = new ol.format.OSMXML(),
		options = {
			//host: 'overpass-api.de',
			//host: 'lz4.overpass-api.de',
			//host: 'overpass.openstreetmap.fr', // Out of order
			host: 'overpass.kumi.systems',
			//host: 'overpass.nchc.org.tw',

			urlArgsFunction: urlArgsFunction,
			maxResolution: 50,
			format: format,
			convertProperties: convertProperties,
			styleOptionsFunction: function(f, properties) {
				return styleOptionsIconChemineur(properties.type);
			},
			hoverStyleOptionsFunction: function(f, properties) {
				return styleOptionsFullLabel(properties);
			},
			...opt
		},
		layer = layerVectorCluster(options),
		statusEl = document.getElementById(options.selectorName),
		selectorEls = document.getElementsByName(options.selectorName);

	// List of acceptable tags in the request return
	let tags = '';

	for (let e in selectorEls)
		if (selectorEls[e].value)
			tags += selectorEls[e].value.replace('private', '');

	function urlArgsFunction(o, bbox, selections) {
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
			url: 'https://' + options.host + '/api/interpreter',
			data: '[timeout:5];(' + args.join('') + ');out center;',
		};
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

	function convertProperties(properties, feature) {
		for (let p in properties)
			if (tags.indexOf(p) !== -1 && tags.indexOf(properties[p]) !== -1)
				return {
					type: properties[p],
					name: properties.name || properties[p],
					ele: properties.ele,
					capacity: properties.capacity,
					url: 'https://www.openstreetmap.org/node/' + feature.getId(),
					attribution: '<a href="https://www.openstreetmap.org/">osm</a>',
				};
	}

	return layer;
}