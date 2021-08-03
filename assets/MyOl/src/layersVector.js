/**
 * Site refuges.info
 */
function layerWriPoi(options) {
	return layerVectorCluster(Object.assign({
		urlHost: '//www.refuges.info/',
		url: function url(options, bbox, selection) {
			return options.urlHost +
				'api/bbox?nb_points=all' +
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
			f.set('icon', options.urlHost + 'images/icones/' + f.get('type').icone + '.svg');
			f.set('name', f.get('nom'));
			f.set('label', f.get('nom'));
			if (f.get('lien'))
				f.set('link', f.get('lien'));
		},
	}, options));
}

function layerWriAreas(options) {
	return layerVector(Object.assign({
		urlHost: '//www.refuges.info/',
		url: function url(options) {
			return options.urlHost + 'api/polygones?type_polygon=1';
		},
		properties: function(f) {
			f.set('label', f.get('nom'));
			f.set('hover', f.get('nom'));
			if (f.get('lien'))
				f.set('link', f.get('lien'));
		},
		style: function(feature) {
			const hex = feature.get('couleur');
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' + [
						parseInt(hex.substring(1, 3), 16),
						parseInt(hex.substring(3, 5), 16),
						parseInt(hex.substring(5, 7), 16),
						0.5,
					].join(',') + ')',
				})
			};
		},
	}, options, {
		selectorName: null, // Forced
	}));
}

function layerWri(options) {
	return layerFlip(
		layerWriPoi(options),
		layerWriAreas(options),
		100
	);
}

/**
 * Site chemineur.fr
 */
function layerChemPoi(options) {
	return layerVectorCluster(Object.assign({
		urlHost: '//chemineur.fr/',
		url: function url(options, bbox, selection) {
			return options.urlHost +
				'ext/Dominique92/GeoBB/gis2.php?' +
				'layer=simple&limit=1000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		properties: function(f, options) {
			if (f.get('type'))
				f.set('icon', options.urlHost + 'ext/Dominique92/GeoBB/icones/' + f.get('type') + '.svg');
			if (f.get('id'))
				f.set('link', options.urlHost + 'viewtopic.php?t=' + f.get('id'));
			f.set('hover', f.get('name'));
		},
		style: {
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
		},
		hoverStyle: {
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 3,
			}),
		},
	}, options));
}

function layerChemGroup(options) {
	return layerVectorCluster(Object.assign({
		urlHost: '//chemineur.fr/',
		url: function url(options, bbox, selection) {
			return options.urlHost +
				'ext/Dominique92/GeoBB/gis2.php?' +
				'layer=group&limit=1000000' +
				(options.selectorName ? '&cat=' + selection.join(',') : '');
		},
	}, options));
}

function layerChem(options) {
	return layerFlip(
		layerChemPoi(options),
		layerChemGroup(options),
		100
	);
}