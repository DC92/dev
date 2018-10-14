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
//		controlLengthLine(),
		controlPermalink({
			init: true,
			visible: true
		}),
		// Requires https://github.com/jonataswalker/ol-geocoder/tree/master/dist
		// Requires hack to display a title on the geocoder
		new Geocoder('nominatim', {
			provider: 'osm',
			lang: 'FR',
			keepOpen: true,
			placeholder: 'Saisir un nom' // Initialization of the input field
		}),
		geobbControlGps
	];
}

/*TODO
var map = new ol.Map({
	target: 'map',
	//	loadTilesWhileInteracting: true,
	controls: Object.values(controls),
	view: new ol.View({
		//center: ol.proj.fromLonLat([-3.5, 48.25]), // France
		center: ol.proj.fromLonLat([7, 47]), // Suisse
		//center: ol.proj.fromLonLat([9.2, 45.5]), // Milan
		//center: ol.proj.fromLonLat([7.07, 45.19]), // Rochemelon
		//center: ol.proj.fromLonLat([-.1, 51.5]), // Londres
		zoom: 8
	})
});

// DCMM remettre dans control
map.addControl(controlLayers(baseLayers, {
	Chemineur: geoJsonLayer({
		url: 'ext/Dominique92/GeoBB/gis.php?site=this&poi=3,8,16,20,23,28,30,40,44,64,58,62',
		properties: function(property) {
			return {
				styleImage: property.icone,
				hoverText: property.nom,
				clickUrl: property.url
			}
		}
	})
}));
*/

