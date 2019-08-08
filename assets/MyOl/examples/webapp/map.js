// Openlayer part
window.addEventListener('load', function() {
	new ol.MyMap({
		target: 'map',
		controls: controlsCollection({
			geoKeys: {
				IGN: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
				thunderforest: 'a54d38a8b23f435fa08cfb1d0d0b266e', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
				bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
				// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
			}
		})
	});
});