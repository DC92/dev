// Install or update the app from the source site
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('./service-worker.js')
		.then(() => console.log('Service worker registered!'))
else
	console.log('No service worker');

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

function renderChange(e) {
	myWorker.port.postMessage({
		type: 'RENDER',
		data: {
			center: e.frameState.viewState.center,
			resolution: e.frameState.viewState.resolution
		}
	});
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