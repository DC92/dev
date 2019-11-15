// This software is a progressive web application (PWA)
// It's composed as a basic web page but includes many services as
// data storage that make it as powerfull as an installed mobile application
// See https://developer.mozilla.org/fr/docs/Web/Progressive_web_apps

// The map is based on https://openlayers.org/
// With some personal additions https://github.com/Dominique92/MyOl

// Force https to allow web apps and geolocation
if (window.location.protocol == 'http:')
	window.location.href = window.location.href.replace('http:', 'https:');

// Force the script name of short url
if (!window.location.pathname.split('/').pop())
	window.location.href = window.location.href + 'index.php';

// Load service worker for web application install & updates
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('service-worker.php')
	// Reload if any app file has been updated
	.then(function(reg) {
		reg.addEventListener('updatefound', function() {
			location.reload();
		});
	});

// Extract the generation ID from the first comment of the registered service-worker
var genId;
fetch('service-worker.php')
	.then(function(response) {
		return response.text();
	})
	.then(function(data) {
		genId = data.match(/[0-9]+/)[0];
		console.log(registrationDate + genId);
	});

// Openlayers part
const baseLayers = {
		'Topo': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'IGN': layerIGN('hcxdz5f1p9emo4i1lch6ennl', 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'Transport': layerThunderforest('ee751f43b3af4614b01d1bce72785369', 'transport'),
		'Google': layerGoogle('m'),
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'Photo': layerGoogle('s'),
	},

	controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({
			visible: false,
		}),
		new ol.control.ScaleLine(),
		new ol.control.Attribution({
			collapseLabel: '>',
		}),
		controlMousePosition(),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '', //HACK Bad presentation on IE & FF
			tipLabel: 'Plein écran',
		}),
		controlButton({
			className: 'myol-button ol-load-gpx',
			title: 'Charger une trace',
			activate: function() {
				document.getElementById('liste').style.display = 'block';
				window.scrollTo(0, 0);
				if (document.fullscreenElement)
					document.exitFullscreen();
			},
		}),
		controlGPS(),
	],

	map = new ol.Map({
		target: 'map',
		controls: controls,
	});

function addLayer(gpx) {
	const layer = layerVectorURL({
		url: gpx + '.gpx',
		format: new ol.format.GPX(),
		readFeatures: function(response) {
			map.getView().setZoom(1); // Enable gpx rendering anywhere we are
			return (response); // No jSon syntax verification because it's XML
		},
		styleOptions: function() {
			return {
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3,
				}),
			};
		},
	});

	// Zoom the map on the added features
	layer.once('prerender', function() {
		const features = layer.getSource().getFeatures(),
			extent = ol.extent.createEmpty();
		for (let f in features)
			ol.extent.extend(extent, features[f].getGeometry().getExtent());
		map.getView().fit(extent, {
			maxZoom: 17,
		});

		if (features.length)
			document.getElementById('liste').style.display = 'none';
	});

	map.addLayer(layer);
}

if (trace)
	addLayer(trace);