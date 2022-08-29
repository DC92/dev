// Force https to allow PWA and geolocation
// Force full script name of short url to allow PWA
if (!location.href.match(/(https|localhost).*index/))
	location.replace(
		(location.hostname == 'localhost' ? 'http://' : 'https://') +
		location.hostname +
		location.pathname + (location.pathname.slice(-1) == '/' ? 'index.php' : '') +
		location.search +
		location.hash);

// Load service worker for web application install & updates
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('service-worker.js.php')
	.then(registration => {
		if (registration.active) // Avoid reload on first install
			registration.onupdatefound = function() { // service-worker.js is changed
				console.log('PWA onupdatefound\nunregister ' + registration.active.scriptURL);
				registration.unregister(); // Clean everything
				location.reload(); // Redo from start
			}
	});

// Manage the map
const map = new ol.Map({
	target: 'map',
	controls: controlsCollection(controlOptions)
		.concat(controlLayerSwitcher(controlOptions.LayerSwitcher)),
	view: new ol.View({
		constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
	}),
});