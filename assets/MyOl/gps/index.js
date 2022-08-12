/**
 * PWA
 */
var map, gpxLayer;
const elListe = document.getElementById('gps-trace-list');

// Force https to allow PWA and geolocation
// Force full script name of short url to allow PWA
if (!location.href.match(/(https|localhost).*index/)) {
	location.replace(
		(location.hostname == 'localhost' ? 'http://' : 'https://') +
		location.hostname +
		location.pathname + (location.pathname.slice(-1) == '/' ? scriptName || 'index.html' : '') +
		location.search +
		location.hash);
} else {
	// Load service worker for web application install & updates
	if ('serviceWorker' in navigator)
		navigator.serviceWorker.register(
			typeof serviceWorkerName == 'undefined' ? 'service-worker.js' : serviceWorkerName, {
				// Max scope. Allow service worker to be in a different directory
				scope: typeof scope == 'undefined' ? './' : scope,
			}
		)
		.then(function(registration) {
			if (registration.active) { // Avoid reload on first install
				console.log('PWA SW registration.active');

				registration.onupdatefound = function() { // service-worker.js is changed
					console.log('PWA SW onupdatefound');

					const installingWorker = registration.installing;

					installingWorker.onstatechange = function() {
						console.log('PWA SW installingWorker.onstatechange ' + installingWorker.state);

						if (installingWorker.state == 'installed')
							// The old content have been purged
							// and the fresh content have been added to the cache.
							location.reload();
					};
				};
			}
		});

	// Manage the map
	const controls = [
		controlTilesBuffer(4),
		controlLayerSwitcher(),
		controlPermalink(),

		new ol.control.Attribution({
			collapseLabel: '>',
		}),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		controlLengthLine(),

		new ol.control.Zoom(),
		new ol.control.FullScreen({
			tipLabel: 'Plein écran',
		}),
		controlGeocoder(),
		controlGPS(),

		// List of traces
		controlButton({
			label: elListe ? '&#x1F6B6;' : null,
			submenuEl: elListe,
		}),

		controlLoadGPX(),
		controlDownload(),
		controlButton({
			label: '?',
			submenuEl: document.getElementById('gps-help'),
		}),
	];

	map = new ol.Map({
		target: 'map',
		controls: controls,
		view: new ol.View({
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
	});

	map.once('postrender', () => addGpxLayer(location.hash.replace('#', '')));
}

// Add a gpx layer from files in the same directory
function addGpxLayer(gpxArg) {
	if (typeof gpxFiles == 'object' &&
		gpxFiles.includes(gpxArg.toLowerCase())) {
		location.replace(location.href.replace(/#.*/, '') + '#' + gpxArg);

		// Remove existing layer
		if (gpxLayer)
			map.removeLayer(gpxLayer);

		// Zoom the map on the added features when loaded
		gpxLayer = new ol.layer.Vector({
			source: new ol.source.Vector({
				format: new ol.format.GPX(),
				url: gpxArg + '.gpx',
			}),
			style: new ol.style.Style({
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 2,
				}),
			}),
		});

		gpxLayer.once('prerender', function() {
			const features = gpxLayer.getSource().getFeatures(),
				extent = ol.extent.createEmpty();
			for (let f in features)
				ol.extent.extend(extent, features[f].getGeometry().getExtent());
			map.getView().fit(extent, {
				maxZoom: 17,
				size: map.getSize(),
				padding: [5, 5, 5, 5],
			});
		});
		map.addLayer(gpxLayer);

		//HACK needed because the layer only becomes active when in the map area
		map.getView().setZoom(1);

		// Close the submenu
		document.getElementById('gps-trace-list').parentElement.classList.remove('ol-display-submenu');
	}
}