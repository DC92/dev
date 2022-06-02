<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Slider</title>

	<script src="https://code.jquery.com/jquery-3.5.1.min.js"></script>
	<script src="MySlider.js"></script>
	<link rel="stylesheet" href="MySlider.css">
</head>

<?php
	$diapos = [];
	foreach (glob('*.*g') AS $f)
		$diapos[] = [$f, ''];

//TODO Slider bouton départ / son / full
//TODO Slider bouton son
//TODO resize ImageMagick
?>

<body>
	<div id="myslider"></div>

	<script>
		mySlider (
			'myslider', <?=json_encode($diapos)?>, {
				showButtonsDelay: 1500, // Optional
			}
		);
	</script>
</body>
</html>