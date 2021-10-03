/**
 * This file implements various acces to geoJson services
 * using MyOl/src/layerVector.js
 */

/**
 * Common function
 */
//TODO DELETE
function fillColorOption(hexColor, transparency) {
	return hexColor ? {
		textOptions: {
			overflow: true, // Force polygons label display when decluttering
		},
		fill: fillColorStyle(hexColor, transparency),
	} : {};
}

//TODO DELETE
function fillColorStyle(hexColor, transparency) {
	return hexColor ? new ol.style.Fill({
		color: rgbaColor(hexColor, transparency),
	}) : {};
}

function rgbaColor(hexColor, transparency) {
	return 'rgba(' + [
		parseInt(hexColor.substring(1, 3), 16),
		parseInt(hexColor.substring(3, 5), 16),
		parseInt(hexColor.substring(5, 7), 16),
		transparency || 1,
	].join(',') + ')';
}

/* Virtual function with custom styles
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
function myLayer(options) {
	return layerVectorCluster(Object.assign({
		styleOptions: function(feature, properties, options) {
			// Points
			if (properties.type) {
				styleOptions = {
					text: new ol.style.Text({
						text: properties.name || properties.nom, //TODO   htmlcars + first upper + _
						textBaseline: 'bottom',
						offsetY: -13, // Balance the bottom textBaseline
						padding: [0, 1, 0, 1],
						font: '14px Calibri,sans-serif',
						fill: new ol.style.Fill({
							color: 'black',
						}),
						backgroundFill: new ol.style.Fill({
							color: 'yellow',
						}),
					}),
				};

				if (feature.display.icon)
					styleOptions.image = new ol.style.Icon({
						src: feature.display.icon,
						imgSize: [24, 24], // I.E. compatibility //BEST automatic detect
					});

				return styleOptions;
			}

			// Clusters
			else if (properties.features)
				return {
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
						text: properties.features.length.toString(),
						font: '14px Calibri,sans-serif',
					}),
				};
		},

		hoverStyleOptions: function(feature, properties) {
			const hover = [],
				line = [];

			if (properties.type) {
				if (properties.type.valeur) // Refuges.info
					properties.type = properties.type.valeur;
				hover.push(properties.type[0].toUpperCase() + properties.type.substring(1).replace('_', ' '));
				if (properties.coord && properties.coord.alt) // Refuges.info
					properties.alt = properties.coord.alt;
				if (properties.alt)
					line.push(properties.alt + 'm');
				if (properties.places && properties.places.valeur)
					line.push(properties.places.valeur + '\u255E\u2550\u2555');
				if (line.length)
					hover.push(line.join(', '));
				hover.push(properties.name || properties.nom);
			}

			// Points
			return {
				text: new ol.style.Text({ //TODO reuse points def of text label
					text: hover.join('\n') || 'Cliquer pour zoomer',
					textBaseline: 'bottom',
					offsetY: -13, // Balance the bottom textBaseline
					padding: [0, 1, 0, 1],
					font: '14px Calibri,sans-serif',
					fill: new ol.style.Fill({
						color: 'black',
					}),
					backgroundFill: new ol.style.Fill({
						color: 'yellow',
					}),
				}),
			};
		},
	}, options));
}

/**
 * Site refuges.info
 */
//BEST min & max layer in the same function
function layerWri(options) {
	return myLayer(Object.assign({
		host: '//www.refuges.info/',
		nb_points: 'all',
		urlFunction: function(options, bbox, selection) {
			return options.host + 'api/bbox' +
				'?nb_points=' + options.nb_points +
				'&type_points=' + selection.join(',') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, feature, options) {
			return {
				url: properties.lien,
				icon: options.host + 'images/icones/' + properties.type.icone + '.svg',
			};
		},
	}, options));
}

function layerWriAreas(options) {
	return layerVector(Object.assign({
		host: '//www.refuges.info/',
		polygon: 1, // Massifs
		urlFunction: function(options) {
			return options.host + 'api/polygones?type_polygon=' + options.polygon;
		},
		displayProperties: function(properties) {
			return {
				name: properties.nom,
				url: properties.lien,
			};
		},
		styleOptions: function(feature, properties) {
			return {
				text: new ol.style.Text({
					text: properties.nom,
					font: 'bold 14px Calibri,sans-serif',
					fill: new ol.style.Fill({
						color: 'black',
					}),
				}),
				fill: new ol.style.Fill({
					color: rgbaColor(feature.get('couleur'), 0.5),
				}),
			};
		},
		hoverStyleOptions: function(feature, properties) {
			return {
				text: new ol.style.Text({
					text: properties.nom,
					overflow: true, // Force polygons label display when decluttering
					font: 'bold 14px Calibri,sans-serif',
					fill: new ol.style.Fill({
						color: 'black',
					}),
					backgroundFill: new ol.style.Fill({
						color: 'white',
					}),
				}),
				fill: new ol.style.Fill({
					color: rgbaColor(feature.get('couleur'), 0.7),
				}),
			};
		},
	}, options));
}

/**
 * Site chemineur.fr
 */
//BEST min & max layer in the same function
function layerGeoBB(options) {
	return myLayer(Object.assign({
		host: '//chemineur.fr/',
		urlFunction: function(options, bbox, selection) {
			return options.host +
				'ext/Dominique92/GeoBB/gis.php?limit=10000' +
				'&layer=' + (options.subLayer || 'simple') +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, feature, options) {
			return {
				url: options.host + 'viewtopic.php?t=' + properties.id,
				icon: options.host + 'ext/Dominique92/GeoBB/icones/' + properties.type + '.svg',
			};
			return properties;
		},
	}, options));
}

/**
 * Site alpages.info
 */
function layerAlpages(options) {
	return layerVectorCluster(Object.assign({
		host: '//alpages.info/',
		urlFunction: function(options, bbox, selection) {
			return options.host +
				'ext/Dominique92/GeoBB/gis.php?limit=500' +
				(options.selectorName ? '&forums=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		//distance: 30, //BEST BUG dédouble les points si cluster
		displayProperties: function(properties, feature, options) {
			const match = properties.icon.match(new RegExp('/([a-z_0-9]+).png'));
			if (match)
				properties.iconchem = match[1];

			properties.url = options.host + 'viewtopic.php?t=' + properties.id;
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
	//TODO+ strategie bboxLimit
	const format = new ol.format.OSMXML(),
		layer = layerVectorCluster(Object.assign({
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
	return layerVectorCluster(Object.assign({
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

	return layerVectorCluster(Object.assign({
		urlFunction: function(options, bbox, selection, extent) {
			return 'https://api.camptocamp.org/waypoints?bbox=' + extent.join(',');
		},
		format: format,
		strategy: ol.loadingstrategy.bboxLimit, //TODO ???
	}, options));
}