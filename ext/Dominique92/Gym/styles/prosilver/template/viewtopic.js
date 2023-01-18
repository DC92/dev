const layer = layerVector({
		url: 'ext/Dominique92/GeoBB/gis.php', //BEST filtrer ceux dans l'horaire
		convertProperties: function(properties, feature, options) {
			return {
				icon: 'ext/Dominique92/GeoBB/icones/gym.svg',
				url: 'viewtopic.php?p=' + properties.post_id,
			};
		},
		styleOptFnc: function(feature ) {
			return Object.assign({},
				styleOptIcon(feature),
				firstMenuLine ? null : styleOptLabel(feature),
			);
		},
		hoverStyle: styleOptLabel,
	}),

	map = new ol.Map({
		target: 'carte',
		view: new ol.View({
			center: ol.proj.transform(coordonnees, 'EPSG:4326', 'EPSG:3857'),
			zoom: 18,
			enableRotation: false,
		}),
		layers: [
			layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
			layer,
		],
		controls: [
			new ol.control.Zoom(),
			new ol.control.Attribution(),
		],
	});

if (firstMenuLine)
	layer.getSource().on('featuresloadend', function(evt) {
		map.getView().fit(
			layer.getSource().getExtent(), {
				size: map.getSize(),
				padding: [35, 16, 16, 16],
			});
	});