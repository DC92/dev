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
		console.log(registrationDate+genId);
	});

// Openlayers part
const help = 'Pour utiliser les cartes et le GPS hors réseau :\n' +
	'- Installez l\'application web : explorateur -> options -> ajouter à l\'écran d\'accueil\n' +
	'- Choisissez une couche de carte\n' +
	'- Placez-vous au point de départ de votre randonnée\n' +
	'- Zoomez au niveau le plus détaillé que vous voulez mémoriser\n' +
	'- Passez en mode plein écran (mémorise également les échèles supérieures)\n' +
	'- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles\n' +
	'- Recommencez avec les couches de cartes que vous voulez mémoriser\n' +
	'- Allez sur le terrain et cliquez sur l\'icône "GPS"\n' +
	'- Si vous avez un fichier .gpx dans votre mobile, visualisez-le en cliquant sur ▲\n' +
	'* Toutes les dalles visualisées une fois seront conservées dans le cache de l\'explorateur\n' +
	'* Les icônes de refuges.info ne sont disponibles que quand vous avez du réseau\n' +
	'* Cette application ne permet pas d\'enregistrer le parcours\n' +
	'* Fonctionne bien sur Android avec Chrome, Edge & Samsung Internet, un peu moins bien avec Firefox & Safari\n' +
	'* Aucune donnée ni géolocalisation n\'est remontée ni mémorisée\n',

	baseLayers = {
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
		controlGPS(),
		controlLoadGPX(),
		controlButton({
			className: 'ol-help myol-button',
			title: help,
			activate: function() {
				alert(this.title + window.location + registrationDate + genId);
			},
		}),
	],

	prcLayer = layerVectorURL({
		url: 'gif.gpx',
		format: new ol.format.GPX(),
		readFeatures: function (response) {
			return (response);
		},
		styleOptions: function(properties) {
			return {
				stroke: new ol.style.Stroke({
					color: 'blue',
					width: 3,
				}),
			};
		},
	}),

	map = new ol.Map({
		target: 'map',
		layers: [prcLayer],
		controls: controls,
	});
/*	
			// Zoom the map on the added features
		const extent = ol.extent.createEmpty();
		for (let f in features)
			ol.extent.extend(extent, features[f].getGeometry().getExtent());
		map.getView().fit(extent, {
			maxZoom: 17,
		});
*/