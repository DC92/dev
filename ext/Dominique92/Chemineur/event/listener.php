<?php
/**
 * EPGV specific functions & style for the phpBB Forum
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\Chemineur\event;

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

		$this->ns = explode ('\\', __NAMESPACE__);
		$this->ext_path = 'ext/'.$this->ns[0].'/'.$this->ns[1].'/';
/*
		$this->cookies = $this->request->get_super_global(\phpbb\request\request_interface::COOKIE);
		$this->args = $this->request->get_super_global(\phpbb\request\request_interface::REQUEST);
		$this->server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
		$this->uri = $this->server['REQUEST_SCHEME'].'://'.$this->server['SERVER_NAME'].$this->server['REQUEST_URI'];
*/
	}

	static public function getSubscribedEvents() {
		return [
			// All
			'core.page_header' => 'page_header',

			// Index
			'core.index_modify_page_title' => 'index_modify_page_title',
		];
	}

	/**
		ALL
	*/
	function page_header() {
		// Includes language and style files of this extension
//TODO		$this->language->add_lang ('common', $this->ns[0].'/'.$this->ns[1]);

		// Includes style files of this extension
if(0)//TODO
		if (!strpos ($this->server['SCRIPT_NAME'], 'adm/'))
			$this->template->set_style ([
				$this->ext_path.'styles',
				'styles', // core styles
			]);
	}

	// Affiche les post les plus récents sur la page d'accueil
	function index_modify_page_title ($vars) {
		global $auth; // DCMM intégrer aux variables du listener ($this->auth)

		$nouvelles = request_var ('nouvelles', 20);
		$this->template->assign_var ('PLUS_NOUVELLES', $nouvelles * 2);

		$sql = "
			SELECT t.topic_id, topic_title,
				t.forum_id, forum_name, forum_image,
				topic_first_post_id, post_id, post_attachment, topic_posts_approved,
				username, poster_id, post_time, post_attachment, geo_massif
			FROM	 ".TOPICS_TABLE." AS t
				JOIN ".FORUMS_TABLE." AS f USING (forum_id)
				JOIN ".POSTS_TABLE ." AS p ON (p.post_id = t.topic_last_post_id)
				JOIN ".USERS_TABLE."  AS u ON (p.poster_id = u.user_id)
			WHERE post_visibility = ".ITEM_APPROVED."
			ORDER BY post_time DESC
			LIMIT ".$nouvelles;
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			if ($auth->acl_get('f_read', $row['forum_id'])) {
				$row ['topic_comments'] = $row['topic_posts_approved'] - 1;
				$row ['post_time'] = $this->user->format_date ($row['post_time']);
				$row ['geo_massif'] = str_replace ('~', '', $row ['geo_massif']);
				$this->template->assign_block_vars('nouvelles', array_change_key_case ($row, CASE_UPPER));
			}
		$this->db->sql_freeresult($result);

		// Affiche un message de bienvenu dépendant du style pour ceux qui ne sont pas connectés
		// Le texte de ces messages sont dans les posts dont le titre est !style
		$sql = "SELECT post_text,bbcode_uid,bbcode_bitfield FROM ".POSTS_TABLE." WHERE post_subject LIKE '!{$this->user->style['style_name']}'";
		$result = $this->db->sql_query($sql);
		$row = $this->db->sql_fetchrow($result);
		$this->template->assign_var ('GEO_PRESENTATION', generate_text_for_display($row['post_text'], $row['bbcode_uid'], $row['bbcode_bitfield'], OPTION_FLAG_BBCODE, true));
		$this->db->sql_freeresult($result);
	}
}