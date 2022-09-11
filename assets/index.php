<?php
// Fichiers de c92.fr/gps
include ('MyOl/gps/index.php');

$notail = true;
?>

<script>
var menu = [
	'<p>Afficher une randonnée</p>',
<?php foreach ($gpx_files AS $f) { ?>
	'<a ctrlOnClick="loadURL" href="<?=$f?>"><?=ucfirst(pathinfo($f,PATHINFO_FILENAME))?></a>',
<?php } ?>
];

controlOptions.layerSwitcher.keys = {
	// Get your own (free) IGN key at https://geoservices.ign.fr/
	ign: {key: 'ngv5uf0uu1cafegv89kzr1o5'},
	// Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com/dashboard
	thunderforest: {key: 'ee751f43b3af4614b01d1bce72785369'},
	// Get your own (free) OS key at https://osdatahub.os.uk/
	os: {key: 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF'},
	// Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
	bing: {key: 'AldBMbaKNyat-j6CBRKxxH05uaxP7dvQu1RnMWCQEGGC3z0gjBu-bLniE_8WZvcC'},
};

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