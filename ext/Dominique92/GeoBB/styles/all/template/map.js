/**
 * Controls
 */
var geobbControlGps = controlGPS();
geobbControlGps.callBack = function (position) {
	viseur.getPoint().setCoordinates(position);
}

function geobbControlsCollection(keys) {
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
		controlLayersSwitcher({
			'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
			'Topo': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
			'OSM': layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
			'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png'),
			'Satellite': layerGoogle('s')
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

/**
 * POI layer
 * Requires layerVectorURL
 */
function geoLayer() {
	return layerVectorURL({
		url: 'ext/Dominique92/GeoBB/gis.php?',
		style: function(properties) {
			return {
				image: new ol.style.Icon({
					src: properties.icone
				})
			};
		},
		hover: function(properties) {
			return {
				image: new ol.style.Icon({
					src: properties.icone
				})
			};
		},
		label: function(properties) {
			return properties.nom;
		},
		click: function(properties) {
			if (properties.url)
				window.location.href = properties.url;
		}
	});
}

