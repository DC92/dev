//TODO https://developers.google.com/web/fundamentals/app-install-banners/

if ('serviceWorker' in navigator) {
	navigator.serviceWorker.register('./service-worker.js')
		.then(() => console.log('Service worker registered!'))
} else
	alert('NO SW');

function renderChange(e) {
	myWorker.port.postMessage({
		type: 'RENDER',
		data: {
			center: e.frameState.viewState.center,
			resolution: e.frameState.viewState.resolution
		}
	});
}

var map;

if (window.SharedWorker) {
	var myWorker = new SharedWorker('shared-worker.js');

	myWorker.port.onmessage = function(e) {
		switch (e.data.type) {
			case 'READY':
				map.on('postrender', renderChange);
				break;
			case 'RENDER':
				debounce(() => {
					console.log('RENDER');
					map.un('postrender', renderChange);
					map.getView().setResolution(e.data.data.resolution);
					map.getView().setCenter(e.data.data.center);
					setTimeout(e => map.on('postrender', renderChange), 200);
				}, 75)();
				break;
			default:
				break;
		}
	}
}

function debounce(func, wait, immediate) {
	var timeout;
	return function() {
		var context = this,
			args = arguments;
		var later = function() {
			timeout = null;
			if (!immediate) func.apply(context, args);
		};
		var callNow = immediate && !timeout;
		clearTimeout(timeout);
		timeout = setTimeout(later, wait);
		if (callNow) func.apply(context, args);
	};
};

/* window.addEventListener('beforeinstallprompt', (e) => {
	// Stash the event so it can be triggered later.
	deferredPrompt = e;
	alert(22);
}); */

window.addEventListener('load', function() {
	map = new ol.MyMap({
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