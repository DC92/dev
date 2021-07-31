/**
 * Site refuges.info
 */
function layerWriPoi(options) {
	return layerVectorCluster(Object.assign({
		urlHost: '//www.refuges.info/',
		urlPath: function(bbox, list) {
			return 'api/bbox?nb_points=all' +
				'&type_points=' + list.join(',') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		computeProperties: function(f, options) {
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
	//TODO label on hover little massifs
	return layerVector(Object.assign({
		urlHost: '//www.refuges.info/',
		urlPath: 'api/polygones?type_polygon=1',
		computeProperties: function(f) {
			f.set('label', f.get('nom'));
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
				})
			};
		},
	}, options));
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
		urlPath: function(bbox, list, resolution, options) {
			return 'ext/Dominique92/GeoBB/gis2.php?' +
				'layer=simple&limit=1000' +
				(options.selectorName ? '&cat=' + list.join(',') : '') +
				'&bbox=' + bbox.join(',');
		},
		strategy: ol.loadingstrategy.bbox,
		computeProperties: function(f, options) {
			if (f.get('type'))
				f.set('icon', options.urlHost + 'ext/Dominique92/GeoBB/icones/' + f.get('type') + '.svg');
			if (f.get('id'))
				f.set('link', options.urlHost + 'viewtopic.php?t=' + f.get('id'));
			f.set('hover', f.get('name'));
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
	return layerVectorCluster(Object.assign({
		urlHost: '//chemineur.fr/',
		urlPath: function(bbox, list, resolution, options) {
			return 'ext/Dominique92/GeoBB/gis2.php?' +
				'layer=cluster&limit=1000' +
				(options.selectorName ? '&cat=' + list.join(',') : '');
		},
	}, options));
}

function layerChem(options) {
	return layerFlip(
		layerChemPoi(options),
		layerChemCluster(options),
		100
	);
}