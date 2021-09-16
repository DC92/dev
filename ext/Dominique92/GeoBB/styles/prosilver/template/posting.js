//TODO conditional image forum
map.addLayer(layerEditGeoJson({
	displayPointId: 'fix-marker',
	focus: 15,
	singlePoint: true,
	geoJson: {
		type: 'Point',
		coordinates: coordinates,
	},
	styleOptions: {
		image: new ol.style.Icon({
			src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/cadre.png', //TODO simplifier code
		}),
	},
}));