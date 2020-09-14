const cadre = layerGeoJson({
	displayPointId: 'cadre-coords',
	geoJsonId: 'cadre-json',
	focus: 16,
	styleOptions: {
		image: new ol.style.Icon({
			src: 'assets/MyOl/examples/cadre.png',
		}),
	},
});

function layerStyleOptionsFunction(properties, hover) {
	if (properties.icon)
		return {
			image: new ol.style.Icon({
				src: properties.icon,
			})
		};

	return {
		fill: new ol.style.Fill({
			color: 'rgba(0,0,255,' + (hover ? 0.2 : 0.1) + ')'
		}),
		stroke: new ol.style.Stroke({
			color: 'blue',
			width: hover ? 3 : 1.5
		})
	};
}

const gis = layerVectorURL({
	baseUrl: 'ext/Dominique92/GeoBB/gis.php?limit=300',
	urlSuffix: '',
	strategy: ol.loadingstrategy.bboxLimit,
	receiveProperties: function(properties) {
		properties.name = 'properties.nom';
		properties.link = 'properties.url';
		properties.copy = 'chemineur.fr';
	},
	styleOptions: function(properties) {
		return {
			// POI
			image: new ol.style.Icon({
				src: properties.icon,
			}),
			// Traces
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 3,
			}),
		};
	},
	hoverStyleOptions: {
		stroke: new ol.style.Stroke({ // For traces
			color: 'red',
			width: 3,
		})
	},
});

new ol.Map({
	target: 'map',
	layers: [
		layerChemineur(),
		gis,
		cadre,
	],
	controls: controlsCollection({
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
	}),
});