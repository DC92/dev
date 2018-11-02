<?php
// Importation des bases enquete-pastorale.irstea

echo"<p>
<a href='aspir_import.php?d=01'>01</a> &nbsp; 
<a href='aspir_import.php?d=04'>04</a> &nbsp; 
<a href='aspir_import.php?d=05'>05</a> &nbsp; 
<a href='aspir_import.php?d=07'>07</a> &nbsp; 
<a href='aspir_import.php?d=13'>13</a> &nbsp; 
<a href='aspir_import.php?d=26'>26</a> &nbsp; 
<a href='aspir_import.php?d=38'>38</a> &nbsp; 
<a href='aspir_import.php?d=42'>42</a> &nbsp; 
<a href='aspir_import.php?d=43'>43</a> &nbsp; 
<a href='aspir_import.php?d=63'>63</a> &nbsp; 
<a href='aspir_import.php?d=69'>69</a> &nbsp; 
<a href='aspir_import.php?d=73'>73</a> &nbsp; 
<a href='aspir_import.php?d=74'>74</a> &nbsp; 
<a href='aspir_import.php?d=83'>83</a> &nbsp; 
<a href='aspir_import.php?d=84'>84</a> &nbsp; 
</p>";

define('IN_PHPBB', true);
$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : '../../../';
$phpEx = substr(strrchr(__FILE__, '.'), 1);
include($phpbb_root_path . 'common.' . $phpEx);
include($phpbb_root_path . 'includes/functions_posting.' . $phpEx);

include_once('../../../assets/geoPHP/geoPHP.inc'); // Librairie de conversion WKT <-> geoJson (needed before MySQL 5.7)
include_once('../../../assets/proj4php/vendor/autoload.php');
use proj4php\Proj4php;
use proj4php\Proj;
use proj4php\Point;

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();
$request->enable_super_globals();

// Initialise Proj4
$proj4 = new Proj4php();
$projSrc = new Proj('EPSG:3857', $proj4);
$projDst = new Proj('EPSG:4326', $proj4);

// http://enquete-pastorale.irstea.fr/getPHP/getUPJSON.php?id=38
// http://enquete-pastorale.irstea.fr/getPHP/getZPJSON.php?id=38
$epiphp = json_decode(file_get_contents ('http://enquete-pastorale.irstea.fr/getPHP/getZPJSON.php?id='.$_GET['d']));
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>EPIPHP = ".var_export(json_encode($epiphp),true).'</pre>';

conv_3857_to_4326($epiphp);
function conv_3857_to_4326(&$p){
	global $proj4, $projSrc, $projDst;
	if($p->features)
		conv_3857_to_4326($p->features);
	if($p->geometry)
		conv_3857_to_4326($p->geometry);
	if($p->coordinates)
		conv_3857_to_4326($p->coordinates);
	if(gettype($p) == 'array') {
		if (gettype($p[0]) == 'integer'){
			$pointSrc = new Point($p[0], $p[1], $projSrc);
			$pointDest = $proj4->transform($projDst, $pointSrc);
			$p[0] = $pointDest->__get('x');
			$p[1] = $pointDest->__get('y');
		} else
			foreach($p AS &$p1)
				conv_3857_to_4326($p1);
	}
}
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>epiphp = ".var_export(count($epiphp),true).'</pre>';

foreach ($epiphp->features as $p) {
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>EEEEEEEEE = ".var_export($p->properties,true).'</pre>';
	$geophp = \geoPHP::load (html_entity_decode(json_encode($p->geometry)), 'json');
	//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>properties = ".var_export($p->properties->nom1,true).'</pre>';

	$geophp = \geoPHP::load (html_entity_decode(json_encode($p->geometry)), 'json');
	$sql_data = 'GeomFromText("'.$geophp->out('wkt').'")';
	//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>sql_data = ".var_export($sql_data,true).'</pre>';

	$post_id = find_create_topic(2, $p->properties->nom1);
	//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($post_id,true).'</pre>';

	$sql = 'UPDATE phpbb_posts SET geom = '.$sql_data.
		',geo_enquette_code = "'.$p->properties->code.
		'",geo_surface = '.$p->properties->surface.
		',geo_commune = "'.$p->properties->nom_commune.
	'" WHERE post_id = '.$post_id;
	$result = $db->sql_query($sql);
	//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($sql,true).'</pre>';
}

function find_create_topic($forum_id, $nom) {
	global $db, $user, $is_authed;

	$sql = 'SELECT * FROM phpbb_posts WHERE post_subject = "'.str_replace('"', '\"', $nom).'" ORDER BY post_time ASC';
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($sql,true).'</pre>';
	$result = $db->sql_query($sql);
	$data = $db->sql_fetchrow($result);
	$db->sql_freeresult($result);
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($data,true).'</pre>';

	// Création d'une fiche
	if (!$data) {
/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>CREATION = ".var_export($nom,true).'</pre>';
		$data = [
			'forum_id' => $forum_id,
			'post_subject' => $nom,
			'post_id' => 0, // Le créer
			'topic_id' => 0, // Le créer
			'message' => '',
			'message_md5' => md5(''),
			'bbcode_bitfield' => 0, //$message_parser->bbcode_bitfield, // TODO DCMM
			'bbcode_uid' => 0, //$message_parser->bbcode_uid,
			'icon_id' => 0,
			'enable_bbcode' => true,
			'enable_smilies' => true,
			'poster_id' => $user->data['user_id'],
			'enable_urls' => true,
			'enable_sig' => true,
			'topic_visibility' => true,
			'post_visibility' => true,
			'enable_indexing' => true,
			'post_edit_locked' => false,
			'notify_set' => false,
			'notify' => false,
		];
		$poll = [];
		\submit_post(
			'post',
			$nom,
			$user->data['username'],
			POST_NORMAL,
			$poll,
			$data
		);
	}
	//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($data['post_id'],true).'</pre>';
	return $data['post_id'];
}
