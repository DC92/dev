//TODO BEST : carte par défaut zoome sur les alpages existants (France sud est)

function aspirControls(options) {
	options = options || {};
	return [
		controlLayersSwitcher({
			baseLayers: {
				'OSM': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
				'OSM topo': layerOSM(
					'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
					'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
				),
				'IGN': layerIGN(options.geoKeys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
				'IGN topo': layerIGN(options.geoKeys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
				'Satellite': layerGoogle('s'),
				'Cadastre': layerIGN(options.geoKeys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png')
			}
		}),
		new ol.control.ScaleLine(),
		new ol.control.Attribution({
			collapsible: false // Attribution always open
		}),
		new ol.control.MousePosition({
			coordinateFormat: ol.coordinate.createStringXY(5),
			projection: 'EPSG:4326',
			className: 'ol-coordinate',
			undefinedHTML: String.fromCharCode(0)
		}),
		controlPermalink(options.controlPermalink),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '',
			labelActive: '',
			tipLabel: 'Plein écran'
		}),
		// Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
		geocoder()
	];
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

function aspirLayer(idColor, idExclude, noHover) {
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