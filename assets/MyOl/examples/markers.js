const cadre = layerGeoJson({
		displayPointId: 'fix-marker',
		singlePoint: true,
		geoJson: {
			type: 'Point',
			coordinates: [2, 48],
		},
		styleOptions: {
			image: new ol.style.Icon({
				src: 'cadre.png',
			}),
		},
	}),
	viseur = layerGeoJson({
		displayPointId: 'drag-marker',
		geoJsonId: 'drag-marker-json',
		dragPoint: true,
		singlePoint: true,
		styleOptions: {
			image: new ol.style.Icon({
				src: 'viseur.png',
			}),
		},
		// Remove FeatureCollection packing of the point
		saveFeatures: function(coordinates, format) {
			return format.writeGeometry(
				new ol.geom.Point(coordinates.points[0]), {
					featureProjection: 'EPSG:3857',
					decimals: 5,
				}
			);
		},
	});

new ol.Map({
	target: 'map',
	layers: [cadre, viseur],
	controls: controlsCollection({
		mapKeys: {
			// Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
			ign: 'hcxdz5f1p9emo4i1lch6ennl',
			// Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
			thunderforest: 'ee751f43b3af4614b01d1bce72785369',
			// Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
			bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt'
			// SwissTopo : You need to register your domain in
			// https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
		},
	}),
});