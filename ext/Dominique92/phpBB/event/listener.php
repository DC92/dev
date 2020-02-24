<?php
/**
 * Add usefull tricks to for phpBB
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\phpBB\event;

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
		// For debug, Varnish will not be caching pages where you are setting a cookie
		if (defined('TRACES_DOM'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		return [
			// Posting
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
		];
	}

	/**
		POSTING.PHP
	*/
	// Called when display post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

		// To prevent an empty title to invalidate the full page and input.
		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'Nom';

		// Create a log file with the existing data if there is none
		$this->save_post_data($post_data, $vars['message_parser']->attachment_data, $post_data, true);
	}

	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		// Allows entering a POST with empty text
		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
	}

	// Called after the post validation
	function modify_submit_notification_data($vars) {
		$this->save_post_data($vars['data_ary'], $vars['data_ary']['attachment_data'], $this->modifs);
	}
	function save_post_data($post_data, $attachment_data, $gym_data, $create_if_null = false) {
		if (isset ($post_data['post_id'])) {
			$this->request->enable_super_globals();
			$to_save = [
				$this->user->data['username'].' '.date('r').' '.$_SERVER['REMOTE_ADDR'],
				$_SERVER['REQUEST_URI'],
				'forum '.$post_data['forum_id'].' = '.$post_data['forum_name'],
				'topic '.$post_data['topic_id'].' = '.$post_data['topic_title'],
				'post_subject = '.$gym_data['post_subject'],
				'post_text = '.$post_data['post_text'].$post_data['message'],
//				'geojson = '.@$geo_data['geojson'],
			];
			foreach ($gym_data AS $k=>$v)
				if ($v && !strncmp ($k, 'gym_', 4))
					$to_save [] = "$k = $v";

			// Save attachment_data
			$attach = [];
			if ($attachment_data)
				foreach ($attachment_data AS $att)
					$attach[] = $att['attach_id'].' : '.$att['real_filename'];
			if (isset ($attach))
				$to_save[] = 'attachments = '.implode (', ', $attach);

			$file_name = 'LOG/'.$post_data['post_id'].'.txt';
			if (!$create_if_null || !file_exists($file_name))
				file_put_contents ($file_name, implode ("\n", $to_save)."\n\n", FILE_APPEND);

			$this->request->disable_super_globals();
		}
	}
}