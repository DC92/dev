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

// Resize
$('#map').resizable({
	handles: 's,w,sw', // 2 côtés et 1 coin
	resize: function(evt, ui) {
		ui.position.left = ui.originalPosition.left; // Reste à droite de la page
	},
	stop: function(evt) {
		evt.target.map_.updateSize();
	}
});

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

// The style of selected & edited topic
var topicStyleOptions = {
		image: new ol.style.Circle({
			radius: 4,
			fill: new ol.style.Fill({
				color: 'black'
			})
		}),
		fill: new ol.style.Fill({
			color: 'rgba(0,0,0,0.3)'
		}),
		stroke: new ol.style.Stroke({
			color: 'black'
		})
	},
	editStyleOptions = {
		stroke: new ol.style.Stroke({
			color: 'black',
			width: 2
		})
	},
	titleEdit = "Cliquer et déplacer un sommet pour modifier un polygone\n"+
		"Cliquer sur un segment puis déplacer pour créer un sommet\n"+
		"Alt + cliquer sur un sommet pour le supprimer\n"+
		"Ctrl + Alt + cliquer sur un côté d 'un polygone pour le supprimer";

function layerStyleOptionsFunction(properties, id, hover) {
	if (properties.icon)
		return {
			image: new ol.style.Icon({
				src: properties.icon
			})
		};

	// The selected property
	if (properties.id == id)
		return topicStyleOptions;

	var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.color),
		colorTr = 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',';
	return {
		fill: new ol.style.Fill({
			color: hover ? colorTr + '0.2)' : colorTr + '0.5)'
		}),
		stroke: new ol.style.Stroke({
			color: hover ? colorTr + '1)' : colorTr + '0.5)'
		})
	};
}

function geoLayer(idColor, idExclude, noHover) {
	return new ol.layer.LayerVectorURL({
		baseUrl: 'ext/Dominique92/GeoBB/gis.php?limit=10000&exclude=' + idExclude + '&',
		styleOptions: function(properties) {
			return layerStyleOptionsFunction(properties, idColor);
		},
		hoverStyleOptions: function(properties) {
			return layerStyleOptionsFunction(properties, idColor, !noHover);
		},
		label: function(properties) {
			return noHover ? null : '<a href="viewtopic.php?t=' + properties.id + '">' + properties.name + '<a>';
		},
		href: function(properties) {
			return 'viewtopic.php?t=' + properties.id;
		}
	});
}