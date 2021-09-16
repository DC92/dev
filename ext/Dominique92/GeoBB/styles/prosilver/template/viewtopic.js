map.addLayer(layerEditGeoJson({
	geoJsonId: 'geo_json',
	singlePoint: true,
	focus: 15,
	displayPointId: typeof displayPointId == 'string' ? displayPointId : 'point-marker',
	styleOptions: {
		image: new ol.style.Icon({
			src: 'ext/Dominique92/GeoBB/styles/prosilver/theme/images/cadre.png',
		}),
	},
}));

//TODO centrer fenetre sur une trace