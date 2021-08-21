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
 * Convert properties type into gpx <sym>
 * Manages common types for many layer services
 */
function getSym(type) {
	const lex =
		// https://forums.geocaching.com/GC/index.php?/topic/277519-garmin-roadtrip-waypoint-symbols/
		// https://www.gerritspeek.nl/navigatie/gps-navigatie_waypoint-symbolen.html
		// <sym> propertie propertie
		'<City Hall> hotel' +
		'<Residence> refuge gite chambre_hote' +
		'<Lodge> cabane cabane_cle buron alpage shelter cabane ouverte mais ocupee par le berger l ete' +
		'<Fishing Hot Spot Facility> abri hut' +
		'<Campground> camping camp_site bivouac' +
		'<Tunnel> orri toue abri en pierre grotte cave' +
		'<Crossing> ferme ruine batiment-inutilisable cabane fermee' +

		'<Summit> sommet summit climbing_indoor climbing_outdoor bisse' +
		'<Reef> glacier canyon' +
		'<Waypoint> locality col pass' +

		'<Drinking Water> point_eau waterpoint waterfall' +
		'<Water Source> lac lake' +
		'<Ground Transportation> bus car' +
		'<Parking Area> access' +
		'<Restaurant> buffet restaurant' +
		'<Shopping Center> local_product ravitaillement' +

		'<Restroom> wc' +
		'<Oil Field> wifi reseau' +
		'<Telephone> telephone',
		// slackline_spot paragliding_takeoff paragliding_landing virtual webcam

		match = lex.match(new RegExp('<([^>]*)>[^>]* ' + type));
	return match ? match[1] : 'Puzzle Cache';
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
		strategy: ol.loadingstrategy.bbox,
		displayProperties: function(properties, options) {
			return {
				name: properties.nom,
				type: properties.type.valeur,
				icon: '//' + options.host + '/images/icones/' + properties.type.icone + '.svg',
				alt: properties.coord.alt,
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
		strategy: ol.loadingstrategy.bbox,
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
			textOptions: {
				font: '14px Calibri,sans-serif',
			},
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
		strategy: ol.loadingstrategy.bbox,
		displayProperties: function(properties, options) {
			//TODO altitude / lits / type
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
 * Site pyrenees-refuges.com
 */
function layerPyreneesRefuges(options) {
	return layerVector(Object.assign({
		url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
		displayProperties: function(properties, options) {
			//TODO altitude / lits / type
			properties.icon = '//chemineur.fr/ext/Dominique92/GeoBB/icones/' +
				getSym(properties.type_hebergement || 'cabane') + '.svg';
			properties.url = '//' + options.host + '/viewtopic.php?t=' + properties.id;
			return properties;
		},
		myProperties: function(feature) {
			const properties = feature.getProperties();

			feature.set(
				'icon', '//chemineur.fr/ext/Dominique92/GeoBB/icones/' +
				getSym(properties.type_hebergement || 'cabane') + '.svg'
			);

			if (properties.name)
				feature.set('label', properties.name);
		},
	}, options));
}