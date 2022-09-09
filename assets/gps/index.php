<?php
include ('../MyOl/gps/index_header.php');
//TODO pas de mise à jour si on change fichiers gpx / vérifier tous les fichiers
?>
<style>
	#myol-gps-help {
		left: 0;
		width: 100%;
	}
</style>

<div id="myol-gps-help">
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
	<p style="font-size:0.7em">Mise à jour <?=$myol_SW_build.' @'.$_SERVER['HTTP_HOST'].'/'.$_SERVER['REQUEST_URI']?></p>
</div>

<script>
var controlOptions = {
	supplementaryControls: [
		controlButton({
			label: '?',
			submenuId: 'myol-gps-help',
		}),
	],
	layerSwitcher: {
		layers: layerTileCollection(),
	},
};
</script>

</body>
</html>