<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Sliders</title>
	<link rel="stylesheet" href="slider.css">
	<script src="slider.js"></script>
</head>

<body>
	<?php include('slider.html') ?>

	<div class="list">
		<?php // Includes a list of thumbnails corresponding to the *.jpg in the subdirectories
		foreach (glob('*/*.j*') AS $f) {
			$fs = explode ('/', $f);
			$diaporamas [$fs[0]] [] = $f;
		}
		foreach ($diaporamas AS $d=>$fs)
			echo "<div style=\"background-image:url('{$fs[0]}')\"
					onclick='runFS(".json_encode($diaporamas [$d]).")'
				>$d</div>\n";
		?>
	</div>
</body>
</html>



