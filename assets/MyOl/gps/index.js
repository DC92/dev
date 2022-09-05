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
		console.log('PWA SW ' + myolSWversion + ' registered');
		if (registration.active) // Avoid reinstall on first install
			registration.onupdatefound = async function() { // service-worker.js is changed
				console.log('PWA update found');

				// Clean the service worker
				await registration.unregister()
					.then(() => console.log('SW unregistered'));

				// Reinstall now to be ready for further offline use
				await navigator.serviceWorker.register('service-worker.js.php')
					.then(() => console.log('New SW registered'));

				// Clean the cache
				await caches.delete('myGpsCache')
					.then(() => console.log('PWA myGpsCache deleted'));

				// Restart to instant use of the new version
				location.reload();
			}
	});

// Manage the map
//TODO BUG ??? Mobile Gps picto rando ne ferme pas les autres
var map,
	controlOptions = { // To be updated by gps_addons.php before load
		Help: {
			helpId: 'myol-gps-help',
		},
	};

window.addEventListener('load', function() {
	// Dynamicaly set version number to helps
	Array.from(document.getElementsByClassName('myol-sw-version'))
		.forEach(el => el.innerHTML = myolSWversion);

	// Load the map
	map = new ol.Map({
		target: 'map',
		view: new ol.View({
			constrainResolution: true, // Forces the zoom on the available tile's definition
		}),
		controls: controlsCollection(controlOptions)
			.concat(controlLayerSwitcher(
				layersCollection() //TODO need options to update it via controlOptions
				//TODO Need to get keys
			)),
	});
});