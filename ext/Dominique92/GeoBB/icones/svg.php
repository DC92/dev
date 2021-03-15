<?php
// Traduit le nom si nécéssaire
include ('alias.php');
if (isset ($alias[$_GET['nom']]))
	$_GET['nom'] = $alias[$_GET['nom']];

// Recherche les arguments dans le nom du fichier
preg_match_all ('/([a-z]+)([0-9]*)\.?([0-9]*)\.?([0-9]*)_/', $_GET['nom'].'_', $attributs);

// Traitement du premier attribut (nom de l'icône)
$icone = $attributs[1][0];
if (!file_exists("icones/$icone.svg"))
	$icone = '_404';

// Attributs par defaut
$taille = 24;
$porte = $icone;
$couleur1 = null;
$couleur2 = null;

// Pour les autres attributs
foreach ($attributs[1] AS $k=>$attribut)
	if ($k) { // le 0 est l'icône !
		// Ascii a123.4.5 = caractère &#123; à la position x = 4, y = 5
		if ($attribut == 'a') {
			$ascii = intval ($attributs[2][$k]) ?: 32; // Extrait le code décimal
			$x_ascii = $attributs[3][$k] ? $attributs[3][$k] : 7.6;
			$y_ascii = $attributs[4][$k] ? $attributs[4][$k] : 21.5;
		}

		if (in_array ($attribut, ['a','eau','manqueunmur']))
			$porte = false;

		if ($attribut == 't')
			$taille = $attributs[2][$k];
		else
		if (!file_exists("attributs/$attribut.svg")) {
			// Ça doit être une couleur
			if ($k < 2) // Le premier attribut peut être la couleur de face
				$couleur1 = $attribut;
			$couleur2 = $attribut; // Le premier ou deuxième attribut peut être la couleur des toits et murs

			$porte = false;
		}
	}

// Enlève le premier code qui est l'attribut
array_shift ($attributs[1]);

// Ajoute un attribut porte avant les autres
if ($porte == 'cabane')
	array_unshift ($attributs[1], 'porte');

// Génération du fichier SVG
header ('Content-type: image/svg+xml');
//header ('Content-type: text/plain'); // Debug
header ('Cache-Control: max-age=86000');
header ('Access-Control-Allow-Origin: *');
if ($icone == '_404')
	header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");

include ('_head.svg');
include ("icones/$icone.svg");

if ($icone != '_404')
	foreach ($attributs[1] AS $attribut)
		if (file_exists("attributs/$attribut.svg")) {
			echo PHP_EOL; // Jolie mise en page du fichier .svg
			include ("attributs/$attribut.svg");
		}

include ('_tail.svg');
