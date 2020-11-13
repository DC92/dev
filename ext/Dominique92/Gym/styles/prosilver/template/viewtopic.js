new ol.Map({
	target: 'map',
	layers: [
		layerOsm('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		layerGeoJson({
			geoJsonId: 'cadre-json',
			focus: 16,
			styleOptions: {
				image: new ol.style.Icon({
					src: 'ext/Dominique92/Gym/styles/prosilver/theme/images/ballon.png',
				}),
			},
		}),
	],
	controls: [
		new ol.control.Zoom(),
		new ol.control.Attribution(),
	],
});