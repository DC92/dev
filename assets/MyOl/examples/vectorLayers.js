console.log(document.cookie);

/**
 * www.refuges.info areas layer
 * Requires layerVectorURL
 */
const massifs = layerVectorURL({
	baseUrl: '//www.refuges.info/api/polygones?type_polygon=1',
	selectorName: 'wri-massifs',
	receiveProperties: function(properties) {
		properties.name = properties.nom;
		properties.type = null;
		properties.link = properties.lien;
	},
	styleOptions: function(properties) {
		// Translates the color in RGBA to be transparent
		//TODO make it in refuges.info
		const cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
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
});

/**
 * Map
 */
new ol.Map({
	target: 'map',
	layers: [
		layerRefugesInfo({
			selectorName: 'wri-features',
		}),
		layerPyreneesRefuges({
			selectorName: 'prc-features',
		}),
		layerC2C({
			selectorName: 'c2c-features',
		}),
		layerChemineur({
			selectorName: 'chm-features',
		}),
		layerAlpages({
			selectorName: 'alp-features',
		}),
		layerOverpass({
			selectorName: 'osm-features',
		}),
		massifs,
	],
	controls: controlsCollection({
		baseLayers: layersDemo(),
		controlPermalink: {
			display: true,
		},
	}),
});