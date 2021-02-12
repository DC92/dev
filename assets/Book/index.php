<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Photos Dominique Cavailhez</title>
	<link href="https://fonts.googleapis.com/css2?family=Dancing+Script&family=Sacramento&display=swap" rel="stylesheet">
	<script src="jquery-3.5.1.min.js"></script>
	<script src="index.js?<?=filemtime('index.js')?>"></script>
	<link href="index.css?<?=filemtime('index.css')?>" rel="stylesheet">
</head>

<body>
	<div class="rayon">
		<h1>Mes meilleures photos</h1>

<?php
foreach (glob ("*/00*.[jJ]*") AS $f) {
	preg_match ('/([^\/]*)\/(.*)/', $f, $img);
	if (is_file ($img[1].'/index.txt')) {
		preg_match ('/§00(.*)/', file_get_contents ($img[1].'/index.txt'), $txt);
?>
		<a class="cover" href="book.php?<?=$img[1]?>" title="Ouvrir cet album">
			<div>
				<h1><?=$txt[1]?></h1>
				<div style='height:calc(100% - 3.4em)'>
					<img src='<?=$img[0]?>' />
				</div>
			</div>
		</a>
<?php }
} ?>

		<p>Cliquez sur un album pour le feuilleter</p>
	</div>
</body>
</html>