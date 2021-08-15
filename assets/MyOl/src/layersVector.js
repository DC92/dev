/**
 * Site refuges.info
 */
function layerWriPoi(options) {
	return layerVector(Object.assign({
		host: 'www.refuges.info',
		url: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/api/bbox?nb_points=all' +
				'&type_points=' + selection.join(',') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(f, options) {
			const hover = [], // Hover label
				desc = [];
			if (f.get('type').valeur)
				hover.push(
					f.get('type').valeur.replace(
						/(^\w|\s\w)/g,
						function(m) {
							return m.toUpperCase();
						}
					));
			if (f.get('coord').alt)
				desc.push(f.get('coord').alt + 'm');
			if (f.get('places').valeur)
				desc.push(f.get('places').valeur + '\u255E\u2550\u2555');
			if (desc.length)
				hover.push(desc.join(', '));
			hover.push(f.get('nom'));
			f.set('hover', hover.join('\n'));

			// Other displays
			f.set('icon', '//' + options.host + '/images/icones/' + f.get('type').icone + '.svg');
			f.set('label', f.get('nom'));
			f.set('name', f.get('nom')); // For cluster list
			if (f.get('lien'))
				f.set('link', f.get('lien'));
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
		url: function(extent, resolution, projection, options) {
			return '//' + options.host + '/api/polygones?type_polygon=1';
		},
		lowestResolution: 500,
		properties: function(f) {
			f.set('label', f.get('nom'));
			f.set('hover', f.get('nom'));
			if (f.get('lien'))
				f.set('link', f.get('lien'));
		},
		styleOptions: function(feature) {
			const hex = feature.get('couleur');
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' + [
						parseInt(hex.substring(1, 3), 16),
						parseInt(hex.substring(3, 5), 16),
						parseInt(hex.substring(5, 7), 16),
						0.5,
					].join(',') + ')',
				}),
			};
		},
		hoverStyleOptions: {
			textOptions: {
				backgroundStroke: new ol.style.Stroke({
					color: 'blue',
				}),
			},
		},
	}, options, {
		selectorName: null, // Forced
	}));
}

function layerWri(options) {
	return layerFlip(
		layerVectorCluster(layerWriPoi(options)),
		layerWriAreas(options),
		100
	);
}

/**
 * Site chemineur.fr
 */
function layerChemPoi(options) {
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		url: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?' +
				'layer=simple&limit=1000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(f, options) {
			if (f.get('type'))
				f.set('icon', '//' + options.host + '/ext/Dominique92/GeoBB/icones/' + f.get('type') + '.svg');
			if (f.get('id'))
				f.set('link', '//' + options.host + '/viewtopic.php?t=' + f.get('id'));
			f.set('hover', f.get('name'));
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

function layerChemGroup(options) {
	//TODO ne marche pas
	return layerVector(Object.assign({
		host: 'chemineur.fr',
		url: function(extent, resolution, projection, options, bbox, selection) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis2.php?' +
				'layer=group&limit=1000000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '');
		},
	}, options));
}

function layerChem(options) {
	return layerFlip(
		layerVectorCluster(layerChemPoi(options)),
		layerVectorCluster(layerChemGroup(options)),
		100
	);
}

/**
 * Site alpages.info
 */
//TODO option selection par défaut (pas de sélecteur ou sélecteur binaire)
function layerAlpages(options) {
	return layerVector(Object.assign({
		host: 'alpages.info',
		url: function(extent, resolution, projection, options, bbox) {
			return '//' + options.host +
				'/ext/Dominique92/GeoBB/gis.php?forums=3,4,5,6&limit=500' +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(f, options) {
			if (f.get('id'))
				f.set('link', '//' + options.host + '/viewtopic.php?t=' + f.get('id'));
			f.set('hover', f.get('name'));
		},
		styleOptions: function(feature) {
			//TODO icone des cabanes
			const hex = feature.get('color');
			if (hex)
				return {
					fill: new ol.style.Fill({
						color: 'rgba(' + [
							parseInt(hex.substring(1, 3), 16),
							parseInt(hex.substring(3, 5), 16),
							parseInt(hex.substring(5, 7), 16),
							0.2,
						].join(',') + ')',
					}),
				};
		},
		hoverStyleOptions: function(feature) {
			const hex = feature.get('color');
			if (hex)
				return {
					fill: new ol.style.Fill({
						color: 'rgba(' + [
							parseInt(hex.substring(1, 3), 16),
							parseInt(hex.substring(3, 5), 16),
							parseInt(hex.substring(5, 7), 16),
							0.7,
						].join(',') + ')',
					}),
				};
		},
	}, options));
}