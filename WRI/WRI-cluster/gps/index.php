<?php
include ('../config_privee.php');
include ('../MyOl/gps/index.php');

$notail = true;
?>
<script src="../vues/_cartes.js"></script>
<script>
	var mapKeys = <?=json_encode($config_wri['mapKeys'])?>;
	controlOptions.layerSwitcher.layers = mapBaseLayers('gps');
	controlOptions.supplementaryControls = [
			controlButton({
				label: '&#x1F3E0;',
				submenuHTML: '<p>Retour à <a href="/">Refuges.info</a></p>',
			}),
	];
</script>

</body>
</html>