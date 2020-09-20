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
			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',

			// Posting
			'core.posting_modify_row_data' => 'posting_modify_row_data',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',

			// Adm
			'core.adm_page_header' => 'adm_page_header',
		];
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Appelé avant la requette SQL qui récupère les données des posts
	function viewtopic_get_post_data($vars) {
		$sql_ary = $vars['sql_ary'];
		$this->topic_data = $vars['topic_data'];

		// Insère la conversion du champ geom en format geojson dans la requette SQL
		$sql_ary['SELECT'] .= ', ST_AsGeoJSON(geom) AS geojson';

		$vars['sql_ary'] = $sql_ary;
	}

	// Called during first pass on post data that read phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {
		$row = $vars['row'];
		$has_maps = preg_match ('/([\.:])(point|line|poly)/', $this->topic_data['forum_desc'], $params);

		if ($has_maps && (
				$params[1] == ':' || // Map on all posts
				$row['post_id'] == $this->topic_data['topic_first_post_id'] // Only map on the first post
			))
			//TODO BUG devrait zoomer sur la totalité des features, au lieu seulement du dernier
			$this->template->assign_var ('GEOJSON', $row['geojson']);
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
			$sql = 'SELECT ST_AsGeoJSON(geom) AS geojson'.
				' FROM '.POSTS_TABLE.
				' WHERE post_id = '.$post_data['post_id'];
			$result = $this->db->sql_query($sql);
			$row = $this->db->sql_fetchrow($result);
			$this->template->assign_var ('GEOJSON', $row['geojson']);
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
		// Create required SQL columns when needed
		$result = $this->db->sql_query(
			'SHOW columns FROM '.POSTS_TABLE.' LIKE "geom"'
		);
		if (!$this->db->sql_fetchrow($result))
			$this->db->sql_query(
				'ALTER TABLE '.POSTS_TABLE.' ADD geom geometrycollection'
			);
		$this->db->sql_freeresult($result);

		//HACK (horrible !) to accept geom spatial feild
		$file_name = $this->phpbb_root_path."phpbb/db/driver/driver.php";
		$file_tag = "\n\t\tif (is_null(\$var))";
		$file_patch = "\n\t\tif (strpos(\$var, 'GeomFrom') !== false)\n\t\t\treturn \$var;";
		$file_content = file_get_contents ($file_name);
		if (strpos($file_content, '{'.$file_tag))
			file_put_contents ($file_name, str_replace ('{'.$file_tag, '{'.$file_patch.$file_tag, $file_content));
	}
}
