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
	.then(reg => {
		reg.addEventListener('updatefound', () => {
			location.reload();
		})
	});

// Openlayers part
// Initialise Openlayers vars
const help = 'Pour utiliser les cartes et le GPS hors connexion :\n' +
	'- Installez l\'application web : explorateur -> options -> ajouter à l\'écran d\'accueil\n' +
	'- Choisissez une couche de carte\n' +
	'- Placez-vous au point de départ de votre randonnée\n' +
	'- Zoomez au niveau le plus détaillé que vous voulez mémoriser\n' +
	'- Passez en mode plein écran (mémorise également les échèles supérieures)\n' +
	'- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles\n' +
	'- Recommencez avec les couches de cartes que vous voulez mémoriser\n' +
	'- Allez sur le terrain et cliquez sur l\'icône "MyGPS"\n' +
	'- Si vous avez un fichier .gpx dans votre mobile, visualisez-le en cliquant sur ⇑\n' +
	'* Toutes les dalles visualisées une fois seront conservées dans le cache de l\'explorateur\n' +
	'* Cette application ne permet pas d\'enregistrer le parcours\n' +
	'* Fonctionne bien sur Android avec Chrome, Edge & Samsung Internet, un peu moins bien avec Firefox & Safari\n' +
	'* Aucune donnée ni géolocalisation n\'est remontée ni mémorisée';

// Load the map when the map DIV is intialised
window.onload = function() {
	new ol.MyMap({
		target: 'map',
		controls: [
			controlLayersSwitcher({
				baseLayers: layersCollection({
					IGN: 'hcxdz5f1p9emo4i1lch6ennl', // Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
					thunderforest: 'a54d38a8b23f435fa08cfb1d0d0b266e', // Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
					bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt' // Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
					// SwissTopo : You need to register your domain in https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
				})
			}),
			controlPermalink({
				visible: false
			}),
			new ol.control.ScaleLine(),
			new ol.control.Attribution({
				collapseLabel: '>'
			}),
			new ol.control.MousePosition({
				coordinateFormat: ol.coordinate.createStringXY(5),
				projection: 'EPSG:4326',
				className: 'ol-coordinate',
				undefinedHTML: String.fromCharCode(0)
			}),
			new ol.control.Zoom({
				zoomOutLabel: '-'
			}),
			new ol.control.FullScreen({
				label: '',
				labelActive: '',
				tipLabel: 'Plein écran'
			}),
			geocoder(),
			controlGPS(),
			controlLoadGPX(),
			new ol.control.Button({
				label: '?',
				title: help,
				activate: function(active) {
					alert(this.title);
				}
			})
		]
	});
};