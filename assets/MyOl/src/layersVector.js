function hexToRgba(color, transparency) {
	return 'rgba(' + [
		parseInt(color.substring(1, 3), 16),
		parseInt(color.substring(3, 5), 16),
		parseInt(color.substring(5, 7), 16),
		transparency,
	].join(',') + ')';
}

/**
 * Site refuges.info
 */
function layerWriPoi(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		urlFunction: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/api/bbox?nb_points=all' +
				'&type_points=' + selection.join(',') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(feature, options) {
			const properties = feature.getProperties(),
				hover = [], // Hover label
				desc = [];

			if (properties.type.valeur)
				hover.push(
					properties.type.valeur.replace(
						/(^\w|\s\w)/g,
						function(m) {
							return m.toUpperCase();
						}
					));

			if (properties.coord.alt)
				desc.push(properties.coord.alt + 'm');

			if (properties.places.valeur)
				desc.push(properties.places.valeur + '\u255E\u2550\u2555');

			if (desc.length)
				hover.push(desc.join(', '));

			hover.push(properties.nom);
			feature.set('hover', hover.join('\n'));

			// Other displays
			feature.set('icon', '//' + options.host + '/images/icones/' + properties.type.icone + '.svg');
			feature.set('label', properties.nom);
			feature.set('name', properties.nom); // For cluster list

			if (properties.lien)
				feature.set('link', properties.lien);
		},
		hoverStyleOptions: {
			textOptions: {
				font: '14px Calibri,sans-serif',
				backgroundStroke: new ol.style.Stroke({
					color: 'blue',
				}),
			},
		},
	}, options));
}

function layerWriAreas(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		urlFunction: function(extent, resolution, projection, options) {
			return '//' + options.host + '/api/polygones?type_polygon=1';
		},
		properties: function(feature) {
			const properties = feature.getProperties();

			feature.set('label', properties.nom);
			feature.set('hover', properties.nom);

			if (properties.lien)
				feature.set('link', properties.lien);
		},
		styleOptions: function(feature) {
			return {
				fill: new ol.style.Fill({
					color: hexToRgba(feature.get('couleur'), 0.5),
				}),
			};
		},
		hoverStyleOptions: function(feature) {
			return {
				fill: new ol.style.Fill({
					color: hexToRgba(feature.get('couleur'), 0.7),
				}),
				textOptions: {
					backgroundStroke: new ol.style.Stroke({
						color: 'blue',
					}),
				},
			};
		},
	}, options, {
		selectorName: null, // Forced
	}));
}

/**
 * Site chemineur.fr
 */
function layerChemPoi(options) {
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		urlFunction: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?limit=1000000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(feature) {
			feature.set('hover', feature.get('name'));
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
		urlFunction: function url(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?' +
				'layer=cluster&limit=1000000' +
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
		urlFunction: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis.php?limit=500' +
				(options.selectorName ? '&forums=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(feature, options) {
			const properties = feature.getProperties();

			if (properties.id)
				feature.set('link', '//' + options.host + '/viewtopic.php?t=' + properties.id);
			feature.set('hover', properties.name);
		},
		styleOptions: function(feature) {
			return {
				fill: new ol.style.Fill({
					color: hexToRgba(feature.get('color'), 0.3),
				}),
			};
		},
		hoverStyleOptions: function(feature) {
			return {
				fill: new ol.style.Fill({
					color: hexToRgba(feature.get('color'), 0.7),
				}),
			};
		},
	}, options));
}