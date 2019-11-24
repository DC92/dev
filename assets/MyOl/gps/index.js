// Force https to allow web apps and geolocation
if (window.location.protocol == 'http:' && window.location.host != 'localhost')
	window.location.href = window.location.href.replace('http:', 'https:');

// Force the script name of short url
if (!window.location.pathname.split('/').pop())
	window.location.href = window.location.href + 'index.html';

// Load service worker for web application install & updates
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('service-worker.js')
	// Reload if any app file has been updated
	.then(function(reg) {
		reg.addEventListener('updatefound', function() {
			location.reload();
		});
	});

// Openlayers part
// Initialise Openlayers vars
const help = 'Pour utiliser les cartes et le GPS hors réseau :\n' +
	'- Installez l‘application web : explorateur -> options -> ajouter à l‘écran d‘accueil\n' +
	'- Choisissez une couche de carte\n' +
	'- Placez-vous au point de départ de votre randonnée\n' +
	'- Zoomez au niveau le plus détaillé que vous voulez mémoriser\n' +
	'- Passez en mode plein écran (mémorise également les échèles supérieures)\n' +
	'- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles\n' +
	'- Recommencez avec les couches de cartes que vous voulez mémoriser\n' +
	'- Allez sur le terrain et cliquez sur l‘icône "MyGPS"\n' +
	'- Si vous avez un fichier .gpx dans votre mobile, visualisez-le en cliquant sur ▲\n' +
	'* Toutes les dalles visualisées une fois seront conservées dans le cache de l‘explorateur quelques jours\n' +
	'* Cette application ne permet pas d‘enregistrer le parcours\n' +
	'* Fonctionne bien sur Android avec Chrome, Edge & Samsung Internet, un peu moins bien avec Firefox & Safari\n' +
	'* Aucune donnée ni géolocalisation n‘est remontée ni mémorisée',

	keys = {
		ign: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
		thunderforest: 'ee751f43b3af4614b01d1bce72785369', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
		bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
		// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
	},

	baseLayers = {
		'OpenTopo': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'OSM outdoors': layerThunderforest(keys.thunderforest, 'outdoors'),
		'OSM transport': layerThunderforest(keys.thunderforest, 'transport'),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'Refuges.info': layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		'IGN': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN Express': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'Photo IGN': layerIGN(keys.ign, 'ORTHOIMAGERY.ORTHOPHOTOS'),
		'Cadastre': layerIGN(keys.ign, 'CADASTRALPARCELS.PARCELS', 'png'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Angleterre': layerOS(keys.bing),
		'Bing': layerBing(keys.bing, 'Road'),
		'Photo Bing': layerBing(keys.bing, 'Aerial'),
		'Google': layerGoogle('m'),
		'Photo Google': layerGoogle('s'),
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
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
		controlButton({
			label:'?',
			title: help,
			activate: function() {
				alert(this.title);
			},
		}),
	];

new ol.Map({
	target: 'map',
	controls: controls,
});