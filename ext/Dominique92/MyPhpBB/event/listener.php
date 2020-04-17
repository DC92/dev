<?php
/**
 * Add usefull tricks to for phpBB
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
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		return [
			// Viewtopic
			'core.modify_text_for_display_after' => 'modify_text_for_display_after',

			// Posting
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
		];
	}

// List template vars : phpbb/template/context.php line 135
//echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($ref,true).'</pre>';

	/**
		VIEWTOPIC.PHP
	*/
	function modify_text_for_display_after($vars) {
		$text = $vars['text'];

		$text = preg_replace_callback ('/<tableau>.*<\/tableau>/', function($match) {
			return str_replace (
				['<tableau><br>', '<br></tableau>', '<br>', '|', ';'],
				['<table class="tableau"><tr><td>', '</td></tr></table>', '</td></tr><tr><td>', '</td><td>', '<br/>'],
				$match[0]
			);
		} , str_replace ("\n", '',$text));

		$vars['text'] = $text;
	}

	/**
		POSTING.PHP
	*/
	// Allows entering a POST with empty text
	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

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
				$this->request->enable_super_globals();
				$to_save = [
					'user' => $this->user->data['username'].' '.date('r'),
					'url' => $_SERVER['REQUEST_URI'],
				];
				$this->request->disable_super_globals();

				// Post data
				$sql = 'SELECT * FROM '.POSTS_TABLE.' WHERE post_id = '.$post_data['post_id'];
				$result = $this->db->sql_query($sql);
				$row = $this->db->sql_fetchrow($result);
				$this->db->sql_freeresult($result);
				foreach ($row AS $k=>$v)
					if ($v && $v != 1 && $v != 'off' && $k != 'post_checksum')
						$to_save[$k] = $v;

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