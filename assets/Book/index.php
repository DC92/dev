<!doctype html>
<html lang="fr">
<head>
	<meta charset="utf-8">
	<title>Photos Dominique Cavailhez</title>
	<link rel="stylesheet" href="book.css">

	<style>
		/* Spécifique à cette page */
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
foreach (glob('*/*.[jJ]*') AS $f) {
	preg_match ('/(.*)\/([0-9][0-9])([+-]).*/', $f, $m);
	if (count ($m))
		$galleries [$m[1]] [$m[2]] [$m[3]] = $f;
}

$album_courant = @array_keys($_GET)[0];
$pages_numbers = @array_keys($galleries[$album_courant]);
$page_courante = @$_GET[$album_courant];
if (!$page_courante || $page_courante == '00')
	$page_courante = $pages_numbers[1];
$indice_page = @array_search ($page_courante, $pages_numbers) ?: 0;
$previous_page = @$pages_numbers[$indice_page-1];
$next_page = @$pages_numbers[$indice_page+1];

function carre ($album, $page, $side = '-') {
	global $galleries;
	$h = 0; // Nb em de h1 & p
	$r = '';

	preg_match ("/§$page$side([^§]*)/s", @file_get_contents("$album/index.txt"), $m);
	if (count ($m)) {
		$ts = explode ("\n", $m[1]);
		foreach ($ts AS $kv=>$vv)
			if (!trim ($vv))
				;
			elseif ($kv) {
				$r .= '<p>'.trim ($vv).'</p>'.PHP_EOL;
				$h += 1.1;
			}
			else {
				$r .= '<h1>'.trim ($vv).'</h1>'.PHP_EOL;
				$h += 3.4;
			}
	}

	if (isset ($galleries[$album][$page][stripslashes($side)]))
		$r .= "<div style='height:calc(100% - {$h}em)'>\n".
			  "<img src='{$galleries[$album][$page][stripslashes($side)]}' />\n</div>\n";

	return $r;
}

// Entrée dans le site
if (!$album_courant) { ?>
	<div class="rayon">
<?php 
	foreach ($galleries AS $album => $images) { ?>
		<div class="cover">
			<a href='?<?=$album?>' title='Ouvrir le livre'>
				<?=carre ($album, '00')?>
			</a>
		</div>
<?php } ?>
	</div>
<?php }

// Un livre fermé
elseif (!$page_courante || $page_courante == '00') { ?>
	<div class="book">
		<a>
			<?=carre ($album_courant, '00')?>
		</a>
		<a id="next-page" href="?<?=$album_courant?>=<?=$next_page?>" title="Page suivante">&#9754;</a>
	</div>
<?php }

// Un livre ouvert
else { ?>
	<div class="book open">
		<a class="left">
			<?=carre ($album_courant, $page_courante, '\\+')?>
		</a>
		<a>
			<?=carre ($album_courant, $page_courante)?>
		</a>
<?php if ($previous_page == '00') { ?>
		<a id="previous-page" href="." title="Refermer le livre">&#9755;</a>
<?php } elseif ($previous_page) { ?>
		<a id="previous-page" href="?<?=$album_courant?>=<?=$previous_page?>" title="Retourner à la page précédente">&#9755;</a>
<?php } if ($next_page) { ?>
		<a id="next-page" href="?<?=$album_courant?>=<?=$next_page?>" title="Tourner la page">&#9754;</a>
<?php } ?>
	</div>
	<a id="home" href="." title="Revenir à la bibliothèque">&#128418;</a>
	<?=$page_courante?>
<?php } ?>

</body>
</html>