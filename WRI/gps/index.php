<?php
include ('../config_privee.php');
include ('../MyOl/gps/index.php');

$notail = true;
?>

<div id="add-select" >
	<hr/>
	<div>
		<label for="selec-wri-7">Cabanes</label>
		<input type="checkbox" id="selec-wri-7" name="selec-wri" value="7" />
	</div>
	<div>
		<label for="selec-wri-10">Refuges</label>
		<input type="checkbox" id="selec-wri-10" name="selec-wri" value="10" />
	</div>
	<div>
		<label for="selec-wri-9">Gîtes</label>
		<input type="checkbox" id="selec-wri-9" name="selec-wri" value="9" />
	</div>
	<div>
		<label for="selec-wri-23">Eau</label>
		<input type="checkbox" id="selec-wri-23" name="selec-wri" value="23" />
	</div>
</div>

<script src="../vues/_cartes.js"></script>
<script>
var mapKeys = <?=json_encode($config_wri['mapKeys'])?>;

controlOptions.supplementaryControls = [
	controlButton({
		label: '&#x1F3E0;',
		submenuHTML: '<p>Retour à <a href="/">Refuges.info</a></p>',
	}),
];
controlOptions.layerSwitcher.layers = mapBaseLayers('gps');
controlOptions.layerSwitcher.additionalSelectorId = 'add-select';

layers.push(layerWri({
	host: '/',
	selectName: 'selec-wri',
}));
</script>

</body>
</html>