<?php
/**
 * Add usefull tricks to for phpBB
 *
 * Includes language and style files of this extension
 * Clickable banner
 * Prevent an empty post title or text
 * Warning to wait until end loading of attached files
 * Log posts edit
 *
 * DEBUG :
 * Disable Varnish
 * List template vars
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
		$this->language = $language;

		// Include language files of this extension
		$ns = explode ('\\', __NAMESPACE__);
		$this->language->add_lang('common', $ns[0].'/'.$ns[1]);
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {

		// For debug, Varnish will not be caching pages where you are setting a cookie
		if (defined('DEBUG_CONTAINER'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		return [
			// All
			'core.page_header' => 'page_header',
			'core.twig_environment_render_template_before' => 'twig_environment_render_template_before',

			// Posting
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
		];
	}

	function page_header() {
//*DCMM*/echo"<pre style='background:white;color:black;font-size:14px'>REQUEST_URI = ".var_export($this->request->get_super_global(\phpbb\request\request_interface::SERVER)['REQUEST_URI'],true).'</pre>';
//*DCMM*/echo"<pre style='background:white;color:black;font-size:14px'>COOKIE = ".var_export($this->request->get_super_global(\phpbb\request\request_interface::COOKIE),true).'</pre>';
	}

	function twig_environment_render_template_before($vars) {
		// Display the template variables
/*DCMM*/return;
		if($vars['name'] != 'attachment.html') {
			echo '<p><b>TEMPLATE '.$vars['name'].' : '.count($vars['context']).' variables</b></p>';
			foreach($vars['context'] AS $k=>$v)
				if (gettype ($v) != 'object')
					echo"<pre>$k (".gettype ($v).") = ".var_export($v,true).'</pre>';
		}
	}

	/**
		POSTING.PHP
	*/
	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		// Allows entering a POST with empty text
		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
	}

	// Called when viewing the post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];
		$page_data = $vars['page_data'];

		// To prevent an empty title to invalidate the full page and input.
		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'New';

		// Keep trace of values prior to modifications
		// Create a log file with the existing data if there is none
		$this->save_post_data($post_data, $vars['message_parser']->attachment_data, true);

		$vars['page_data'] = $page_data;
	}

	// Called after the post validation
	function modify_submit_notification_data($vars) {
		$this->save_post_data($vars['data_ary'], $vars['data_ary']['attachment_data']);
	}

	function save_post_data($post_data, $attachment_data, $create_if_null = false) {
		if (isset ($post_data['post_id'])) {
			// Create the LOG directory if none
			if (!is_dir('LOG'))
				mkdir('LOG');
			// Add a blank file if none
			file_put_contents ('LOG/index.html', '');

			// Assign post_id to template for link in posting
			$this->template->assign_var ('POST_ID', $post_data['post_id']);

			$file_name = 'LOG/'.$post_data['post_id'].'.txt';
			if (!$create_if_null || !file_exists($file_name)) {
				// Request data
				$server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
				$to_save = [
					'user' => $this->user->data['username'].' '.date('r'),
					'url' => $server['REQUEST_URI'],
				];

				// Post data
				$sql = 'SELECT * FROM '.POSTS_TABLE.' WHERE post_id = '.$post_data['post_id'];
				$result = $this->db->sql_query($sql);
				$row = $this->db->sql_fetchrow($result);
				$this->db->sql_freeresult($result);
				foreach ($row AS $k=>$v)
					if ($v && $v != 1 && $v != 'off' && $k != 'post_checksum')
						$to_save[$k] = utf8_decode ($v);

				// Save attachment_data
				$attach = [];
				if ($attachment_data)
					foreach ($attachment_data AS $att)
						$attach[] = $att['attach_id'].' : '.$att['real_filename'];
				if (isset ($attach))
					$to_save[] = 'attachments = '.implode (', ', $attach);

				file_put_contents ($file_name, var_export($to_save,true)."\n\n", FILE_APPEND);
			}
		}
	}
}