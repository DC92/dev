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
if(0)//TODO DEBUG
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
const elListe = document.getElementById('gps-trace-list'),
	controls = [
		// No button controls
		controlTilesBuffer(4),
		controlLayerSwitcher(),
		controlPermalink(),

		// Bottom
		new ol.control.Attribution({
			collapseLabel: '>',
		}),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		controlLengthLine(),

		// Top left
		new ol.control.Zoom(),
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
		controlDownload(),
/*
		controlButton({ // List of tracks in the same directory
			label: elListe ? '&#x1F6B6;' : null,
			submenuEl: elListe,
		}),
		controlButton({ // Help
			label: '?',
			submenuEl: document.getElementById('gps-help'),
		}),
*/
	],
	map = new ol.Map({
		target: 'map',
		controls: controlsCollection().concat(controlLayerSwitcher()),
		view: new ol.View({
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
	});
let gpxLayer;

// Add a gpx layer from files in the same directory
map.once('postrender', () => addGpxLayer(location.hash.replace('#', '')));

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
		document.getElementById('gps-trace-list').parentElement.classList.remove('myol-display-submenu');
	}
}