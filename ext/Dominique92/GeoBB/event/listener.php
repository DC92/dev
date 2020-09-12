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
		\phpbb\auth\auth $auth
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->auth = $auth;
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
//			'core.posting_modify_row_data' => 'posting_modify_row_data',

			// Adm
			'core.adm_page_header' => 'adm_page_header',

/*
			// Index
			'core.display_forums_modify_row' => 'display_forums_modify_row',
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
			'core.viewtopic_modify_post_data' => 'viewtopic_modify_post_data',
			'core.viewtopic_post_row_after' => 'viewtopic_post_row_after',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',
*/

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
		POSTING
	*/
	function posting_modify_row_data($vars) {
		//TODO garder ???? (demo/test posting point)
		preg_match ('/([^\/]+)\.[a-z]+$/' , $vars['post_data']['forum_image'], $image);
		if (isset ($image[1]))
			$this->template->assign_var ('IMAGE_FORUM', $image[1]);
	}

	// Called when validating the data to be saved
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];
		$post = $this->request->get_super_global(\phpbb\request\request_interface::POST);

		// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
		$sql_data[POSTS_TABLE]['sql']['geom'] = "ST_GeomFromGeoJSON('{$post['geom']}')";
		
		$vars['sql_data'] = $sql_data; // return data
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

		// HORRIBLE phpbb hack to accept geom values //TODO-ARCHI : check if done by PhpBB (supposed 3.2)
		$file_name = "phpbb/db/driver/driver.php";
		$file_tag = "\n\t\tif (is_null(\$var))";
		$file_patch = "\n\t\tif (strpos(\$var, 'GeomFrom') !== false)\n\t\t\treturn \$var;";
		$file_content = file_get_contents ($file_name);
		if (strpos($file_content, '{'.$file_tag))
			file_put_contents ($file_name, str_replace ('{'.$file_tag, '{'.$file_patch.$file_tag, $file_content));
	}
}
