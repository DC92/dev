<?php
/**
 * Usefull tricks to for phpBB
 * See comments inline for list of features
 * Enable features in config.php with define('MYPHPBB_***', true);
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\MyPhpBB\event;

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
		\phpbb\user $user,
		\phpbb\auth\auth $auth,
		\phpbb\language\language $language
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->auth = $auth;
		$this->language = $language;

		$this->post = $this->request->get_super_global(\phpbb\request\request_interface::POST);
		$this->get = $this->request->get_super_global(\phpbb\request\request_interface::GET);
		$this->server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
		$this->uri = $this->server['REQUEST_SCHEME'].'://'.$this->server['SERVER_NAME'].$this->server['REQUEST_URI'];
	}

	static public function getSubscribedEvents() {

		/* DEBUG : Varnish will not be caching pages where you are setting a cookie */
		if (defined('MYPHPBB_DISABLE_VARNISH'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		// List of hooks and related functions
		// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
		return [
			// All
			'core.page_header' => 'page_header',

			// Index
			'core.display_forums_modify_row' => 'display_forums_modify_row',
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',

			// Ucp&mode=register
			'core.ucp_register_requests_after' => 'ucp_register_requests_after',

			// App (error 400)
			'core.session_ip_after' => 'session_ip_after',

			// All (debug)
			'core.twig_environment_render_template_before' => 'twig_environment_render_template_before',
		];
	}

	/**
		ALL
	*/
	function page_header() {
		$ns = explode ('\\', __NAMESPACE__);

		/* Includes template & js values defined in config.php */
		// $myphp_js = ['key' => 'value'];
		// $myphp_template = ['key' => 'value'];
		global $myphp_template, $myphp_js;
		if ($myphp_template)
			$this->template->assign_vars (
				array_change_key_case ($myphp_template, CASE_UPPER)
			);
		$this->template->assign_var ('MYPHP_JS', json_encode($myphp_js));
		if (isset ($this->get['mcp']))
			$this->template->assign_var ('U_MCP', true);

		/* Includes language files of this extension */
		$this->language->add_lang('common', $ns[0].'/'.$ns[1]);

		// Includes style files of this extension
		//TODO explore all active extensions
		/*
		if (!strpos ($this->server['SCRIPT_NAME'], 'adm/'))
			$template->set_style ([
				'ext/'.$ns[0].'/'.$ns[1].'/styles',
				'styles', // core styles
				'adm', // core styles //TODO needed for template/adm/...
			]);
		*/
	}

	/**
		INDEX.PHP
	*/
	function display_forums_modify_row ($vars) {
		$row = $vars['row'];

		/* Add a post create button on index & viewforum forum lines */
		if (defined('MYPHPBB_CREATE_POST_BUTTON') &&
			$this->auth->acl_get('f_post', $row['forum_id']) &&
			$row['forum_type'] == FORUM_POST)
			$row['forum_name'] .= ' &nbsp; '.
				'<a class="button" href="./posting.php?mode=post&f='.$row['forum_id'].'" title="Créer un nouveau sujet '.strtolower($row['forum_name']).'">Créer</a>';

		$vars['row'] = $row;
	}

	function index_modify_page_title ($vars) {
		$uris = explode ('/?', $this->uri);

		/* Route to viewtopic or viewforum if there is an argument p, t or f */
		if (defined('MYPHPBB_REDIRECT') &&
			count ($uris) > 1 &&
				!$this->request->variable ('template', '')) {
				if ($this->request->variable ('p', 0) ||
					$this->request->variable ('t', 0))
					exit (file_get_contents ($uris[0].'/viewtopic.php?'.$uris[1]));
				if ($this->request->variable ('f', 0))
					exit (file_get_contents ($uris[0].'/viewforum.php?'.$uris[1]));
		}
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Called after reading SQL post data
	function viewtopic_post_rowset_data($vars) {

		/* Specific BBcode [location]ABSOLUTE_PATH[/location] go to ABSOLUTE_PATH */
		if (defined('MYPHPBB_BBCODE_LOCATION') &&
			$this->request->variable ('p', 0) == $vars['row']['post_id']) { // Only if a specific post is required
			$text = preg_replace_callback (
				'/<[^>]*>/',
				function () {return '';},
				$vars['row']['post_text']
			);
			preg_match ('/\[location\](.*)\[\/location\]/', $text, $match);
			if ($match)
				exit ('<meta http-equiv="refresh" content="0;URL='.$match[1].'">');
		}
	}

	// Called before post assigned to template
	function viewtopic_modify_post_row($vars) {

		/* Specific BBcode [include]RELATIVE_PATH[/include] */
		/* Replace by the content of the RELATIVE_PATH */

		if (defined('MYPHPBB_BBCODE_INCLUDE'))
			$vars['post_row'] = preg_replace_callback (
				'/\[include\](.*)\[\/include\]/',
				function ($match) {
					$query = parse_url ($this->uri, PHP_URL_QUERY);
					$url = str_replace ('ARGS', // Replace ARGS by the current page arguments
						$query,
						pathinfo ($this->uri, PATHINFO_DIRNAME).'/'.$match[1]
					);
					if ($this->auth->acl_get('m_')) // Add moderator right
						$url .= $query ? '&mcp=1' : '?mcp=1';

					if (defined('MYPHPBB_BBCODE_INCLUDE_TRACE'))
						echo $url;

					return file_get_contents (str_replace ('amp;', '', $url));
				},
				$vars['post_row']
			);
	}

	/**
		POSTING.PHP
	*/
	// Called when validating the data to be saved
	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		/* Allows entering a POST with empty text */
		if (defined('MYPHPBB_POST_EMPTY_TEXT'))
			foreach ($error AS $k=>$v)
				if ($v == $this->user->lang['TOO_FEW_CHARS'])
					unset ($error[$k]);

		$vars['error'] = $error;
	}

	// Called when viewing the posting page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];
		$page_data = $vars['page_data'];

		/* Prevent an empty title to invalidate the full page and input */
		if (defined('MYPHPBB_POST_EMPTY_SUBJECT') &&
			!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'New';

		$vars['page_data'] = $page_data;

		/* Keep trace of values prior to modifications */
		/* Create a log file with the post existing data if there is none */
		if (defined('MYPHPBB_LOG_EDIT')) {
			// Create the LOG directory if none
			if (!is_dir('LOG'))
				mkdir('LOG');
			// Add a blank file if none
			file_put_contents ('LOG/index.html', '');

			$this->template->assign_var ('MYPHPBB_LOG_EDIT', true);

			// Create the file with the existing post data
			$file_name = 'LOG/'.$post_data['post_id'].'.txt';
			if (!file_exists ($file_name))
				file_put_contents ($file_name,
					pack('CCC',0xef,0xbb,0xbf). // UTF-8 encoding
					date('r').PHP_EOL.
					'Titre: '.$post_data['post_subject'].PHP_EOL.
					$post_data['post_text'].PHP_EOL.
					$this->specific_data($post_data).PHP_EOL
				);
		}
	}

	function modify_submit_notification_data($vars) {

		/* Log new post data */
		if (defined('MYPHPBB_LOG_EDIT'))
			file_put_contents ('LOG/'.$vars['data_ary']['post_id'].'.txt',
				'_______________________________'.PHP_EOL.
				date('r').' '.$this->user->data['username'].PHP_EOL.
				'Titre: '.$this->post['subject'].PHP_EOL.
				$this->post['message'].PHP_EOL.
				$this->specific_data($this->post).PHP_EOL,
			FILE_APPEND);
	}

	function specific_data($post_data) {
		$r = '';
		foreach ($post_data AS $k=>$v)
			if ($k[3] == '_' &&
				$v &&
				$v != '00' &&
				$v != '0' &&
				$v != '?' &&
				$v != 'off')
				$r .= $k.': '.(is_array($v) ? implode(',',$v) : $v).PHP_EOL;
		return $r;
	}

	/**
	 * UCP
	 */
	function ucp_register_requests_after() {

		/* Inhibits the registration of unauthorized countries */
		/* listed in MYPHPBB_COUNTRY_CODES ['FR, ...'] (ISO-3166 Country Codes) */
		if (defined('MYPHPBB_COUNTRY_CODES')) {
			$server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
			$iplocation = unserialize (file_get_contents ('http://www.geoplugin.net/php.gp?ip='.$server['REMOTE_ADDR']));
			if (!strpos (MYPHPBB_COUNTRY_CODES, $iplocation['geoplugin_countryCode']))
				header ('Location: ucp.php');
		}
	}

	/**
	 * ALL
	 */
	function twig_environment_render_template_before($vars) {

		/* DEBUG : Dump global variables */
		if(defined('MYPHPBB_DUMP_GLOBALS')) {
			ini_set('xdebug.var_display_max_depth', '2');
			ini_set('xdebug.var_display_max_children', '1024');
			$this->request->enable_super_globals();
			var_dump ([MYPHPBB_DUMP_GLOBALS => $GLOBALS[MYPHPBB_DUMP_GLOBALS]]);
			$this->request->disable_super_globals();
		}

		/* DEBUG : Dump templates variables */
		if(defined('MYPHPBB_DUMP_TEMPLATE') &&
			$vars['name'] != 'attachment.html') {
			ini_set('xdebug.var_display_max_depth', '1');
			ini_set('xdebug.var_display_max_children', '1024');
			var_dump('TEMPLATE '.$vars['name'], $vars['context']);
		}
	}

	/**
		APP
	*/
	// Called when a page is not found
	function session_ip_after() {

		/* Redirect url/shortcut to a page containing [shortcut]shortcut[/shortcut] */
		/* You can add an empty shortcut BBcode */
		if (defined('MYPHPBB_SHORTCUT')) {
			$shortcut = pathinfo ($this->server['REQUEST_URI'], PATHINFO_FILENAME);

			$sql = 'SELECT post_id FROM '.POSTS_TABLE.' WHERE post_text LIKE "%shortcut%>'.$shortcut.'<%shortcut%"';
			$result = $this->db->sql_query($sql);
			$row = $this->db->sql_fetchrow($result);
			$this->db->sql_freeresult($result);

			if ($row)
				echo '<meta http-equiv="refresh" content="0;URL=viewtopic.php?p='.
					$row['post_id'].'">';
		}
	}
}