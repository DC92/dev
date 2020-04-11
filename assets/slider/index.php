<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Slider</title>

	<script src="https://code.jquery.com/jquery-3.4.1.min.js" defer></script>
	<script src="slider.js?<?=filemtime('slider.js')?>" defer></script>
	<link rel="stylesheet" href="slider.css?<?=filemtime('slider.css')?>" defer>
</head>

<body>
	<div id="slider"></div>
	<script>
		var slides = [
			['https://www.refuges.info/photos_points/8741-originale.jpeg', 'Refuge du Goûter'],
			['https://www.refuges.info/photos_points/8059-originale.jpeg', "Tète Chevalière est situé dans Réserve Naturelle des Hauts Plateaux du Vercors. Sont interdits : Les chiens (même en laisse), les feux, le camping (mais le bivouac, c'est à dire montage de la tente après 17h et démontage avant 9h est autorisé), la cueillette des plantes, le ramassage des fossiles et le dépôt des déchets.Le décollage en parapente y est interdit mais le survol par tout type d'aéronef à plus de 300m est autorisé, le VTT ne sont autorisés que sur la variante GTV. L'escalade n'y est pas réglementée."],
			['https://www.refuges.info/photos_points/7984-originale.jpeg', 'Refuge des Grands-mulets,'],
		];
	</script>
</body>
</html>
