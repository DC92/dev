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
		new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'FR',
			keepOpen: true,
			placeholder: 'Saisir un nom' // Initialization of the input field
		})
	];
}

function layers(keys) {
	return {
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'Topo': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png'),
		'Satellite': layerGoogle('s')
	};
}

function layerStyle(properties, id, hover) {
	if (properties.icon)
		return {
			image: new ol.style.Icon({
				src: properties.icon
			})
		};

	if (properties.id == id)
		return {
			fill: new ol.style.Fill({
				color: 'rgba(0,0,0,0.2)'
			}),
			stroke: new ol.style.Stroke({
				color: 'black',
				width : 3
			})
		};

	var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.color),
	colorTr = 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',0.5)';
	return {
		fill: new ol.style.Fill({
			color: hover ? properties.color : colorTr
		}),
		stroke: new ol.style.Stroke({
			color: 'black'
		})
	};
}

function geoLayer(id, noclick) {
	return layerVectorURL({
		url: 'ext/Dominique92/GeoBB/gis.php?',
		style: function(properties) {
			return layerStyle(properties, id);
		},
		hover: function(properties) {
			return layerStyle(properties, id, true);
		},
		label: function(properties) {
			return properties.name;
		},
		click: function(properties) {
			if (!noclick)
				window.location.href = 'viewtopic.php?t=' + properties.id;
		}
	});
}
