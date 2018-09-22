var _v=document.cookie,_r='COOKIES : ';if(typeof _v=='array'||typeof _v=='object'){for(_i in _v)if(typeof _v[_i]!='function')_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r);

/**
 * www.refuges.info areas layer
 * Requires layerVectorURL
 */
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

/**
 * www.refuges.info POI layer
 * Requires layerVectorURL
 */
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

/**
 * chemineur.fr POI layer
 * Requires layerVectorURL
 */
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

/**
 * Controls examples
 */
function controlsCollection() {
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
		controlLengthLine(),
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
		controlGPS(),
		controlLoadGPX(),
		controlDownloadGPX(),
		controlPrint(),
	];
}

/**
 * Tile layers examples
 * Requires many
 */
function layersCollection(keys) {
	return {
		'OSM-FR': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'MRI': layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		'Hike & Bike': layerOSM(
			'http://{a-c}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
			'<a href="http://www.hikebikemap.org/">hikebikemap.org</a>'
		), // Not on https
		'Autriche': layerKompass('KOMPASS Touristik'),
		//'Kompas': layerKompass(, 'KOMPASS'),
		//'Kompas summer': layerKompass('Summer OSM'),
		//'Kompas winter': layerKompass('Winter OSM'),
		//'Kompas luftbild': layerKompass('a'),
		'OSM-outdoors': layerThunderforest('outdoors', keys.thunderforest),
		'OSM-cycle': layerThunderforest('cycle', keys.thunderforest),
		'OSM-landscape': layerThunderforest('landscape', keys.thunderforest),
		'OSM-transport': layerThunderforest('transport', keys.thunderforest),
		'IGN': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN photos': layerIGN(keys.IGN, 'ORTHOIMAGERY.ORTHOPHOTOS'),
		'IGN TOP 25': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		'IGN classique': layerIGN(keys.IGN, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		// NOT YET	layerIGN('IGN avalanches', keys.IGN,'GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN'),
		'Cadastre': layerIGN(keys.IGN, 'CADASTRALPARCELS.PARCELS', 'image/png'),
		'Swiss': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Swiss photo': layerSwissTopo('ch.swisstopo.swissimage'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Espagne photo': layerSpain('pnoa-ma', 'OI.OrthoimageCoverage'),
		'Italie': layerIGM(),
		'Angleterre': layerOS(keys.bing),
		'Bing': layerBing('Road', keys.bing),
		'Bing photo': layerBing('Aerial', keys.bing),
		//'Bing mixte': layerBing ('AerialWithLabels', bingKey),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google photo': layerGoogle('s'),
		'Google hybrid': layerGoogle('s,h'),
		Stamen: layerStamen('terrain'),
		Watercolor: layerStamen('watercolor'),
		'Neutre': new ol.layer.Tile()
	};
}

//***************************************************************
// EXAMPLE
//***************************************************************
var overpass = layerOverpass({
		url: '//overpass-api.de/api/interpreter',
		selector: 'overpass',
		labelClass: 'label-overpass',
		label: function(p) {
			return ['<hr/><a href="http://chemineur.fr/posting.php?mode=post',
					'sid=ca86393fbad98908cf443bdeef5a04ca',
					'f=' + p.type,
					'url=' + encodeURI(p.url),
					'nom=' + p.name,
					'lon=' + p.lon,
					'lat=' + p.lat
				].join('&') +
				'">Créer une fiche</a>';
		}
	}),
	overlays = [
		layerPointsWri(),
		chemineurLayer(),
		layerMassifsWri(),
		overpass,
	],
	map = new ol.Map({
		target: 'map',
		//	loadTilesWhileInteracting: true,
		controls: controlsCollection(),
		/*				view: new ol.View({
							center: ol.proj.fromLonLat([-4, 48]), // Bretagne
							//center: ol.proj.fromLonLat([-3.5, 48.25]), // France
							//center: ol.proj.fromLonLat([7, 47]), // Suisse
							//center: ol.proj.fromLonLat([9.2, 45.5]), // Milan
							//center: ol.proj.fromLonLat([7.07, 45.19]), // Rochemelon
							//center: ol.proj.fromLonLat([-.1, 51.5]), // Londres
							zoom: 8
						}),*/
		layers: overlays
	}),
	layers = layersCollection({
		IGN: 'o6owv8ubhn3vbz2uj8jq5j0z', // localhost
		//IGN: 'hcxdz5f1p9emo4i1lch6ennl', // chemineur.fr
		thunderforest: 'a54d38a8b23f435fa08cfb1d0d0b266e', // https://manage.thunderforest.com
		bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
	});

map.addControl(controlLayersSwitcher(layers));

map.addLayer(marqueur(
	'data:image/svg+xml;utf8,' +
	'<svg xmlns="http://www.w3.org/2000/svg" width="31" height="43" ' +
	'style="stroke-width:4;stroke:rgb(255,0,0,.5);fill:rgb(0,0,0,0)">' +
	'<rect width="31" height="43" />' +
	'</svg>', [-.575, 44.845],
	'lonlat', ['Lon {0}, Lat {1}', '<br/>X {2}, Y {3} (CH1903)']
));
map.addLayer(marqueur(
	'data:image/svg+xml;utf8,' +
	'<svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" ' +
	'style="stroke-width:3;stroke:rgb(255,208,0);fill:rgb(0,0,0,0)">' +
	'<circle cx="15" cy="15" r="13.5" />' +
	'<line x1="15" y1="0" x2="15" y2="30" />' +
	'<line x1="0" y1="15" x2="30" y2="15" />' +
	'</svg>', [6.15, 46.2],
	'edit-lonlat', [
		'Lon <input type="text" onchange="viseur.edit(this,0,4326)" size="12" maxlength="12" value="{0}"/>' +
		'<br/>Lat <input type="text" onchange="viseur.edit(this,1,4326)" size="12" maxlength="12" value="{1}"/>',
		'<br/>X <input type="text" onchange="viseur.edit(this,0,21781)" size="12" maxlength="12" value="{2}"/>' +
		'<br/>Y <input type="text" onchange="viseur.edit(this,1,21781)" size="12" maxlength="12" value="{3}"/>'
	],
	'edit'));

map.addControl(controlLineEditor('geojson', overlays));
