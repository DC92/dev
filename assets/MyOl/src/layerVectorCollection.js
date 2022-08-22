/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */

/**
 * Site chemineur.fr, alpages.info
 * subLayer: verbose (full data) | cluster (grouped points) | '' (simplified)
 */
function layerGeoBB(opt) {
	return layerVectorCluster({
		argSelName: 'cat',
		urlArgsFunction: function(options, bbox, selection) {
			return {
				url: options.host + 'ext/Dominique92/GeoBB/gis.php',
				limit: 10000,
				[options.argSelName]: selection.join(','),
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
// Combined server clusterised (high resolutions) + not clusterised (low resolutions)
// Use with spread operator ...layersGeoBB(options)
function layersGeoBB(opt) {
	const options = {
		switchResolution: 100,
		distanceMinCluster: 30,
		...opt
	};

	return [
		layerGeoBB({
			maxResolution: options.switchResolution,
			...options
		}),
		layerGeoBB({
			subLayer: 'cluster',
			minResolution: options.switchResolution,
			...options
		}),
	];
}

/**
 * Site refuges.info
 */
function layerWri(opt) {
	return layerVectorCluster({
		host: '//www.refuges.info/',
		urlArgsFunction: function(options, bbox, selection) {
			return {
				url: options.host + (options.massif ? 'api/massif' : 'api/bbox'),
				massif: options.massif,
				type_points: selection.join(','),
				cluster: options.cluster,
				bbox: bbox.join(','),
			};
		},
		convertProperties: function(properties, f, options) {
			return {
				type: properties.type.valeur,
				name: properties.nom,
				icon: options.host + 'images/icones/' + properties.type.icone + '.' + iconCanvasExt(),
				ele: properties.coord ? properties.coord.alt : null,
				capacity: properties.places ? properties.places.valeur : null,
				url: options.noClick ? null : properties.lien,
				attribution: options.attribution,
			};
		},
		styleOptionsFunction: function(f, properties) {
			return styleOptionsIcon(properties.icon);
		},
		hoverStyleOptionsFunction: function(f, properties) {
			return styleOptionsFullLabel(properties);
		},
		attribution: '<a href="https://www.refuges.info">Refuges.info</a>',
		...opt
	});
}

// Combined server clusterised (high resolutions) + not clusterised (low resolutions)
// Use with spread operator ...layersWri(options)
function layersWri(opt) {
	const options = {
		switchResolution: 500,
		distanceMinCluster: 30,
		...opt
	};

	return [
		layerWri({
			maxResolution: options.switchResolution,
			...options
		}),
		layerWri({
			cluster: true,
			minResolution: options.switchResolution,
			...options
		}),
	];
}

function layerWriAreas(opt) {
	return layerVector({
		host: '//www.refuges.info/',
		polygon: 1, // Massifs
		urlArgsFunction: function(options) {
			return {
				url: options.host + 'api/polygones',
				type_polygon: options.polygon,
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
			return {
				...styleOptionsLabel(properties.name, properties, true),
				...styleOptionsPolygon(properties.color, 1),
			};
		},
		...opt
	});
}

/**
 * Site pyrenees-refuges.com
 */
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

	function urlArgsFunction(o, bbox, selection) {
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

		return {
			url: 'https://' + options.host + '/api/interpreter',
			data: '[timeout:5];(' + args.join('') + ');out center;',
		};
	};

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