/*
var map = new L.Map('map', {
	layers: [L.TileLayer.collection('OSM-FR')]
});

// Default position
<!-- IF GEO_BBOX_MINY -->
	map.fitBounds([
		[{GEO_BBOX_MINY}, {GEO_BBOX_MINX}],
		[{GEO_BBOX_MAXY}, {GEO_BBOX_MAXX}]
	], {
		animate: false
	});
<!-- ELSE -->
	map.setView([46.9, 1.7], 6); // France
<!-- ENDIF -->

// Resize
$('#map').resizable ({
	handles: 's,w,sw', // 2 côtés et 1 coin
	start: function (event,ui) {
		map.dragging.disable(); // Le coin appartenant à la carte, elle serait draggée en même temps que redimensionnée
	},
	resize: function (event,ui) {
		ui.position.left = ui.originalPosition.left; // Reste à droite de la page
		map.invalidateSize(); // Recouvre tout le nouveau <div>
	},
	stop: function (event,ui) {
		map.dragging.enable();
	}
});

// Controls
var control_layers = new L.Control.Layers(L.TileLayer.collection()).addTo(map),

	control = {
		permalink: new L.Control.Permalink.Cookies({
			position: 'bottomright',
			<!-- IF GEO_BBOX_MINY -->
				move: false, // N'utilise pas la position
			<!-- ENDIF -->
			<!-- IF SCRIPT_NAME != 'index' -->
				text: null, // N'affiche pas le permalink
			<!-- ENDIF -->
			layers: control_layers
		}).addTo(map),

		scale: new L.Control.Scale().addTo(map),

		coordinates: new L.Control.Coordinates({
			position:'bottomleft'
		}).addTo(map),

		fullscreen: new L.Control.Fullscreen().addTo(map),

		gps: new L.Control.Gps().addTo(map),

		geocoder: new L.Control.OSMGeocoder({
			position: 'topleft'
		}),

		fileload: new L.Control.FileLayerLoad(),

		fileget: new L.Control.Click(
			function () {
				return gis._getUrl() + '&format=gpx';
			}, {
				title: "Obtenir les élements de la carte dans un fichier GPX\n"+
						"Pour le charger sur un GARMIN, utlisez Basecamp\n"+
						"Atention: le fichier peut être gros pour une grande carte",
				label: '&#8659;'
			}
		),

		print: new L.Control.Click(
			function () {
				window.print();
			}, {
				title: "Imprimer la carte",
				label: '&#x1f5b6;'
			}
		)
	};

// Couches vectorielles
var gis = new L.GeoJSON.Ajax({
	urlGeoJSON: '{EXT_DIR}gis.php',
	argsGeoJSON: {},
	bbox: true,
<!-- IF POST_ID -->
	filter: function(feature) {
		return feature.properties.post_id != {POST_ID};
	},
<!-- ENDIF -->
	style: function(feature) {
		var popup = [feature.properties.nom];
		<!-- IF IS_MODERATOR and TOPIC_ID and GEO_MAP_TYPE == 'point' -->
			if (feature.properties.type_id == {FORUM_ID} && // Uniquement entre points de même type
				feature.properties.id != {TOPIC_ID}) // Pas le point avec lui même
				popup.push ('<a href="' + [
					'mcp.php?i=main&mode=forum_view&action=merge_topic',
					'f={FORUM_ID}',
					't='+feature.properties.id,
					'to_topic_id={TOPIC_ID}',
					'redirect=viewtopic.php?t={TOPIC_ID}',
				].join('&') + '" title="CETTE OPERATION EST IRREVERSIBLE">Fusionner avec "{% autoescape 'js' %}{TOPIC_TITLE}{% endautoescape %}"</a>');
		<!-- ENDIF -->
		var s = {
			popup: ('<p>' + popup.join('</p><p>') + '</p>').replace(/<p>\s*<\/p>/ig, ''),
<!-- IF SCRIPT_NAME == 'posting' -->
			url: null,
			className: 'leaflet-grab',
<!-- ELSE -->
			url: feature.properties.id ? 'viewtopic.php?t='+feature.properties.id : null,
			degroup: 12,
<!-- ENDIF -->
			iconUrl: feature.properties.icone,
			iconAnchor: [8, 8],
			popupAnchor: [0, -6],
			weight: <!-- IF TOPIC_ID --> feature.properties.id == {TOPIC_ID} ? 3 : <!-- ENDIF --> 2
		};

		if (feature.properties.url && 
			!feature.properties.url.match(/chemineur/)) {
			var parser = document.createElement('a');
			parser.href = feature.properties.url;

			var deblinkref = [
				'<a href="posting.php?mode=post',
				'sid={SESSION_ID}',
				'f='+feature.properties.type_id,
				'url='+encodeURI(feature.properties.url),
			].join('&');

			var finlink = [
				'nom='+encodeURI(feature.properties.nom),
				'lon='+feature.geometry.coordinates[0],
				'lat='+feature.geometry.coordinates[1],
			].join('&');

			var popup = [
				'<b>'+feature.properties.nom+'</b>',
				'<a target="_blank" href="'+feature.properties.url+'">Voir sur '+parser.hostname.replace('www.','')+'</a>',
				<!-- IF IS_MODERATOR -->
					deblinkref+'&'+finlink+'">Créer une fiche</a>',
					<!-- IF TOPIC_ID and GEO_MAP_TYPE == 'point' -->
						deblinkref+'&t={TOPIC_ID}&nt={TOPIC_ID}">Lier à "{% autoescape 'js' %}{TOPIC_TITLE}{% endautoescape %}"</a>',
					<!-- ENDIF -->
				<!-- ENDIF -->
			];
			s.popup = ('<p>' + popup.join('</p><p>') + '</p>').replace(/<p>\s*<\/p>/ig, '');
			s.popupClass = 'map-reference';
		}
		return s;
	}
}).addTo(map);

// Controle secondaire pour les couches vectorielles
var lc2 = new L.Control.Layers.argsGeoJSON(
	gis,
	{
<!-- BEGIN map_overlays -->
		'{map_overlays.NAME}': {l: gis, p: '{map_overlays.PAR}', v: '{map_overlays.VALUE}'},
<!-- END map_overlays -->
	}
).addTo(map);
*/
/**
 * www.refuges.info areas layer
 * Requires layerVectorURL
function layerMassifsWri() {
	return layerVectorURL({
		url: '//www.refuges.info/api/polygones?type_polygon=1',
		selector: 'wri-massifs',
		style: function(properties) {
			// Translates the color in RGBA to be transparent
			var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' + parseInt(cs[1], 16) + ',' + parseInt(cs[2], 16) + ',' + parseInt(cs[3], 16) + ',0.5)'
				}),
				stroke: new ol.style.Stroke({
					color: 'black'
				})
			};
		},
		label: function(properties) {
			return properties.nom;
		},
		hover: function(properties) {
			return {
				fill: new ol.style.Fill({
					color: properties.couleur
				}),
				stroke: new ol.style.Stroke({
					color: 'black'
				})
			};
		},
		click: function(properties) {
			if (properties.lien)
				window.location.href = properties.lien;
		}
	});
}
 */

/**
 * www.refuges.info POI layer
 * Requires layerVectorURL
function layerPointsWri() {
	return layerVectorURL({
		url: '//www.refuges.info/api/bbox?type_points=',
		selector: 'wri-poi',
		style: function(properties) {
			return {
				image: new ol.style.Icon({
					src: '//www.refuges.info/images/icones/' + properties.type.icone + '.png'
				})
			};
		},
		label: function(properties) {
			return properties.nom;
		},
		click: function(properties) {
			if (properties.lien)
				window.location.href = properties.lien;
		}
	});
}
 */

/**
 * chemineur.fr POI layer
 * Requires layerVectorURL
function chemineurLayer() {
	return layerVectorURL({
		url: '//dc9.fr/chemineur/ext/Dominique92/GeoBB/gis.php?site=this&poi=3,8,16,20,23,28,30,40,44,64,58,62,65',
		selector: 'chemineur',
		style: function(properties) {
			return {
				// POI
				image: new ol.style.Icon({
					src: properties.icone
				}),
				// Traces
				stroke: new ol.style.Stroke({
					color: 'blue'
				})
			};
		},
		hover: function(properties) {
			return {
				image: new ol.style.Icon({
					src: properties.icone
				}),
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 3
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
 */

