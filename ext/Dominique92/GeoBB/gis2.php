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

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();

$type = request_var ('type', ''); // List of forums to include "1,2,3"
$cat = request_var ('cat', ''); // List of categories of forums to include "1,2,3"
$priority = request_var ('priority', 0); // topic_id à affichage prioritaire
//$exclude = request_var ('exclude', 0); // topic_id to exclude
$select = request_var ('select', ''); // Post to display
$format = request_var ('format', 'geojson'); // Format de sortie. Par défaut geojson
$layer = request_var ('layer', 'full'); // full | simple | cluster
$limit = request_var ('limit', 250); // Nombre de points maximum

$bboxs = explode (',', $bbox = request_var ('bbox', '-180,-90,180,90'));
$bbox_sql =
	$bboxs[0].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[1];

////////////////////////////////////////////////////////////////
if(0){
$sql="
SELECT post_id, geom_region,
ST_AsGeoJSON(geom) AS geojson,
ST_AsGeoJSON(ST_Centroid(ST_Envelope(geom))) AS geocenter
FROM phpbb_posts
WHERE geom IS NOT NULL
";
$subgroups = 25;
$result = $db->sql_query_limit($sql, 10000000);
while ($row = $db->sql_fetchrow($result)) {
//	echo"<pre style='background:white;color:black;font-size:16px'> = ".var_export($row,true).'</pre>'.PHP_EOL;
	$geocenter = json_decode ($row['geocenter'])->coordinates;
	$geom_region = intval (5000 + $geocenter[0] * $subgroups) * 10000 + intval (5000 + $geocenter[0] * $subgroups);
	$sqlupd = "UPDATE phpbb_posts SET geom_region = $geom_region WHERE post_id = ".$row['post_id'];
	$db->sql_query($sqlupd);
//	echo"<pre style='background:white;color:black;font-size:16px'> = ".var_export($sqlupd,true).'</pre>'.PHP_EOL;
}
//exit;
}
////////////////////////////////////////////////////////////////

// Super clusters
if ($layer == 'cluster') {
	$sql="
	SELECT count(*) AS num,
		ST_AsGeoJSON(ST_Centroid(ST_Envelope(geom))) AS geocenter
	FROM phpbb_posts AS p
		LEFT JOIN phpbb_forums f ON (f.forum_id = p.forum_id)
	WHERE geom_region IS NOT NULL AND ".
		($type ? "f.forum_id IN ($type) AND " : '').
		($cat ? "f.parent_id IN ($cat) AND " : '').
	"Intersects (GeomFromText ('POLYGON (($bbox_sql))',4326),geom)
	GROUP BY geom_region
	ORDER BY num DESC
	";
	$result = $db->sql_query($sql);
	$features = [];
	while ($row = $db->sql_fetchrow($result)) {
		$features[] = [
			'type' => 'Feature',
			'geometry' => trunc (json_decode ($row['geocenter'])),
			'properties' => [
				'cluster' => $row['num'],
			],
		];
	}
	$db->sql_freeresult($result);
}

// Normal features
else {
	// Recherche des points dans la bbox
	$sql_array = [
		'SELECT' => [
			'post_subject',
			'post_id',
			't.topic_id',
			'f.forum_id',
			'f.forum_name',
			'forum_image',
			'forum_desc',
			'geo_altitude',
			'ST_AsGeoJSON(geom) AS geo_json',
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
			$type ? "f.forum_id IN ($type)" : 'TRUE',
			$cat ? "f.parent_id IN ($cat)" : 'TRUE',
//			't.topic_id != '.$exclude,
			'geom IS NOT NULL',
			"Intersects (GeomFromText ('POLYGON (($bbox_sql))',4326),geom)",
			'post_visibility = '.ITEM_APPROVED,
			'OR' => [
				'forum_desc REGEXP ":point|:line|:poly"', // Has map
				'(forum_desc REGEXP ".point|.line|.poly" AND t.topic_first_post_id = p.post_id)', // Only map on the first topic
			],
		],
		'ORDER_BY' => "CASE WHEN f.forum_id = $priority THEN 0 ELSE left_id END",
	];

	if ($select)
		$sql_array['WHERE'] = array_merge ($sql_array['WHERE'], explode (',', $select));

	// Build query
	if (is_array ($sql_array ['SELECT']))
		$sql_array ['SELECT'] = implode (',', $sql_array ['SELECT']);

	if (is_array ($sql_array ['WHERE'])) {
		foreach ($sql_array ['WHERE'] AS $k=>&$w)
			if (is_array ($w))
				$sql_array ['WHERE'][$k] = '('.implode (" $k ", $w).')';
		$sql_array ['WHERE'] = implode (' AND ', $sql_array ['WHERE']);
	}

	$sql = $db->sql_build_query('SELECT', $sql_array);
	$result = $db->sql_query_limit($sql, $limit);

	// Ajoute l'adresse complète aux images d'icones
	$request_scheme = explode ('/', getenv('REQUEST_SCHEME'));
	$request_uri = explode ('/ext/', getenv('REQUEST_URI'));
	$url_base = $request_scheme[0].'://'.getenv('SERVER_NAME').$request_uri[0].'/';

	$data = $features = $signatures = [];
	while ($row = $db->sql_fetchrow($result)) {
		$properties = [
			'name' => $row['post_subject'],
			'id' => $row['topic_id'],
		];

		if ($layer == 'full') {
			$properties['link'] = $url_base.'viewtopic.php?t='.$row['topic_id'];
			$properties['type_id'] = $row['forum_id'];
			$properties['post_id'] = $row['post_id'];
		}

		if ($row['forum_image']) {
			preg_match ('/([^\/]+)\./', $row['forum_image'], $icon);
			$properties['type'] = $icon[1];
			if ($layer == 'full')
				$properties['icon'] = $url_base .str_replace ('.png', '.svg', $row['forum_image']);
		}

		// Disjoin points having the same coordinate
		$geophp = json_decode ($row['geo_json']);
		trunc ($geophp);
		if ($geophp->type == 'Point') {
			while (in_array (signature ($geophp->coordinates), $signatures))
				$geophp->coordinates[0] += 0.00001;
			$signatures[] = signature ($geophp->coordinates);
		}

		// geoJson
		$features[] = [
			'type' => 'Feature',
			'geometry' => $geophp, // On ajoute le tout à la liste à afficher sous la forme d'un "Feature" (Sous forme d'objet PHP)
			'properties' => $properties,
		];

		// GML
		$data [] = array_merge ($row, $properties);
	}
	$db->sql_freeresult($result);
}

// Formatage du header
$secondes_de_cache = 3600;
$ts = gmdate("D, d M Y H:i:s", time() + $secondes_de_cache) . " GMT";
header("Content-Transfer-Encoding: binary");
header("Pragma: cache");
header("Expires: $ts");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: max-age=$secondes_de_cache");
header("Content-Type: application/json; UTF-8");
header("Content-disposition: filename=geobb.json");

// On transforme l'objet PHP en code geoJson
echo json_encode ([
	'type' => 'FeatureCollection',
	'features' => $features,
]);

function trunc (&$a) {
	if (gettype($a) == 'object')
		foreach ($a AS $k=>$v)
			trunc ($a->{$k});
	elseif (gettype($a) == 'array')
		foreach ($a AS $k=>$v)
			trunc ($a[$k]);
	elseif (gettype($a) == 'double')
		$a = number_format ($a, 5);
	return $a;
}

function signature ($coord) {
	return $coord[0].'_'.$coord[1];
}
