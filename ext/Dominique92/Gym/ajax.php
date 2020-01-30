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

$form = request_var ('form', '');


$horaires = [];
		$sql = "SELECT *
			FROM ".POSTS_TABLE."
			WHERE topic_id = 1";
		$result = $db->sql_query($sql);
		while ($row = $db->sql_fetchrow($result)) {
			$horaires[$row ['gym_jour']][$row ['gym_heure']*24+$row ['gym_minute']][] = $row;
		}
		$db->sql_freeresult($result);

/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($horaires,true).'</pre>';






// Output page
page_header('page_title', true);

$template->set_filenames(array(
	'body' => "$form.html")
);

page_footer();
