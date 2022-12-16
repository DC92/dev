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

// Parameters
$type = request_var ('type', ''); // List of forums to include "1,2,3"
$cat = request_var ('cat', ''); // List of categories of forums to include "1,2,3"
$priority = request_var ('priority', 0); // topic_id à affichage prioritaire
$select = request_var ('select', ''); // Post to display
$format = request_var ('format', 'geojson'); // Format de sortie. Par défaut geojson
$layer = request_var ('layer', 'verbose'); // verbose (full data) | cluster (grouped points) | 'simple' (simplified)
$limit = request_var ('limit', 200); // Nombre de points maximum

$bboxs = explode (',', $bbox = request_var ('bbox', '-180,-90,180,90'));
$bbox_sql =
	$bboxs[0].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[1].','.
	$bboxs[2].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[3].','.
	$bboxs[0].' '.$bboxs[1];

$request_scheme = explode ('/', getenv('REQUEST_SCHEME'));
$request_uri = explode ('/ext/', getenv('REQUEST_URI'));
$url_base = $request_scheme[0].'://'.getenv('SERVER_NAME').$request_uri[0].'/';

$clusters = $features = $signature = [];

// Extract clusters
if ($layer == 'cluster') {
	$cluster_size = 0.1;
	$cluster_min_points = 2;
	//BEST ??? pas groupir traces

	$sql="SELECT count(*),
		post_id,
		ST_AsGeoJSON(ST_centroid(ST_Envelope(geom)),5) AS geojson,
		ST_AsGeoJSON(ST_centroid(ST_Envelope(geom)),1) AS cluster_key
	FROM ".POSTS_TABLE."
	WHERE geom IS NOT NULL
		and Intersects(GeomFromText('POLYGON(($bbox_sql))',4326),geom)
	GROUP BY cluster_key";

	$result = $db->sql_query($sql);
	while ($row = $db->sql_fetchrow($result))
		if ($row['count(*)'] > $cluster_min_points)
			$clusters[$row['cluster_key']] = [
				'type' => 'Feature',
				'id' => $row['post_id'],
				'geometry' => json_decode ($row['geojson'], true),
				'properties' => [
					'cluster' => $row['count(*)'],
				],
			];
	$db->sql_freeresult($result);
}

// Extract other points
$sql="SELECT post_id, post_subject, topic_id,
	forum_name, forum_id, forum_image,
	geo_altitude,
	ST_AsGeoJSON(geom,5) AS geojson
FROM ".POSTS_TABLE."
	LEFT JOIN ".FORUMS_TABLE." USING(forum_id)
WHERE geom IS NOT NULL
	and Intersects(GeomFromText('POLYGON(($bbox_sql))',4326),geom)";

if (count ($clusters))
	$sql .= " and ST_AsGeoJSON(ST_centroid(ST_Envelope(geom)),1) NOT IN ('".implode("','",array_keys($clusters))."')";

if ($limit)
	$sql .= " LIMIT $limit";

$result = $db->sql_query($sql);
while ($row = $db->sql_fetchrow($result)) {
	$altitudes = explode (',', str_replace ('~', '', $row['geo_altitude']));
	$geojson = preg_replace_callback (
		'/(-?[0-9.]+), ?(-?[0-9.]+)/',
		function ($m) {
			global $signature, $altitudes;
			// Avoid points with the same position
			while (in_array ($m[1].$m[2], $signature))
				$m[1] += 0.00001; // Spread 1m right
			$signature[] = $m[1].$m[2];

			// Populate geojson altitudes
			if (count ($altitudes))
				$m[2] .= ', '.array_shift($altitudes);
			return $m[1].','.$m[2];
		},
		$row['geojson']
	);

	$properties = [
		'id' => $row['topic_id'],
		'name' => $row['post_subject'],
		'type' => $row['forum_name'],
	];
	if ($altitudes[0])
		$properties['alt'] = $altitudes[0];
	if ($layer == 'verbose') {
		$properties['id'] = $row['topic_id'];
		$properties['type_id'] = $row['forum_id'];
		$properties['link'] = $url_base.'viewtopic.php?t='.$row['topic_id'];
	}

	// Ajoute l'adresse complète aux images d'icones
	if ($row['forum_image']) {
		preg_match ('/([^\/]+)\./', $row['forum_image'], $icon);
		$properties['type'] = $icon[1];
		if ($layer == 'verbose')
			$properties['icon'] = $url_base .str_replace ('.png', '.svg', $row['forum_image']);
	}

	$features[] = [
		'type' => 'Feature',
		'id' => $row['post_id'], // Conformité with WFS specification. Avoid multiple display of the same feature
		'geometry' => json_decode ($geojson, true),
		'properties' => $properties,
	];
}
$db->sql_freeresult($result);

// Envoi de la page
$secondes_de_cache = 3600;
$expires = gmdate("D, d M Y H:i:s", time() + $secondes_de_cache);
header("Content-Transfer-Encoding: binary");
header("Pragma: cache");
header("Expires: $expires GMT");
header("Access-Control-Allow-Origin: *");
header("Cache-Control: max-age=$secondes_de_cache");
header("Content-Type: application/json; UTF-8");
header("Content-disposition: filename=geobb.json");
echo json_encode ([
	'type' => 'FeatureCollection',
	'comment' => count($features).' features, '.count($clusters).' clusters',
	'features' => array_merge (array_values ($clusters), $features),
]);
