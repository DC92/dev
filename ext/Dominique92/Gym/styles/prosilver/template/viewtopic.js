var layerGeoBBgis = layerGeoBB({
	host:'c92.fr/test/gymcha6/',
	/*
		selectorName: 'geobb-features',
		maxResolution: 100,
		distance: 50,
		attribution: 'Chemineur',
	*/
	}),
	map = new ol.Map({
		target: 'carte',
		view: new ol.View({
			center: [247000, 6243000],
			zoom: 12,
		}),
		layers: [
			layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
			layerGeoBBgis,
		],
		controls: [
			new ol.control.Zoom(),
			new ol.control.Attribution(),
		],
	});
	
	/*
	layerVectorURL({
		baseUrl: 'ext/Dominique92/GeoBB/gis.php?select=' + select,
		centerOnfeatures: true,
		receiveProperties: function(properties) {
			properties.link = '?p=' + properties.post_id;
		},
	})*/