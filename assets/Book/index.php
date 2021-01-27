<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Photos Dominique Cavailhez</title>
	<link rel="stylesheet" href="book.css">

	<style>
		/* Spécifique à cette page */
		body: {
		}
		.rayon {
			text-align: center;
		}
		.cover {
			display: inline-block;
			min-width: 32%;
		}
	</style>
</head>

<body>

<?php
foreach (glob('*/*') AS $f) {
	preg_match ('/(.*)\/([0-9][0-9])([+-]).*\.(.)/', $f, $m);
	if ($m) {
		if ($m[4] == 'J')
			$m[4] = 'j';
		$books [$m[1]] [$m[2]] [$m[3]] [$m[4]] = $f;
	}
}

$album_courant = @array_keys($_GET)[0];
$page_courante = @$_GET[$album_courant];
$file = @$books[$album_courant][$page_courante ?: '00'];

function carre ($file, $side = '-') {
	$r = '';
	$h = 0; // Nb em de h1 & p
	if (isset ($file[$side])) {
		if (isset ($file[$side]['T'])) {
			$r .= '<h1>'. @file_get_contents($file[$side]['T']) .'</h1>'.PHP_EOL;
			$h += 2.3;
		}
		if (isset ($file[$side]['t'])) {
			$r .= @file_get_contents($file[$side]['t']).PHP_EOL;
			$h += 1.1;
		}
		if (isset ($file[$side]['j']))
			$r .= "<div style='border:1px solid red;height:calc(100% - {$h}em)'>\n".
				  "<img src='{$file[$side]['j']}' />\n</div>\n";
	}
	return $r;
}

// Entrée dans le site
if (!$album_courant) { ?>
	<div class="rayon">
<?php 
	foreach ($books AS $album => $book) {
		$titre = @file_get_contents ($book['00']['-t']);
		?>
		<div class="cover">
			<a href='?<?=$album?>' title='Ouvrir le livre'>
				<?=carre($book['00'],'-')?>
			</a>
		</div>
<?php } ?>
	</div>
<?php 
}
// Un livre
elseif (!$page_courante) { ?>
	<div class="book">
		<div>
			<?=carre($file,'-')?>
		</div>
	</div>
<?php } else { ?>
	<div class="book open">
		<div class="left">
			<?=carre($file,'+')?>
		</div>
		<div>
			<?=carre($file,'-')?>
		</div>
	</div>
<?php } ?>

</body>
</html>
