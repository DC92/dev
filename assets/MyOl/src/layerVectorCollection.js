/* jshint esversion: 6 */

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
function layerWriPoi(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		urlFunction: function(options, bbox, selection) {
			return '//' + options.host + '/api/bbox' +
				'?nb_points=all' +
				'&type_points=' + selection.join(',') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, options) {
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
function layerChemPoi(options) {
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		urlFunction: function(options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?layer=simple&' +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		displayProperties: function(properties, options) {
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
		displayProperties: function(properties, options) {
			//TODO add 'Oil feild' icon in chemineur.fr
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
	const layer = layerVector(Object.assign({
		maxResolution: 50,
		host: 'https://overpass-api.de/api/interpreter',
		urlFunction: urlFunction,
		format: new ol.format.OSMXML(),
		displayProperties: displayProperties,
	}, options));

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
			');out center;'; // add center of areas
	}

	function displayProperties(properties) {
		properties.type =
			properties.iconchem =
			properties.tourism ||
			properties.building ||
			properties.shelter_type ||
			properties.amenity ||
			properties.waterway ||
			properties.man_made ||
			properties.highway ||
			properties.shop;

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
			objects = JSON.parse(json);
		for (let o in objects.documents) {
			const properties = objects.documents[o];
			features.push({
				id: properties.document_id,
				type: 'Feature',
				geometry: JSON.parse(properties.geometry.geom),
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