<?php
// Traduit le nom si nécéssaire
include ('alias.php');
if (isset ($alias[$_GET['nom']]))
	$_GET['nom'] = $alias[$_GET['nom']];

// Recherche les arguments dans le nom du fichier
preg_match_all ('/([a-z]+)([0-9]*)\.?([0-9]*)\.?([0-9]*)_/', $_GET['nom'].'_', $codes);

// Le dernier argument peut être t123.4.5 : la taille de l'icône 123x123 pixels
$taille = 24;
if (end ($codes[1]) == 't') { // Teste le dernier code
	$taille = intval (array_pop ($codes[2])) ?: $taille;
	array_pop ($codes[1]); // Enlève ce code
}

// Traitement du premier code
$base = array_shift ($codes[1]);
if (!file_exists("bases/$base.svg"))
	$base = '_404';

// Pour les autres codes d'attributs
$porte = $base;
$couleur = '#ffeedd';
$couleur_toit = 'red';
$couleur_mur = '#e08020';

foreach ($codes[1] AS $k=>$code) {
	// Ascii a123.4.5 = caractère &#123; à la position x = 4, y = 5
	$ascii = intval ($codes[2][$k+1]) ?: 32; // Extrait le code décimal
	$x_ascii = $codes[3][$k+1] ? $codes[3][$k+1] : 7.6;
	$y_ascii = $codes[4][$k+1] ? $codes[4][$k+1] : 21.5;

	if (in_array ($code, ['a','eau','manqueunmur']))
		$porte = false;

	if (!file_exists("attributs/$code.svg")) {
		if (!$k) { // Le premier code peut être la couleur de face
			$couleur = $couleur_toit = $couleur_mur = $code;

			// Bâtiment à contour et toits noirs, face blanche
			if ($code == 'black')
				$couleur = 'white';
			$porte = false;
		} else // Le deuxième code peut être la couleur des toits et murs
			$couleur_toit = $couleur_mur = $code;
	}
}

// Ajoute un attribut porte avant les autres
if ($porte == 'cabane')
	array_unshift ($codes[1], 'porte');

// Génération du fichier SVG
header ('Content-type: image/svg+xml');
//header ('Content-type: text/plain'); // Debug
header ('Cache-Control: max-age=86000');
header ('Access-Control-Allow-Origin: *');
if ($base == '_404')
	header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");

include ('_head.svg');
include ("bases/$base.svg");

if ($base != '_404')
	foreach ($codes[1] AS $code)
		if (file_exists("attributs/$code.svg")) {
			echo PHP_EOL;
			include ("attributs/$code.svg");
		}

include ('_tail.svg');
