function layerChem(options) {
	return geoJsonLayer(Object.assign({
		urlHost: '//chemineur.fr/',
		urlPath: function(bbox, selectorList, resolution) {
			return 'ext/Dominique92/GeoBB/gis2.php?' +
				'layer=' + (resolution < 100 ? 'simple' : 'cluster') +
				'&limit=1000000' +
				(selectorList ? '&cat=' + selectorList : '') +
				'&bbox=' + bbox.join(',');
		},
		selectorName: 'chem-features',
		clusterDistance: 32,

		computeProperties: function(f, layer) {
			if (f.get('type'))
				f.set('icon', layer.options.urlHost + 'ext/Dominique92/GeoBB/icones/' + f.get('type') + '.svg');
			if (f.get('id'))
				f.set('link', layer.options.urlHost + 'viewtopic.php?t=' + f.get('id'));
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
		/*//TODO options / source alternative
		alt: {
			minResolution: 100,
			urlPath: function(bbox, selectorList) {
				return 'ext/Dominique92/GeoBB/gis2.php?' +
					'layer=cluster&limit=1000000' +
					(selectorList ? '&cat=' + selectorList : '');
			},
		}
		*/
	}, options));
}
//TODO CHEM : génération du code region à la création de fiche

function layerMassif(options) {
	return geoJsonLayer(Object.assign({
		urlHost: '//www.refuges.info/',
		urlPath: function() {
			return 'api/polygones?type_polygon=1';
		},
		computeProperties: function(f) {
			f.set('label', f.get('nom'));
			if (f.get('lien'))
				f.set('link', f.get('lien'));
		},
		styleOptionsFunction: function(styleOptions, feature) {
			const hex = feature.get('couleur');
			styleOptions.fill = new ol.style.Fill({
				color: 'rgba(' + [
					parseInt(hex.substring(1, 3), 16),
					parseInt(hex.substring(3, 5), 16),
					parseInt(hex.substring(5, 7), 16),
					0.5,
				].join(',') + ')',
			});
			return styleOptions;
		},
	}, options));
}

function layerWRI(options) {
	return geoJsonLayer(Object.assign({
		urlHost: '//www.refuges.info/',
		urlPath: function(bbox, selectorList, resolution) {
			return 'api/bbox?nb_points=all' +
				'&type_points=' + selectorList +
				'&bbox=' + bbox.join(',');
		},
		selectorName: 'wri-features',
		clusterDistance: 32,

		computeProperties: function(f, layer) {
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
			f.set('icon', layer.options.urlHost + 'images/icones/' + f.get('type').icone + '.svg');
			f.set('name', f.get('nom'));
			f.set('label', f.get('nom'));
			if (f.get('lien'))
				f.set('link', f.get('lien'));
		},
	}, options));
}