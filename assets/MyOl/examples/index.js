var _v=document.cookie,_r='COOKIES : ';if(typeof _v=='array'||typeof _v=='object'){for(_i in _v)if(typeof _v[_i]!='function')_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r);

/**
 * www.refuges.info areas layer
 * Requires layerVectorURL
 */
function layerMassifsWri() {
	return layerVectorURL({
		url: '//www.refuges.info/api/polygones?type_polygon=1',
		selectorName: 'wri-massifs',
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
		label: function(properties) {
			return '<a href="'+properties.lien+'">'+properties.nom+'<a>';
		},
		href: function(properties) {
			return properties.lien;
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
		selectorName: 'chemineur',
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
			return '<a href="'+properties.url+'">'+properties.nom+'<a>';
		},
		href: function(properties) {
			return properties.url;
		}
	});
}

//***************************************************************
// EXAMPLE
//***************************************************************
var layerSwitcher = controlLayersSwitcher(layersCollection({
		IGN: 'd27mzh49fzoki1v3aorusg6y', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
		thunderforest: 'a54d38a8b23f435fa08cfb1d0d0b266e', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
		bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
		// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
	})),
	marqueur = marker('http://www.refuges.info/images/cadre.png', 'marqueur'),
	viseur = marker('http://www.refuges.info/images/viseur.png', 'viseur', null, true),
	overlays = [
		layerPointsWri({
			selectorName: 'wri-poi'
		}),
		chemineurLayer(),
		layerMassifsWri(),
		layerOverpass(),
		marqueur,
		viseur
	];

new ol.Map({
	target: 'map',
	controls: controlsCollection().concat([
		layerSwitcher,
		controlEdit('geojson', overlays, true),
		controlEditCreate('LineString'),
		controlEditCreate('Polygon')
	]),
	layers: overlays
});

controlgps.callBack = function(position) {
	viseur.getPoint().setCoordinates(position);
}
