console.log(document.cookie);

/**
 * www.refuges.info POI layer
 * Requires layerVectorURL
 */
const layerPointsWri = layerVectorURL({
		selectorName: 'wri-poi',
		baseUrl: '//www.refuges.info/api/bbox?type_points=',
		strategy: ol.loadingstrategy.bboxLimit,
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
	}),

	/**
	 * www.refuges.info areas layer
	 * Requires layerVectorURL
	 */
	layerMassifsWri = layerVectorURL({
		baseUrl: '//www.refuges.info/api/polygones?type_polygon=1',
		selectorName: 'wri-massifs',
		styleOptions: function(properties) {
			// Translates the color in RGBA to be transparent
			var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' +
						parseInt(cs[1], 16) + ',' +
						parseInt(cs[2], 16) + ',' +
						parseInt(cs[3], 16) +
						',0.5)',
				}),
				stroke: new ol.style.Stroke({
					color: 'black',
				})
			};
		},
		hoverStyleOptions: function(properties) {
			return {
				fill: new ol.style.Fill({
					color: properties.couleur,
				}),
				stroke: new ol.style.Stroke({
					color: 'black',
				}),
			};
		},
		label: function(properties) {
			return '<a href="' + properties.lien + '">' + properties.nom + '<a>';
		},
		href: function(properties) {
			return properties.lien;
		},
	}),

	/**
	 * chemineur.fr POI layer
	 * Requires layerVectorURL
	 */
	chemineurLayer = layerVectorURL({
		baseUrl: '//dc9.fr/chemineur/ext/Dominique92/GeoBB/gis.php?site=this&poi=3,8,16,20,23,28,30,40,44,64,58,62,65',
		strategy: ol.loadingstrategy.bboxLimit,
		selectorName: 'chemineur',
		styleOptions: function(properties) {
			return {
				// POI
				image: new ol.style.Icon({
					src: properties.icone,
				}),
				// Traces
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3,
				}),
			};
		},
		hoverStyleOptions: function(properties) {
			return {
				image: new ol.style.Icon({
					src: properties.icone,
				}),
				stroke: new ol.style.Stroke({
					color: 'red',
					width: 3,
				}),
			};
		},
		label: function(properties) {
			return '<a href="' + properties.url + '">' + properties.nom + '<a>';
		},
		href: function(properties) {
			return properties.url;
		},
	}),

	/**
	 * Examples
	 */
	marqueur = layerMarker({
		imageUrl: 'cadre.png',
		idDisplay: 'marqueur',
		decimalSeparator: ',',
	}),
	viseur = layerMarker({
		imageUrl: 'viseur.png',
		idDisplay: 'viseur',
		decimalSeparator: ',',
		dragged: true,
	}),

	/**
	 * Editor
	 */
	editor = layerEdit({
		geoJsonId: 'geojson',
		controls: [
			controlModify,
			controlDrawLine,
			controlDrawPolygon,
		],
		snapLayers: [chemineurLayer],
		styleOptions: {
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 5,
			}),
		},
		editStyleOptions: { // Hover / modify / create
			image: new ol.style.Circle({
				radius: 5,
				fill: new ol.style.Fill({
					color: 'red',
				}),
			}),
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 5,
			}),
		},
	}),

	/**
	 * Map
	 */
	overlays = [
		layerPointsWri,
		chemineurLayer,
		layerMassifsWri,
		layerOverpass(),
		marqueur,
		viseur,
		editor,
	],
	basicControls = controlsCollection({
		geoKeys: {
			// Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
			ign: 'hcxdz5f1p9emo4i1lch6ennl',
			// Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
			thunderforest: 'ee751f43b3af4614b01d1bce72785369',
			// Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
			bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt'
			// SwissTopo : You need to register your domain in
			// https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
		},
		controlGPS: {
			callBack: function(position) {
				viseur.getPoint().setCoordinates(position);
			}
		}
	}),
	map = new ol.Map({
		target: 'map',
		layers: overlays,
		controls: basicControls,
	});