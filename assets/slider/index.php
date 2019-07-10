<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Slider</title>
	<link rel="stylesheet" href="slider.css">
	<script src="slider.js"></script>
</head>

<body>
	<?php include('slider.html');

	// Makes a slider with the jpeg files in this directory
	foreach (glob('*.j*') AS $f)
		$diaporama [] = $f;
	?>

	<script>
		init(<?=json_encode($diaporama)?>);
	</script>

</body>
</html>
