function layerChem(options) {
	return geoJsonLayer(Object.assign({
		urlBase: '//chemineur.fr/',
		urlSuffix: 'ext/Dominique92/GeoBB/gis.php?limit=1000000&bbox=',
		//urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=8,64&bbox=',
		//urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=64&bbox=',
		//urlSuffix: 'ext/Dominique92/GeoBB/gis.php?cat=8&bbox=',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},
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
		urlBase: '//www.refuges.info/',
		urlSuffix: 'api/polygones?type_polygon=1',
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
		//		urlSuffix: 'api/bbox?nb_points=all&type_points=7,10,9,23,6,3,28&bbox=',
		//		selectorList: '7,10,9,23,6,3,28',
		selectorName: 'wri-features',
		urlBbox: function(bbox) {
			return bbox.join(',');
		},
		clusterDistance: 32,
		pixelRatioMax: 100,
		layerAbove: layerMassif,

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