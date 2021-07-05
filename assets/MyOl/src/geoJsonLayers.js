function layerChem(options) {
	return geoJsonLayer(Object.assign({
		urlBase: '//chemineur.fr/',
		url: function() {
			return options.urlBase + 'ext/Dominique92/GeoBB/gis.php?limit=1000000&bbox=';
		},
		//urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=8,64&bbox=',
		clusterDistance: 32,
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

function layerWRI(options) {
	const layerMassif = geoJsonLayer({
		url: function() {
			return options.urlBase + 'api/polygones?type_polygon=1';
		},
		normalize: function(f) {
			f.set('link', f.get('lien'));
			f.set('name', f.get('nom'));
		},
		styleOptionsFunction: function(styleOptions, feature) {
			styleOptions.labelOnPoly = true;
			styleOptions.fill = new ol.style.Fill({
				color: feature.get('couleur'),
			});
			return styleOptions;
		},
	});

	options = Object.assign({
		urlBase: '//www.refuges.info/',
		selectorName: 'wri-features',
		clusterDistance: 32,
		pixelRatioMax: 100,
		layerAbove: layerMassif,

		url: function(bbox, selectorList, resolution) {
			return options.urlBase + // url base that can vary (server name, ...)
				'api/bbox?nb_points=all&type_points=' + selectorList +
				'&bbox=' + bbox.join(',');
		},

		normalize: function(f, layer) {
			// Hover label
			const label = [],
				desc = [];
			if (f.get('type').valeur)
				label.push(
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
				label.push(desc.join(', '));
			label.push(f.get('nom'));
			f.set('label', label.join('\n'));

			// Other displays
			f.set('icon', layer.options.urlBase + 'images/icones/' + f.get('type').icone + '.svg');
			f.set('name', f.get('nom'));
			f.set('link', f.get('lien'));
		},
	}, options);

	return geoJsonLayer(options);
}