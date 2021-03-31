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
/*//TODO
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

			// Viewtopic
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',
			'core.viewtopic_modify_post_data' => 'viewtopic_modify_post_data',
			'core.parse_attachments_modify_template_data' => 'parse_attachments_modify_template_data',

			// posting
			'core.modify_posting_auth' => 'modify_posting_auth',
		];
	}

	/**
		ALL
	*/
	function page_header() {
		// Liste des catégories de points à ajouter
		$sql = "
			SELECT p.forum_id AS category_id,
				p.forum_name AS category_name,
				f.forum_id AS first_forum_id,
				f.forum_desc
			FROM ".FORUMS_TABLE." AS f
			JOIN ".FORUMS_TABLE." AS p ON p.forum_id = f.parent_id
			WHERE f.forum_type = ".FORUM_POST."
				AND p.forum_type = ".FORUM_CAT."
				AND p.parent_id = 0
			ORDER BY f.left_id
		";
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			if (!@$cat[$row['category_id']]++) // Seulement une fois par catégorie
				$this->template->assign_block_vars (
					'geo_categories',
					array_change_key_case (
						preg_replace ('/s( |$)/i', '$1', $row), // Enlève les s en fin de mot
						CASE_UPPER
					)
				);
		$this->db->sql_freeresult($result);

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

	/**
		INDEX.PHP
	*/
	// Affiche les post les plus récents sur la page d'accueil
	function index_modify_page_title ($vars) {
		global $auth; //BEST intégrer aux variables du listener ($this->auth)

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

	/**
		VIEWTOPIC.PHP
	*/
	// Called during first pass on post data that read phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {//1400
		// Garde les données SQL de chaque post en mémoire
		$row = $vars['row'];
		$post_id = $row['post_id'];
		$this->sql_row[$post_id] = $row;
	}
	// Modify the posts template block
	function viewtopic_modify_post_row($vars) {
		$row = $vars['row'];
		$post_id = $row['post_id'];
		$sql_row = $this->sql_row[$post_id];
		$post_row = $vars['post_row'];

		$geom = json_decode ($sql_row['geojson']);
		$ll = $geom->geometries[0]->coordinates;

		// Calcul de l'altitude avec mapquest
		if (@count($ll) == 2 && !@$sql_row['geo_altitude']) {
			global $mapKeys;
			$mapquest = 'http://open.mapquestapi.com/elevation/v1/profile?key='.
				$mapKeys['keys-mapquest'].
				'&callback=handleHelloWorldResponse&shapeFormat=raw&latLngCollection='.
				$ll[1].','.$ll[0];
			preg_match('/"height":([0-9]+)/', @file_get_contents ($mapquest), $match);

			// Update the template data
			$sql_row['geo_altitude'] = $match ? $match[1] : '~';

			// Update the database for next time
			$sql = "UPDATE phpbb_posts SET geo_altitude = '{$sql_row['geo_altitude']}' WHERE post_id = $post_id";
			$this->db->sql_query($sql);
		}

		// Détermination du massif par refuges.info
		if (@count($ll) == 2 && !@$sql_row['geo_massif']) {
			$f_wri_export = 'http://www.refuges.info/api/polygones?type_polygon=1,10,11,17&bbox='.$ll[0].','.$ll[1].','.$ll[0].','.$ll[1];
			$wri_export = json_decode (@file_get_contents ($f_wri_export));
			// récupère tous les polygones englobantz
			if($wri_export->features)
				foreach ($wri_export->features AS $f)
					$ms [$f->properties->type->id] = $f->properties->nom;
			// Trie le type de polygone le plus petit
			if (isset ($ms))
				ksort ($ms);

			// Update the template data
			$sql_row['geo_massif'] = @$ms[array_keys($ms)[0]] ?: '~';

			// Update the database for next time
			$sql = "UPDATE phpbb_posts SET geo_massif = '{$sql_row['geo_massif']}' WHERE post_id = $post_id";
			$this->db->sql_query($sql);
		}

		// Assigne les valeurs spécifiques à chaque post du template
		foreach ($sql_row AS $k=>$v)
			if (strpos ($k,'geo_') === 0)
				$post_row[strtoupper($k)] = str_replace ('~', '', $v);

		$vars['post_row'] = $post_row;
	}

	function viewtopic_modify_post_data($vars) {
		// Mem for parse_attachments_modify_template_data
		$this->attachments = $vars['attachments'];
	}
	function parse_attachments_modify_template_data($vars) {
		if (@$this->attachments) {
			$post_id = $vars['attachment']['post_msg_id'];

			// Assigne les valeurs au template
			$this->block_array = $vars['block_array'];
			$this->block_array['TEXT_SIZE'] = strlen (@$this->post_data[$post_id]['post_text']) * count($this->attachments[$post_id]);
			$this->block_array['DATE'] = str_replace (' 00:00', '', $this->user->format_date($vars['attachment']['filetime']));
			$this->block_array['AUTEUR'] = $vars['row']['user_sig']; //TODO Retrouver le nom du "poster_id" : $vars['attachment']['poster_id'] ??
			$this->block_array['EXIF'] = $vars['attachment']['exif'];
			foreach ($vars['attachment'] AS $k=>$v)
				$this->block_array[strtoupper($k)] = $v;
			$vars['block_array'] = $this->block_array;

			// Ceci va assigner un template à {postrow.attachment.DISPLAY_ATTACHMENT}
			$view = $this->request->variable ('view', 'geo');
			if ($view == 'geo')
				$this->template->set_filenames ([
					'attachment_tpl' => '@Dominique92_Chemineur/viewtopic_point_photo.html'
				]);
		}
	}

	/**
		POSTING.PHP
	*/
	function modify_posting_auth($vars) {
		require_once($this->root_path . 'includes/functions_admin.php');

		// Popule le sélecteur de forum
		$sql = "SELECT forum_id, forum_name, parent_id, forum_type, forum_flags, forum_options, left_id, right_id, forum_desc
			FROM ".FORUMS_TABLE."
			WHERE forum_type = 1
			ORDER BY left_id ASC";
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$forum_list [] = '<option value="' . $row['forum_id'] . '"' .($row['forum_id'] == $vars['forum_id'] ? ' selected="selected"' : ''). '>' . $row['forum_name'] . '</option>';
		$this->db->sql_freeresult($result);

		if (isset ($forum_list))
			$this->template->assign_var (
				'S_FORUM_SELECT',
				implode ('', $forum_list)
			);

		// Assigne le nouveau forum pour la création
		$vars['forum_id'] = request_var('to_forum_id', $vars['forum_id']);

		// Le bouge
		if ($vars['mode'] == 'edit' && // S'il existe déjà !
			$vars['forum_id'] != $vars['forum_id'])
			move_topics([$vars['post_id']], $vars['forum_id']);
	}
}