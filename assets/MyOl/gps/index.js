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
	navigator.serviceWorker.register(myolPath + 'service-worker.js.php?' + compressedStartPath, {
		scope: './',
	})
	.then(registration => {
		console.log('PWA SW registered ' + myolSWbuild);
		registration.onupdatefound = async function() { // service-worker.js is changed
			console.log('PWA update found');

			// Completely unregister the previous SW to avoid installed SW actions ongoing
			//BEST reload 2 times whan update !
			if (registration.active) { // If it's an upgrade
				await navigator.serviceWorker.getRegistrations().then(registrations => {
					if (registrations.length) {
						for (let reg of registrations)
							if (reg.active && reg.active.scriptURL.includes('MyOl'))
								reg.unregister()
								.then(console.log('SW ' + reg.active.scriptURL + ' deleted'));
					}
				});
			}

			// Wait for end of all actions & roboot
			const installingWorker = registration.installing;
			installingWorker.addEventListener('statechange', () => {
				if (installingWorker.state === 'installed') {
					console.log('PWA update installed / reload');
					location.reload();
				}
			});
		}
	})

// Manage the map
var map;

window.addEventListener('load', function() {
	// Load the map
	map = new ol.Map({
		target: 'map',
		view: new ol.View({
			constrainResolution: true, // Force zoom on the available tile's definition
		}),
		controls: controlsCollection(controlOptions)
			.concat(controlLayerSwitcher(controlOptions.layerSwitcher)),
	});
});