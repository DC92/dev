<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Photos Dominique Cavailhez</title>
	<link href="favicon.svg" rel="shortcut icon" type="image/svg+xml" />

	<link href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Sacramento&display=swap" rel="stylesheet">
	<script src="jquery-3.5.1.min.js"></script>
	<script src="index.js?<?=filemtime('index.js')?>"></script>
	<link href="index.css?<?=filemtime('index.css')?>" rel="stylesheet">
</head>

<?php
$album = @array_keys ($_GET)[0];

// Get image list from ./album/*.j*
foreach (glob ("$album/*.[jJ]*") AS $f) {
	preg_match ('/([0-9][0-9]).*/', $f, $m);
	if (count ($m))
		$gallerie [intval($m[1])]['img'] = $f;
}

// Get text list from ./album/index.txt
$ts = explode ('§', @file_get_contents ("$album/index.txt"));
foreach ($ts AS $tss) {
	$tsss = explode ("\n", $tss);
	preg_match ('/([0-9][0-9])(.*)/', array_shift ($tsss), $m);

	if (@$m[2])
		$gallerie [intval($m[1])]['lines'][] = '<h1>'.$m[2].'</h1>';

	foreach ($tsss AS $tssss)
		if ($tssss)
			$gallerie [intval($m[1])]['lines'][] = '<p>'.$tssss.'</p>';
}

for ($p = 0; $p <= max(array_keys($gallerie)); $p++) {
	$gallerie[$p]['text'] = @implode ('', $gallerie[$p]['lines']);
	unset ($gallerie[$p]['lines']);
}
?>

<body>
	<h1 id="titre"><?=$album?></h1>
	<a id="home" href="." title="Revenir à la liste des albums">&#127968;</a>

	<div id="book">
		<div id="left">
			<div></div>
		</div>
		<div id="right">
			<div>
				<img title="Voir en plein écran" onclick="full()" />
			</div>

			<!-- Full screen -->
			<div id="full">
				<div></div>
				<a id="prev-page-full" onclick="page(-1)" title="Page précédente">&#9754;</a>
				<a id="next-page-full" onclick="page(1)" title="Tourner la page">&#9755;</a>
			</div>
		</div>

		<p id="left-number"></p>
		<p id="right-number"></p>

		<a id="prev-page" onclick="page(-1)" title="Page précédente">&#9754;</a>
		<a id="next-page" onclick="page(1)" title="Tourner la page">&#9755;</a>
		<a id="full-screen" onclick="full()" title="Voir plein écran">&#9974;</a>
	</div>

	<p id="copyright">&copy; Dominique Cavailhez 2021</p>
	<img id="next-img" />

	<script>
		var gallerie = <?=json_encode($gallerie)?>;
		page (parseInt (window.location.hash.substring(1) / 2));
	</script>
</body>
</html>