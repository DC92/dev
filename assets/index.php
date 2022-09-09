<?php
// Fichiers de c92.fr/gps
include ('MyOl/gps/index_header.php');
?>

<script>
var menu = [
	'<p>Afficher une randonnée</p>',
<?php foreach ($gpx_files AS $f) { ?>
	'<a ctrlOnClick="loadURL" href="<?=$f?>"><?=ucfirst(pathinfo($f,PATHINFO_FILENAME))?></a>',
<?php } ?>
];

controlOptions.supplementaryControls = [
	controlLoadGPX({
		label: '&#x1F6B6;',
		submenuHTML: menu.join('\n'),
	}),
	controlHelp({
		submenuId: 'myol-gps-help',
	}),
];
</script>

</body>
</html>