<?php
setcookie ('baselayer', 'Refuges.info');

include ('../config_privee.php');
$mapKeys = $config_wri['mapKeys'];

include ('../MyOl/gps/index.php');
?>
//TODO mettre dans un fichier include !
<div id="additional-selector" >
	Refuges.info <input type="checkbox" name="wri-features" />
	<ul>
		<li><input type="checkbox" name="wwri-features" value="7" checked="checked" />Cabane</li>
		<li><input type="checkbox" name="wwri-features" value="10" />Refuge</li>
		<li><input type="checkbox" name="wri-features" value="9" />Gîte</li>
		<li><input type="checkbox" name="wri-features" value="23" />Point d'eau</li>
		<li><input type="checkbox" name="wri-features" value="6" />Sommet</li>
		<li><input type="checkbox" name="wri-features" value="3" />Passage</li>
		<li><input type="checkbox" name="wri-features" value="28" />Bâtiment</li>
	</ul>
</div>

<script>
	window.addEventListener('load', function() {
		map.addLayer(layerWri({
			selectorName: 'wri-features',
			maxResolution: 100,
			distance: 50,
		}));
	});
</script>
