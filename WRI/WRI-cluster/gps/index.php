<?php
// Force la couche carte quand on lance le GPS
setcookie ('baselayer', 'Refuges.info');

include ('../config_privee.php');
$mapKeys = $config_wri['mapKeys'];

$no_tail = true;
include ('../MyOl/gps/index.php');
?>

<style>
	.myol-button-switcher div {
		padding: 2px 0 2px 5px;
	}
	#additional-selector ul {
		padding: 0;
	}
	#additional-selector li {
		margin: 3px 0 3px 10px;
		list-style-type: none;
	}
</style>

<div id="additional-selector" >
	<hr />
	Refuges.info <input type="checkbox" name="wri-features" value="all" />
	<ul>
		<li><input type="checkbox" name="wri-features" value="7" />Cabane</li>
		<li><input type="checkbox" name="wri-features" value="10" />Refuge</li>
		<li><input type="checkbox" name="wri-features" value="9" />Gîte</li>
		<li><input type="checkbox" name="wri-features" value="23" />Point d'eau</li>
		<li><input type="checkbox" name="wri-features" value="6" />Sommet</li>
		<li><input type="checkbox" name="wri-features" value="3" />Passage</li>
		<li><input type="checkbox" name="wri-features" value="28" />Bâtiment</li>
	</ul>
</div>

<script>
	window.addEventListener('load', function() {
		localStorage.setItem('myol_wrifeatures', '7,9,10,23');

		map.addLayer(layerWri({
			selectorName: 'wri-features',
			maxResolution: 100, // La couche est affichée pour les résolutions < 100 Mercator map unit / pixel
			distanceMinCluster: 30,
		}));
	});
</script>

</body>
</html>
