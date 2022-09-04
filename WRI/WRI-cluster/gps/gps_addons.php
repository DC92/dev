<?php
include ('../../config_privee.php');
?>

<div id="additional-selector" >
	<hr />
	Dispo en zoom fort
	<br />
	<label for="wriall">Refuges.info<label>
	<input type="checkbox" name="wri-features" id="wriall" value="all" />
	<br />
	<input type="checkbox" name="wri-features" id="wri7" value="7" />
	<label for="wri7">Cabane<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri10" value="10" />
	<label for="wri10">Refuge<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri9" value="9" />
	<label for="wri9">Gîte<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri23" value="23" />
	<label for="wri23">Point d'eau<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri6" value="6" />
	<label for="wri6">Sommet<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri3" value="3" />
	<label for="wri3">Passage<label>
	<br />
	<input type="checkbox" name="wri-features" id="wri28" value="28" />
	<label for="wri28">Bâtiment<label>
</div>

<div id="wri-gps-help">
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
	<hr />
	<p>MyOl/gps <span class="myol-sw-version"></span></p>
</div>

<script>
// Couches de fond
var mapKeys = <?= json_encode($config_wri['mapKeys'])?>;

controlOptions.LayerSwitcher = {
	layers: {
		'Refuges.info': layerMRI(),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest('outdoors'),
		'IGN TOP25': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: mapKeys.ign,
		}),
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // The key for the free layers
			format: 'image/png',
		}),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': layerArcGIS('World_Imagery'),
		'Photo Bing': layerBing('Aerial'),
		'Photo Google': layerGoogle('s'),
	},
	additionalSelectorId: 'additional-selector',
};
controlOptions.Help = {
	helpId: 'wri-gps-help',
};

localStorage['myol_wrifeatures'] = '7,9,10,23'; // Force les 4 premières cases à l'init

window.addEventListener('load', function() {
	map.addLayer(layerWri({
		selectorName: 'wri-features',
		maxResolution: 100, // La couche est affichée pour les résolutions < 100 Mercator map unit / pixel
	}));
});
</script>
