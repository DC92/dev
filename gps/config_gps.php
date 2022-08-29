<?php
// Force la couche carte quand on lance le GPS
setcookie ('baselayer', 'Refuges.info');

include ('../config_privee.php');
$mapKeys = $config_wri['mapKeys'];

?>

<script>
const elListe = document.getElementById('gps-trace-list');
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
</script>

<div id="myol-help">
	<p>Pour utiliser les cartes et le GPS hors réseau,
		vous pouvez installer ce logiciel
		et mettre des parties de cartes en cache.</p>
	<hr /><p><u>Avant le départ:</u></p>
	<p>- Explorateur -> options -> ajoutez à l'écran d'accueil (ou: installer)</p>
	<p>Pour mémoriser un fond de carte:</p>
	<p>- Choisissez un fond de carte</p>
	<p>- Placez-vous au point de départ de votre randonnée</p>
	<p>- Zoomez au niveau le plus détaillé que vous voulez mémoriser</p>
	<p>- Déplacez-vous suivant le trajet de votre randonnée suffisamment lentement pour charger toutes les dalles</p>
	<p>- Recommencez avec les fonds de cartes que vous voulez mémoriser</p>
	<p>* Toutes les dalles visualisées une fois seront conservées
		dans le cache de l'explorateur quelques jours et
		pourront être affichées même hors de portée du réseau</p>
	<hr /><p><u>Hors réseau :</u></p>
	<p>- Ouvrez le marque-page ou l'application</p>
	<p>- Si vous avez une trace .gpx dans votre mobile,
		visualisez-le en cliquant sur &#x1F4C2;</p>
	<p>- Lancez la localisation en cliquant sur &#x2295;</p>
	<hr />
	<p>* Fonctionne bien sur Android avec Chrome, Edge, Brave, Samsung Internet,
		fonctions réduites avec Firefox & Safari</p>
	<p>* Cette application ne permet pas de visualiser ou d'enregistrer le parcours</p>
	<p>* Aucune donnée ni géolocalisation n'est remontée ni mémorisée</p>
	<hr /><p>Mise à jour: <?=date('d M Y H:i:s')?> @<?=$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']?>
	</p>
</div>