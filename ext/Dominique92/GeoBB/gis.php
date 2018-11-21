<?php
/**
* Extractions de données géographiques
*
* @copyright (c) Dominique Cavailhez 2015
* @license GNU General Public License, version 2 (GPL-2.0)
*
*/

define('IN_PHPBB', true);
$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : '../../../';
$phpEx = substr(strrchr(__FILE__, '.'), 1);
include($phpbb_root_path . 'common.' . $phpEx);

include_once('../../../assets/geoPHP/geoPHP.inc');

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();

$bboxs = explode (',', $bbox = request_var ('bbox', '-180,-90,180,90'));
$bbox_sql =
	$bboxs[0].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[1];

$diagBbox = hypot ($bboxs[2] - $bboxs[0], $bboxs[3] - $bboxs[1]); // Hypothènuse de la bbox

$priority = request_var ('priority', 0); // topic_id à affichage prioritaire
$limite = request_var ('limite', 250); // Nombre de points maximum
$format = $format_app = request_var ('format', 'json');
if ($format == 'gpx') {
	$limite = 10000;
	$diagBbox = 0; // Pas d'optimisation
}

// Recherche des points dans la bbox
$sql_array = [
	'SELECT' => [
		'post_subject',
		'f.forum_id',
		't.topic_id',
		'post_id',
		'forum_image',
		'forum_desc',
		'AsText(geom) AS geomwkt',
	],
	'FROM' => [POSTS_TABLE => 'p'],
	'LEFT_JOIN' => [[
		'FROM' => [TOPICS_TABLE => 't'],
		'ON' => 't.topic_id = p.topic_id',
	],[
		'FROM' => [FORUMS_TABLE => 'f'],
		'ON' => 'f.forum_id = p.forum_id',
	]],
	'WHERE' => [
		'geom IS NOT NULL',
		"Intersects (GeomFromText ('POLYGON (($bbox_sql))'),geom)",
		'post_visibility = '.ITEM_APPROVED,
		'OR' => [
			't.topic_first_post_id = p.post_id',
			'forum_desc LIKE "%[all=%"',
		],
	],
	'ORDER_BY' => "CASE WHEN f.forum_id = $priority THEN 0 ELSE left_id END",
];

/**
 * Change SQL query for fetching geographic data
 *
 * @event geo.gis_modify_sql
 * @var array     sql_array    Fully assembled SQL query with keys SELECT, FROM, LEFT_JOIN, WHERE
 */
$vars = array(
	'sql_array',
);
extract($phpbb_dispatcher->trigger_event('geo.gis_modify_sql', compact($vars)));

// Build query
if (is_array ($sql_array ['SELECT']))
	$sql_array ['SELECT'] = implode (',', $sql_array ['SELECT']);

if (is_array ($sql_array ['WHERE'])) {
	foreach ($sql_array ['WHERE'] AS $k=>&$w)
		if (is_array ($w))
			$w = '('.implode (" $k ", $w).')';
	$sql_array ['WHERE'] = implode (' AND ', $sql_array ['WHERE']);
}
$sql = $db->sql_build_query('SELECT', $sql_array);
$result = $db->sql_query_limit($sql, $limite);

// Ajoute l'adresse complète aux images d'icones
$sp = explode ('/', getenv('REQUEST_SCHEME'));
$ri = explode ('/ext/', getenv('REQUEST_URI'));
$bu = $sp[0].'://'.getenv('SERVER_NAME').$ri[0].'/';

$geojson = [];
$ampl = 0x100; // Max color delta
while ($row = $db->sql_fetchrow($result)) {
	// Color calculation
	preg_match_all('/[0-9\.]+/',$row['geomwkt'],$out);
	$x[0] = $out[0][0] * 30000 % $ampl; // From lon
	$x[1] = $out[0][1] * 30000 % $ampl; // From lat
	$x[2] = $ampl - ($x[0] + $x[1]) / 2;
	$color = '#';
	for ($c = 0; $c < 3; $c++) // Chacune des 3 couleurs primaires
		$color .= substr (dechex (0x100 + $x[$c]), -2); // 0x100 for left hex 0 / the 2 last hex int chars

	$properties = [
		'name' => $row['post_subject'],
		'id' => $row['topic_id'],
		'type_id' => $row['forum_id'],
		'post_id' => $row['post_id'],
		'icon' => $row['forum_image'] ? $bu.$row['forum_image'] : null,
		'color' => $color,
	];

	preg_match('/\[color=([a-z]+)\]/i', html_entity_decode ($row['forum_desc']), $colors);
	if (count ($colors))
		$properties['color'] = $colors[1];

	$g = geoPHP::load ($row['geomwkt'], 'wkt'); // On lit le geom en format WKT fourni par MySql
	$row['geojson'] = $g->out('json'); // On le transforme en format GeoJson
	$row['geophp'] = json_decode ($row['geojson']); // On transforme le GeoJson en objet PHP

	$geojson[] = [
		'type' => 'Feature',
		'geometry' => $row['geophp'], // On ajoute le tout à la liste à afficher sous la forme d'un "Feature" (Sous forme d'objet PHP)
		'properties' => $properties,
	];
}
$db->sql_freeresult($result);

// Formatage du header
$secondes_de_cache = 10;
$ts = gmdate("D, d M Y H:i:s", time() + $secondes_de_cache) . " GMT";
header("Content-disposition: filename=chemineur.$format");
header("Content-Type: application/$format_app; UTF-8"); // rajout du charset
header("Content-Transfer-Encoding: binary");
header("Pragma: cache");
header("Expires: $ts");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: max-age=$secondes_de_cache");

// On transforme l'objet PHP en code geoJson
$json = json_encode ([
	'type' => 'FeatureCollection',
	'timestamp' => date('c'),
	'features' => $geojson
]) . PHP_EOL;

if ($format == 'gpx') {
	$mmav = ["><", '"geoPHP" version="1.0"'];
	$mmap = [">\n<", 'xmlns="http://www.topografix.com/GPX/1/0"'];
	// Récupère les noms des points
	foreach ($geojson AS $gj)
		if ($gj['geometry']->type == 'Point') {
			$ll = 'lat="'.$gj['geometry']->coordinates[1].'" lon="'.$gj['geometry']->coordinates[0].'"';
			$mmav [] = "<wpt $ll />";
			$mmap [] = "<wpt $ll><name>".$gj['properties']['name']."</name></wpt>";
	}

	// On transforme l'objet PHP en code gpx
	$gp = geoPHP::load ($json, 'json');
	$gpx = str_replace ($mmav, $mmap, $gp->out('gpx'));
}

echo $$format;
