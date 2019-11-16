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
const help = [
		'Mode d‘emploi :',
		'Cliquer (PC) ou toucher (mobile) et déplacer : se déplacer dans la carte',
		'« + / − » ou pincer avec 2 doigts : zoomer dans la carte',
		'« Carré » : passer en mode plein écran',
		'« Flèche en haut » : afficher la liste des randos',
		'« Cible » : aller et rester à la position et orientation du GPS (mobile)',
		'« Cible » (2em appui) : voir le GPS mais ne plus le suivre',
		'« Cible » (3em appui) : effacer le GPS et remettre la carte nord en haut',
		'« ... » : Choisir un autre fond de carte',
		'Fonctionnement hors réseau (mobile) : avant de partir :',
		'   * paramètres de l‘explorateur (3 points verticaux) -> ajouter à l‘écran d‘accueil',
		'   * déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger les images des cartes',
		'Notes : cette application ne permet pas d‘enregistrer votre parcours',
		'Aucune donnée ni géolocalisation n‘est remontée ni mémorisée',
		'Fonctionne bien sur Android avec Chrome, Edge & Samsung Internet, un peu moins bien avec Firefox & Safari',
		'© Dominique Cavailhez 2019 ',
	],

	baseLayers = {
		'Topo': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'IGN': layerIGN('hcxdz5f1p9emo4i1lch6ennl', 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'Rando': layerThunderforest('ee751f43b3af4614b01d1bce72785369', 'outdoors'),
		'Transport': layerThunderforest('ee751f43b3af4614b01d1bce72785369', 'transport'),
		'OSM': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'Google': layerGoogle('m'),
		'Satellite': layerGoogle('s'),
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
		controlButton({
			className: 'myol-button ol-help',
			title: help.join('\n- '),
			activate: function() {
				alert(this.title + registrationDate + genId);
			},
		}),
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