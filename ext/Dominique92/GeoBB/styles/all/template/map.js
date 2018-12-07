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
		'Photos': layerGoogle('s'),
		'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN topo': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'Google': layerGoogle('p'),
		'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png')
	};
}

/*
//TODO-CHEM DELETE pour aspir
//TODO-CHEM complete chemineur
function postLabel(properties, feature, layer, pixel, ll4326) {
	var type = typeof layer.options_.type == 'function' ?
		layer.options_.type(properties, feature, layer, pixel, ll4326) :
		layer.options_.type || '',
		name = typeof layer.options_.name == 'function' ?
		layer.options_.name(properties, feature, layer, pixel, ll4326) :
		layer.options_.name || '';

	return ['<hr/><a title="Créer une fiche modifiable à partir du point" ' +
			'href="posting.php?mode=post', //TODO-BEST spécifique : passer en argument
			'type=' + type,
			'name=' + (name || type),
			'lon=' + Math.round(ll4326[0] * 100000) / 100000,
			'lat=' + Math.round(ll4326[0] * 100000) / 100000
		].join('&') +
		'">Créer une fiche</a>';
}
*/

function layerStyle(properties, id, hover) {
	if (properties.icon)
		return {
			image: new ol.style.Icon({
				src: properties.icon
			})
		};

	// The selected property
	if (properties.id == id)
		return {
			fill: new ol.style.Fill({
				color: 'rgba(255,255,255,0.2)'
			}),
			stroke: new ol.style.Stroke({
				color: '#48C'
			})
		};
	//TODO faire couleur gris + noir par défaut de l'éditeur et celui sélecté.

	var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.color),
		colorTr = 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',0.5)';
	return {
		fill: new ol.style.Fill({
			color: hover ? 'rgba(0,0,0,0.3)' : colorTr
		}),
		stroke: new ol.style.Stroke({
			color: hover ? 'black' : colorTr
		})
	};
}

function geoLayer(idColor, idExclude, noHover) {
	return layerVectorURL({
		url: 'ext/Dominique92/GeoBB/gis.php?limit=10000&exclude='+idExclude+'&',
		style: function(properties) {
			return layerStyle(properties, idColor);
		},
		hover: function(properties) {
			return layerStyle(properties, idColor, !noHover);
		},
		label: function(properties) {
			return noHover ? null : '<a href="viewtopic.php?t=' + properties.id+'">'+properties.name+'<a>';
		},
		href: function(properties) {
			return 'viewtopic.php?t=' + properties.id;
		}
	});
}
