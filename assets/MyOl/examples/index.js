console.log(document.cookie);
//TODO display OL version

/**
 * www.refuges.info POI layer
 * Requires ol.layer.LayerVectorURL
 */
function layerPointsWri(options) {
	return new ol.layer.LayerVectorURL(ol.assign({
		baseUrl: '//www.refuges.info/api/bbox?type_points=',
		styleOptions: function(properties) {
			return {
				image: new ol.style.Icon({
					src: '//www.refuges.info/images/icones/' + properties.type.icone + '.png'
				})
			};
		},
		label: function(properties) { // For click on the label
			return '<a href="' + properties.lien + '">' + properties.nom + '<a>';
		},
		href: function(properties) { // For click on icon
			return properties.lien;
		}
	}, options));
}

/**
 * www.refuges.info areas layer
 * Requires ol.layer.LayerVectorURL
 */
function layerMassifsWri() {
	return new ol.layer.LayerVectorURL({
		baseUrl: '//www.refuges.info/api/polygones?type_polygon=1',
		selectorName: 'wri-massifs',
		styleOptions: function(properties) {
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
		hoverStyleOptions: function(properties) {
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
			return '<a href="' + properties.lien + '">' + properties.nom + '<a>';
		},
		href: function(properties) {
			return properties.lien;
		}
	});
}

/**
 * chemineur.fr POI layer
 * Requires ol.layer.LayerVectorURL
 */
function chemineurLayer() {
	return new ol.layer.LayerVectorURL({
		baseUrl: '//dc9.fr/chemineur/ext/Dominique92/GeoBB/gis.php?site=this&poi=3,8,16,20,23,28,30,40,44,64,58,62,65',
		selectorName: 'chemineur',
		styleOptions: function(properties) {
			return {
				// POI
				image: new ol.style.Icon({
					src: properties.icone
				}),
				// Traces
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3
				})
			};
		},
		hoverStyleOptions: function(properties) {
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
			return '<a href="' + properties.url + '">' + properties.nom + '<a>';
		},
		href: function(properties) {
			return properties.url;
		}
	});
}

/**
 * EXAMPLE
 */
var marqueur = marker('http://www.refuges.info/images/cadre.png', 'marqueur'),
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
	],
	basicControls = controlsCollection({
		geoKeys: {
			ign: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
			thunderforest: 'ee751f43b3af4614b01d1bce72785369', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
			bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
			// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
		},
		controlGPS: {
			callBack: function(position) {
				viseur.getPoint().setCoordinates(position);
			}
		}
	}),
	edit = controlEdit({
		inputId: 'geojson',
		snapLayers: overlays,
		styleOptions: {
			fill: new ol.style.Fill({
				color: 'rgba(0,0,0,0.3)'
			}),
			stroke: new ol.style.Stroke({
				color: '#46f'
			})
		},
		editStyleOptions: {
			image: new ol.style.Circle({
				radius: 4,
				fill: new ol.style.Fill({
					color: '#46f'
				})
			}),
			stroke: new ol.style.Stroke({
				color: '#46f',
				width: 2
			})
		},
		enableAtInit: true,
		draw: [{
			type: 'LineString'
		}, {
			type: 'Polygon'
		}]
	});

new ol.MyMap({
	target: 'map',
	layers: overlays,
	controls: basicControls.concat([edit])
});