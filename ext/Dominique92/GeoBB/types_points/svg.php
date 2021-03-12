<?php

$alias = [
	// Icônes refuges.info
	// Tableau de correspondance temporaire
	// A retirer quand tous les noms des icones auront été codés
	// TOREFLECHIR : sly 2021-03-04 : de notre site seul l'export kml s'en sert encore, je pense corriger ça, mais j'hésite à le garder quand même pour la compatiblité des autres sites qui utiliseraient encore cette syntaxe ?
	// DOM : je pense que non, la compatibilité serait plutôt un site qui aurait ses propres icônes ancien-point-d-eau.png et qui n'aurait pas les nouveaux noms
	'ancien-point-d-eau' => 'eau_x',
	'batiment-en-montagne' => 'black_a63',
	'batiment-inutilisable' => 'black_x',
	'cabane-avec-eau' => 'cabane_eau',
	'cabane-avec-moyen-de-chauffage' => 'cabane_feu',
	'cabane-avec-moyen-de-chauffage-et-eau-a-proximite' => 'cabane_eau_feu',
	'cabane-cle' => 'cabane_cle',
	'cabane-eau-a-proximite' => 'cabane_eau',
	'cabane-non-gardee' => 'cabane',
	'cabane-sans-places-dormir' => 'cabane_a48',
	'gite-d-etape' => 'blue',
	'inutilisable' => 'black_x',
//	'lac' => 'lac',
	'passage-delicat' => 'triangle_a33',
	'point-d-eau' => 'eau',
	'refuge-garde' => 'red',
//	'sommet' => 'sommet',

	// Favicon
	'favicon' => 'cabane_feu_t384',

	// Icônes Overpass, C2C & PRC (remplacer ' ' par %20 dans l'URL)
	// Il s'agit en fait d'une équivalence des symboles geocaching utilisés par les GPS
	'Campground' => 'camping',
	'City Hall' => 'blue', // Hôtel ou location
	'Crossing' => 'black_x', // Fermé
	'Drinking Water' => 'eau',
	'Danger Area' => 'triangle_a33',
	'Fishing Hot Spot Facility' => 'cabane_manqueunmur', // Manque un mur
	'Ground Transportation' => 'bus',
	'Lodge' => 'cabane',
	'Parking Area' => 'parking',
	'Puzzle Cache' => 'black_a63',
	'Shopping Center' => 'ravitaillement', // Ravitaillement
	'Summit' => 'sommet',
	'Tunnel' => 'cabane_manqueunmur', // Orri
	'Water Source' => 'eau',
	'Waypoint' => 'triangle_a33',
];
if (isset ($alias[$_GET['nom']]))
	$_GET['nom'] = $alias[$_GET['nom']];

//------------------------------------------------------
// On va rechercher les arguments dans le nom du fichier
preg_match_all ('/([a-z]+)([0-9]*)_/', $_GET['nom'].'_', $codes);

$taille = 24;
if (end ($codes[1]) == 't') { // Teste le dernier code
	$taille = intval (array_pop ($codes[2])) ?: $taille;
	array_pop ($codes[1]); // Enlève ce code
}

//---------------------------
// Traitement du premier code
$base = array_shift ($codes[1]);

// Cas des bâtiments
$couleur = $base;
$couleur_toit = $base;
$couleur_mur = $base;

switch ($base) {
	case 'black': // Bâtiment à contour et toits noirs, face blanche
		$couleur = 'white';

	case 'blue': // Bâtiment bleu (hôtel)
	case 'green': // Gîte
	case 'red': // Refuge gardé
		$base = 'cabane';
	break;

	case 'cabane':
		$couleur = '#ffeedd';
		$couleur_toit = 'red';
		$couleur_mur = '#e08020';
		$porte = true; // Il faudra dessiner une porte
}

if (!file_exists("bases/$base.svg"))
	$base = '_404';

//----------------------------------
// Pour les autres codes d'attributs
foreach ($codes[1] AS $k=>$code) {
	// Ascii a123
	$ascii = intval ($codes[2][$k+1]) ?: 32; // On extrait le code décimal
	$position_ascii = $ascii == 33 ? 9.7 : 7.6; // Le caractère ! est moins large

	switch ($code) {
		case 'a':
		case 'eau':
		case 'manqueunmur':
		$porte = false;
	}

	if (!file_exists("attributs/$code.svg"))
		$base = '_404';
}

//-----------------------
// Génération du fichier SVG
header ('Content-type: image/svg+xml');
header ('Cache-Control: max-age=86000');
header ('Access-Control-Allow-Origin: *');
if ($base == '_404')
	header($_SERVER["SERVER_PROTOCOL"]." 404 Not Found");

include ("bases/_head.svg");
include ("bases/$base.svg");

if ($base != '_404') {
	if (isset ($porte) && $porte)
		include ("attributs/porte.svg");

	foreach ($codes[1] AS $code)
		include ("attributs/$code.svg");
}

include ("bases/_tail.svg");
