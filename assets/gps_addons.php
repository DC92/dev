<div id="load-submenu">
	<p>Cliquez sur une trace pour l'afficher</p>
	
	<?php foreach ($gpx_files as $filename) { ?>
	<a ctrlOnClick="loadURL" href="<?=$filename?>">
		<?=ucfirst(pathinfo($filename, PATHINFO_FILENAME))?>
	</a>
	<?php } ?>
</div>

<script>
controlOptions.supplementaryControls = [
	controlLoadGPX({
		label: '&#x1F6B6;',
		submenuId: 'load-submenu',
	}),
];
</script>

