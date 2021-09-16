map.addLayer(layerEditGeoJson({
	displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point-marker',
	focus: 15,
	singlePoint: true,
	geoJson: { //TODO avec geojson
		type: 'Point',
		coordinates: coordinates,
	},
	styleOptions: {
		image: new ol.style.Icon({
			src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/cadre.png',
		}),
	},
}));