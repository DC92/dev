var geobbControlGps = controlGPS();
geobbControlGps.callBack = function(position) {
	viseur.getPoint().setCoordinates(position);
}

function geobbControls() {
	return [
		new ol.control.ScaleLine(),
		new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(5),
			projection: 'EPSG:4326',
			className: 'ol-coordinate',
			undefinedHTML: String.fromCharCode(0)
		}),
		new ol.control.Attribution({
			collapsible: false // Attribution always open
		}),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '',
			labelActive: '',
			tipLabel: 'Plein écran'
		}),
		// Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
		// Requires hack to display a title on the geocoder //TODO ?????????
		new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'FR',
			keepOpen: true,
			placeholder: 'Saisir un nom' // Initialization of the input field
		}),
		geobbControlGps
	];
}

function layers(keys) {
	return {
		'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'Topo': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png'),
		'Satellite': layerGoogle('s')
	};
}

function layerStyle(properties) {
	return {
		image: new ol.style.Icon({
			src: properties.icon
		}),
		fill: new ol.style.Fill({
			color: properties.color
		}),
		stroke: new ol.style.Stroke({
			color: properties.color
		})
	};
}

function geoLayer() {
	return layerVectorURL({
		url: 'ext/Dominique92/GeoBB/gis.php?',
		style: function(properties) {
			if (properties.color) {
				var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.color);
				properties.color = 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',0.5)';
			}
			return layerStyle(properties);
		},
		hover: layerStyle,
		label: function(properties) {
			return properties.name;
		},
		click: function(properties) {
			window.location.href = 'viewtopic.php?t=' + properties.id;
		}
	});
}
