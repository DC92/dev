var layerGeoBBgis = layerVectorURL({
		baseUrl: 'ext/Dominique92/GeoBB/gis.php?select=' + select,
		centerOnfeatures: true,
		receiveProperties: function(properties) {
			properties.link = '?p=' + properties.post_id;
		},
		styleOptions: function(properties) {
			return {
				image: new ol.style.Icon({
					src: properties.icon,
				}),
			};
		},
	}),
	map = new ol.Map({
		target: 'carte',
		view: new ol.View({
			center: [247000, 6243000],
			zoom: 12,
		}),
		layers: [
			layerOsm('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
			layerGeoBBgis,
		],
		controls: [
			new ol.control.Zoom(),
			new ol.control.Attribution(),
		],
	});