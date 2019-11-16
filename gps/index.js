// Force https to allow web apps and geolocation
if (window.location.protocol == 'http:' && window.location.host != 'localhost')
	window.location.href = window.location.href.replace('http:', 'https:');

// Force the script name of short url
if (!window.location.pathname.split('/').pop())
	window.location.href = window.location.href + 'index.php';

// Load service worker for web application install & updates
if ('serviceWorker' in navigator)
	navigator.serviceWorker.register('service-worker.js.php')
	// Reload if any app file has been updated
	.then(reg => {
		reg.addEventListener('updatefound', () => {
			location.reload();
		})
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
	'- Allez sur le terrain et cliquez sur l‘icône "GPS"\n' +
	'- Si vous avez un fichier .gpx dans votre mobile, visualisez-le en cliquant sur ⇑\n' +
	'* Toutes les dalles visualisées une fois seront conservées dans le cache de l‘explorateur\n' +
	'* Cette application ne permet pas d‘enregistrer le parcours\n' +
	'* Fonctionne bien sur Android avec Chrome, Edge & Samsung Internet, un peu moins bien avec Firefox & Safari\n' +
	'* Aucune donnée ni géolocalisation n‘est remontée ni mémorisée\n' +
	'Sw ' + dateGen,
	//TODO BEST dategen = dernière date des fichiers

	baseLayers = {
		'OpenTopoMap': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'Refuges.info': layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'IGN': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN Express': layerIGN(keys.ign, 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Google': layerGoogle('m'),
		'Photo Google': layerGoogle('s'),
		'Photo Bing': layerBing(keys.bing,'Aerial'),
		'Photo IGN': layerIGN(keys.ign, 'ORTHOIMAGERY.ORTHOPHOTOS'),
	};

// Load the map when the map DIV is intialised
window.onload = function() {
	new ol.Map({
		target: 'map',
		controls: [
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
			geocoder(),
			controlGPS(),
			controlLoadGPX(),
			controlButton({
				className: 'ol-help',
				title: help,
				activate: function(active) {
					alert(this.title);
				}
			}),
		],
	});
};