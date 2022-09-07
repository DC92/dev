// Force https to allow PWA and geolocation
// Force full script name of short url to allow PWA
if (!location.href.match(/(https|localhost).*index/))
	location.replace(
		(location.hostname == 'localhost' ? 'http://' : 'https://') +
		location.hostname +
		location.pathname + (location.pathname.slice(-1) == '/' ? 'index.php' : '') +
		location.search +
		location.hash);

// Load service worker for web application, install & update
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('service-worker.js.php')
	.then(registration => {
		console.log('PWA SW registered ' + myolSWbuild);
		registration.onupdatefound = async function() { // service-worker.js is changed
			console.log('PWA update found / reload');
			location.reload();
		}
	})

// Manage the map
//TODO GPS BUG ??? Mobile Gps picto rando ne ferme pas les autres
var map,
	controlOptions = { // To be updated by gps_addons.php before load
		Help: {
			helpId: 'myol-gps-help',
		},
	};

window.addEventListener('load', function() {
	// Dynamicaly set version number to helps
	Array.from(document.getElementsByClassName('myol-sw-build'))
		.forEach(el => el.innerHTML = myolSWbuild);

	// Load the map
	map = new ol.Map({
		target: 'map',
		view: new ol.View({
			constrainResolution: true, // Forces the zoom on the available tile's definition
		}),
		controls: controlsCollection(controlOptions)
			.concat(controlLayerSwitcher({
				layers: layersCollection(),
				...controlOptions.layerSwitcher
			})),
	});
});