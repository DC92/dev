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
		//TODO purge
		\phpbb\db\driver\driver_interface $db,
		\phpbb\request\request_interface $request,
		\phpbb\template\template $template,
		\phpbb\user $user,
		\phpbb\auth\auth $auth,
		$phpbb_root_path
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->auth = $auth;
		$this->phpbb_root_path = $phpbb_root_path;
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		// For debug, Varnish will not be caching pages where you are setting a cookie
		if (defined('DEBUG_CONTAINER'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		return [
			// All
			'core.page_footer' => 'page_footer',

			// Posting
			'core.posting_modify_row_data' => 'posting_modify_row_data',

			// Adm
			'core.adm_page_header' => 'adm_page_header',

			// Index
			'core.display_forums_modify_row' => 'display_forums_modify_row',
/*
			'core.index_modify_page_title' => 'index_modify_page_title',
*/
			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
/*
			'core.viewtopic_modify_post_data' => 'viewtopic_modify_post_data',
			'core.viewtopic_post_row_after' => 'viewtopic_post_row_after',
*/
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
//			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
/*			'core.modify_posting_auth' => 'modify_posting_auth',
			'core.modify_posting_parameters' => 'modify_posting_parameters',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',

			// Resize images
			'core.download_file_send_to_browser_before' => 'download_file_send_to_browser_before',

			// Registration
			'core.ucp_register_welcome_email_before' => 'ucp_register_welcome_email_before',
*/
		];
	}


	/**
		ALL
	*/
	function page_footer() {
	}

	/**
		INDEX.PHP
	*/
	// Add a button to create a topic in front of the list of forums
	//TODO move in MyPhpBB (+ tune parameters)
	function display_forums_modify_row ($vars) {
		$row = $vars['row'];

		if ($this->auth->acl_get('f_post', $row['forum_id']) &&
			$row['forum_type'] == FORUM_POST)
			$row['forum_name'] .= ' &nbsp; '.
				'<a class="button" href="./posting.php?mode=post&f='.$row['forum_id'].'" title="Créer un nouveau sujet '.strtolower($row['forum_name']).'">Créer</a>';

		$vars['row'] = $row;
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Appelé avant la requette SQL qui récupère les données des posts
	function viewtopic_get_post_data($vars) {
		$sql_ary = $vars['sql_ary'];

		// Insère la conversion du champ geom en format geojson dans la requette SQL
		$sql_ary['SELECT'] .= ', ST_AsGeoJSON(geom) AS geojson';

		$vars['sql_ary'] = $sql_ary;
	}

	// Called during first pass on post data that read phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {
		$this->template->assign_var ('GEOJSON', $vars['row']['geojson']);
	}

	// Appelé lors de la deuxième passe sur les données des posts qui prépare dans $post_row les données à afficher sur le post du template
	function viewtopic_modify_post_row($vars) {
	}

	/**
		POSTING
	*/
	function posting_modify_row_data($vars) {
		$post_data = $vars['post_data'];

		// For editing facilities choice
		preg_match ('/([^\/]+)\.[a-z]+$/' , $post_data['forum_image'], $image);
		if (isset ($image[1]))
			$this->template->assign_var ('IMAGE_FORUM', $image[1]);

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
