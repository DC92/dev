<?php
/**
 * Geographic functions for the phpBB Forum
 *
 * @copyright (c) 2016 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\GeoBB\event;

if (!defined('IN_PHPBB'))
{
	exit;
}

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class listener implements EventSubscriberInterface
{
	// List of externals
	public function __construct(
		\phpbb\db\driver\driver_interface $db,
		\phpbb\request\request_interface $request,
		\phpbb\template\template $template,
		$phpbb_root_path
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->phpbb_root_path = $phpbb_root_path;
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		return [
			// Common
			'core.common' => 'common',

			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.posting_modify_row_data' => 'posting_modify_row_data',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',

			// Adm
			'core.adm_page_header' => 'adm_page_header',

			'core.viewforum_modify_page_title' => 'viewforum_modify_page_title', //TODO A SUPPRIMER APRES MIGRATION O2
		];
	}

//TODO A SUPPRIMER APRES MIGRATION O2
	function viewforum_modify_page_title($vars) {
		$forum_desc = $vars['forum_data']['forum_desc'];
		$forum_desc = str_replace ('[first=point]</s><e>', '[first=point]</s>.point<e>', $forum_desc);
		$forum_desc = str_replace ('[first=line]</s><e>', '[first=line]</s>.poly<e>', $forum_desc);
		$forum_desc = str_replace ('[view=diapo]</s><e>', '[view=diapo]</s>*slideshow<e>', $forum_desc);
		$forum_desc = addslashes ($forum_desc);

		$forum_image = str_replace ('types_points', 'icones', $vars['forum_data']['forum_image']);
		$forum_image = addslashes ($forum_image);

		$sql = "UPDATE ".FORUMS_TABLE." SET forum_desc = \"$forum_desc\", forum_image = \"$forum_image\" WHERE forum_id = ".$vars['forum_data']['forum_id'];
		$this->db->sql_query($sql);
	}

	/**
		COMMON
	*/
	function common($vars) {
		global $mapKeys;
		$this->template->assign_var ('MAP_KEYS', json_encode (@$mapKeys));
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Appelé avant la requette SQL qui récupère les données des posts
	function viewtopic_get_post_data($vars) {
		// Insère la conversion du champ geom en format geojson dans la requette SQL
		$sql_ary = $vars['sql_ary'];
		$sql_ary['SELECT'] .= ', ST_AsGeoJSON(geom) AS geo_json';
		$vars['sql_ary'] = $sql_ary;
	}

	// Called during first pass on post data that read phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {
		// Conserve les valeurs spécifiques à chaque post du template
		$post_id = $vars['row']['post_id'];
		foreach ($vars['row'] AS $k=>$v)
			if (strpos ($k,'geo_') === 0)
				$this->geo_data[$post_id][$k] = str_replace ('~', '', $v);
	}

	// Modify the posts template block
	function viewtopic_modify_post_row($vars) {
		// Valeurs du post lues dans la table phpbb_posts
		$row = $vars['row'];
		$post_id = $row['post_id'];

		// Valeurs du topic
		$topic_data = $vars['topic_data'];
		$topic_first_post_id = $topic_data['topic_first_post_id'];

		// Valeurs à assigner à tout le template (topic)
		$topic_row = $this->geo_data[$post_id]; // The geo_ values
		$topic_row['topic_first_post_id'] = $topic_first_post_id;

		// How to display the topic
		//TODO map on all posts (":xxxxx")
		preg_match ('/([\.:])(point|line|poly)/', $topic_data['forum_desc'], $desc);
		if ($desc) {
			$view = $this->request->variable ('view', 'geo');
			$topic_row['body_class'] = $view.' '.$view.'_'.$desc[2];

			// Position
			preg_match ('/\[([0-9\.]*)[, ]*([0-9\.]*)\]/', $topic_row['geo_json'], $ll);
			if ($ll) {
				$topic_row['map_type'] = $desc[2];
				$topic_row['geo_lon'] = $ll[1];
				$topic_row['geo_lat'] = $ll[2];

				// Calcul de l'altitude avec mapquest
				global $mapKeys;
				if (array_key_exists ('geo_altitude', $topic_row) && !$topic_row['geo_altitude'] &&
					@$mapKeys['keys-mapquest']) {
					$mapquest = 'http://open.mapquestapi.com/elevation/v1/profile?key='.
						$mapKeys['keys-mapquest'].
						'&callback=handleHelloWorldResponse&shapeFormat=raw&latLngCollection='.
						$ll[2].','.$ll[1];
					preg_match('/"height":([0-9]+)/', @file_get_contents ($mapquest), $match);

					// Update the template data
					$topic_row['geo_altitude'] = $match ? $match[1] : '~';

					// Update the database for next time
					$sql = "UPDATE phpbb_posts SET geo_altitude = '{$topic_row['geo_altitude']}' WHERE post_id = $post_id";
					$this->db->sql_query($sql);
				}

				// Détermination du massif par refuges.info
				if (array_key_exists ('geo_massif', $topic_row) && !$topic_row['geo_massif']) {
					$f_wri_export = 'http://www.refuges.info/api/polygones?type_polygon=1,10,11,17&bbox='.
						$ll[1].','.$ll[2].','.$ll[1].','.$ll[2];
					$wri_export = json_decode (@file_get_contents ($f_wri_export));
					// récupère tous les polygones englobantz
					if($wri_export->features)
						foreach ($wri_export->features AS $f)
							$ms [$f->properties->type->id] = $f->properties->nom;
					// Trie le type de polygone le plus petit
					if (isset ($ms))
						ksort ($ms);

					// Update the template data
					$topic_row['geo_massif'] = @$ms[array_keys($ms)[0]] ?: '~';

					// Update the database for next time
					$sql = "UPDATE phpbb_posts SET geo_massif = '{$topic_row['geo_massif']}' WHERE post_id = $post_id";
					$this->db->sql_query($sql);
				}
			}
		}

		if ($post_id == $topic_first_post_id)
			$this->template->assign_vars (array_change_key_case ($topic_row, CASE_UPPER));
	}

	/**
		POSTING
	*/
	function posting_modify_row_data($vars) {
		$post_data = $vars['post_data'];
		$has_maps = preg_match ('/([\.:])(point|line|poly)/', $post_data['forum_desc'], $params);

		// For editing facilities choice //TODO ???????????????
		preg_match ('/([^\/]+)\.[a-z]+$/' , $post_data['forum_image'], $image);
		if (isset ($image[1]))
			$this->template->assign_var ('FORUM_IMAGE', $image[1]);

		if ($has_maps && (
				$params[1] == ':' || // Map on all posts
				$post_data['post_id'] == $post_data['topic_first_post_id'] // Only map on the first post
			))
			$this->template->assign_var ('MAP_TYPE', $params[2]);

		// Get translation of SQL space data
		if (isset ($post_data['geom'])) {
			$sql = 'SELECT ST_AsGeoJSON(geom) AS geo_json'.
				' FROM '.POSTS_TABLE.
				' WHERE post_id = '.$post_data['post_id'];
			$result = $this->db->sql_query($sql);
			$row = $this->db->sql_fetchrow($result);
			$this->template->assign_var ('GEO_JSON', $row['geo_json']);
			$this->db->sql_freeresult($result);
		}
	}

	// Called when validating the data to be saved
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];
		$post = $this->request->get_super_global(\phpbb\request\request_interface::POST);

		// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
		if ($post['geom'])
			$sql_data[POSTS_TABLE]['sql']['geom'] = "ST_GeomFromGeoJSON('{$post['geom']}')";

		$vars['sql_data'] = $sql_data; // Return data
	}

	/**
		ADM
	*/
	function adm_page_header() {
		$this->add_sql_column (POSTS_TABLE, 'geom', 'geometrycollection');
		$this->add_sql_column (POSTS_TABLE, 'geo_massif', 'varchar(50)');
		$this->add_sql_column (POSTS_TABLE, 'geo_altitude', 'varchar(12)');

		//HACK (horrible !) to accept geom spatial feild
		$file_name = $this->phpbb_root_path."phpbb/db/driver/driver.php";
		$file_tag = "\n\t\tif (is_null(\$var))";
		$file_patch = "\n\t\tif (strpos(\$var, 'GeomFrom') !== false)\n\t\t\treturn \$var;";
		$file_content = file_get_contents ($file_name);
		if (strpos($file_content, '{'.$file_tag))
			file_put_contents ($file_name, str_replace ('{'.$file_tag, '{'.$file_patch.$file_tag, $file_content));
	}

	function add_sql_column ($table, $column, $type) {
		$result = $this->db->sql_query(
			"SHOW columns FROM $table LIKE '$column'"
		);
		if (!$this->db->sql_fetchrow($result))
			$this->db->sql_query(
				"ALTER TABLE $table ADD $column $type"
			);
		$this->db->sql_freeresult($result);
	}
}
