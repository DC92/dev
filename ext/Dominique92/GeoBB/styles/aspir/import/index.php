<?php
// Importation des bases enquete-pastorale.irstea

echo"<p>
<a href='?d=01'>01</a> &nbsp; 
<a href='?d=04'>04</a> &nbsp; 
<a href='?d=05'>05</a> &nbsp; 
<a href='?d=07'>07</a> &nbsp; 
<a href='?d=13'>13</a> &nbsp; 
<a href='?d=26'>26</a> &nbsp; 
<a href='?d=38'>38</a> &nbsp; 
<a href='?d=42'>42</a> &nbsp; 
<a href='?d=43'>43</a> &nbsp; 
<a href='?d=63'>63</a> &nbsp; 
<a href='?d=69'>69</a> &nbsp; 
<a href='?d=73'>73</a> &nbsp; 
<a href='?d=74'>74</a> &nbsp; 
<a href='?d=83'>83</a> &nbsp; 
<a href='?d=84'>84</a> &nbsp; 
</p>";

define('IN_PHPBB', true);
$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : '../../../../../../';
$phpEx = substr(strrchr(__FILE__, '.'), 1);
include($phpbb_root_path . 'common.' . $phpEx);
include($phpbb_root_path . 'includes/functions_posting.' . $phpEx);

include('./geoPHP/geoPHP.inc');
include('./proj4php/vendor/autoload.php');
use proj4php\Proj4php;
use proj4php\Proj;
use proj4php\Point;

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();

// Initialise Proj4
$proj4 = new Proj4php();
$projSrc = new Proj('EPSG:3857', $proj4);
$projDst = new Proj('EPSG:4326', $proj4);

// Parameters
$epid = $request->variable('d', '00');
$upzp = $request->variable('p', 'UP');
echo 'Import enquete '.var_export($upzp.':'.$epid,true).'<br/>';

// Search alpages forum
$sql = 'SELECT forum_id FROM phpbb_forums WHERE forum_name LIKE "Alpages"';
$result = $db->sql_query($sql);
$forum_data = $db->sql_fetchrow($result);
$db->sql_freeresult($result);
$alp_forum_id = $forum_data['forum_id'];

// Get irstea list
// http://enquete-pastorale.irstea.fr/getPHP/getUPJSON.php?id=38
// http://enquete-pastorale.irstea.fr/getPHP/getZPJSON.php?id=38
$epifile = file_get_contents ('http://enquete-pastorale.irstea.fr/getPHP/get'.$upzp.'JSON.php?id='.$epid);
$epiphp = json_decode($epifile);
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

$stay_lower = ['le','la','les','du','de','des','sur'];

foreach ($epiphp->features as $p)
	if($p->geometry) {
		// Get geometry
		$geomjson = json_encode($p->geometry);
		$geomphp = \geoPHP::load ($geomjson, 'json');
		$geomsql = 'GeomFromText("'.$geomphp->out('wkt').'",4326)';

		// Normalise data
		if (!$p->properties->surface)
			$p->properties->surface = 0;
		if (!$p->properties->nom1)
			$p->properties->nom1 = $p->properties->code;
		$p->properties->nom1 = str_replace('_', ' ',
		$p->properties->nom1);
		$p->properties->nom1 = ucfirst (preg_replace_callback (
			'/([A-Z]+)/',
			function ($m) {
				global $stay_lower;
				$r = strtolower($m[0]);
				return in_array ($r, $stay_lower) || !$r[1] // l'xxx, d'xxx
					? $r
					: ucfirst ($r);
			},
			$p->properties->nom1
		));

		// Check existing subject
		$sql = "SELECT * FROM phpbb_posts WHERE geo_irstea_code = '{$p->properties->code}'";
		$result = $db->sql_query($sql);
		$data = $db->sql_fetchrow($result);
		$db->sql_freeresult($result);

		//  Création d'une fiche
		if ($p->geometry->coordinates && !$data['topic_id']) {
			echo 'Céation de '.var_export($p->properties->nom1,true).'<br/>';

			$data = [
				'forum_id' => $alp_forum_id,
				'topic_id' => 0, // Le créer
				'post_id' => 0, // Le créer
				'post_subject' => $p->properties->nom1,
				'message' => '',
				'message_md5' => md5(''),
				'bbcode_bitfield' => 0,
				'bbcode_uid' => 0,
				'icon_id' => 0,
				'enable_bbcode' => true,
				'enable_smilies' => true,
				'poster_id' => 2, // Mandatory : system $user->data['user_id'],
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
				$p->properties->nom1,
				$user->data['username'],
				POST_NORMAL,
				$poll,
				$data
			);
		}

		// Update geo_ data
		if ($data['post_id']) {
			$sql = "UPDATE phpbb_topics 
					SET topic_title = '".str_replace ("'", "\\'", $p->properties->nom1)."'
					WHERE topic_id = {$data['topic_id']}";
			$result = $db->sql_query($sql);
		}

		// Update geo_ data
		if ($data['post_id']) {
			$sql = "UPDATE phpbb_posts
					SET geom = $geomsql,
					post_subject = '".str_replace ("'", "\\'", $p->properties->nom1)."',
					geo_unite_pastorale = '".str_replace ("'", "\\'", $p->properties->nom1)."',
					geo_surface = {$p->properties->surface},
					geo_irstea_code = '{$p->properties->code}',
					geo_irstea_type = '$upzp:$epid'
				WHERE post_id = {$data['post_id']}";
			$result = $db->sql_query($sql);
		}
	}
