<?php
/**
 * EPGV specific functions & style for the phpBB Forum
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

namespace Dominique92\Gym\event;

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
		$this->cookies = $this->request->get_super_global(\phpbb\request\request_interface::COOKIE);
		$this->args = $this->request->get_super_global(\phpbb\request\request_interface::REQUEST);
		$this->server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
		$this->uri = $this->server['REQUEST_SCHEME'].'://'.$this->server['SERVER_NAME'].$this->server['REQUEST_URI'];
	}

	static public function getSubscribedEvents() {
		return [
			// All
			'core.page_header' => 'page_header',
			'core.page_footer_after' => 'page_footer_after',
			'core.gen_sort_selects_after' => 'gen_sort_selects_after',

			// Index
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',

			// Adm
			'core.adm_page_header' => 'adm_page_header',
		];
	}

	/**
		ALL
	*/
	function page_header($var) {
		global $gym_const;

		// Includes style files of this extension
		if (!strpos ($this->server['SCRIPT_NAME'], 'adm/'))
			$this->template->set_style ([
				$this->ext_path.'styles',
				'styles', // Core styles
			]);

		// Includes language and style files of this extension
		$this->language->add_lang ('common', $this->ns[0].'/'.$this->ns[1]);

		// Constants values used in js code
		//BEST grouper gym_const -> js
		$this->template->assign_var ('ANNEE_DEBUT', $gym_const['annee_debut']);
		$this->template->assign_var ('MOIS_DEBUT', $gym_const['mois_debut']);
		$this->template->assign_var ('JOUR_DEBUT', $gym_const['jour_debut']);

		// Assign command line
		if ($this->args)
			foreach ($this->args AS $k=>$v)
				$this->template->assign_var (strtoupper ("REQUEST_$k"), $v);

		// List all attacments
		$sql = 'SELECT *
			FROM '.ATTACHMENTS_TABLE.'
			WHERE in_message = 0
			ORDER BY attach_id DESC, post_msg_id ASC';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$attachments[$row['post_msg_id']][] = $row;
		$this->db->sql_freeresult($result);

		// Lecture de la base
		$sql = "SELECT p.*,
				f.forum_name, f.forum_desc,
				acti.post_subject AS activite,
				equi.post_subject AS animateur,
				lieu.post_subject AS lieu
			FROM ".POSTS_TABLE." AS p
				LEFT JOIN ".FORUMS_TABLE." AS f ON (f.forum_id = p.forum_id)
				LEFT JOIN ".POSTS_TABLE." AS acti ON (acti.post_id = p.gym_activite)
				LEFT JOIN ".POSTS_TABLE." AS equi ON (equi.post_id = p.gym_animateur)
				LEFT JOIN ".POSTS_TABLE." AS lieu ON (lieu.post_id = p.gym_lieu)
			WHERE p.post_visibility = 1"; // Posts non supprimés
		$result = $this->db->sql_query($sql);

		$menus = $une = $horaire = $en_horaire = $calendriers = $update_count = [];
		while ($row = $this->db->sql_fetchrow($result)) {
			// Titre sans ses premiers chiffres
			preg_match ('/[!0-9]* ?(.*)/', $row['post_subject'], $title);
			if ($title)
				$row['post_title'] = $title[1];

			// Traduit les BBcodes
			$row['message'] = generate_text_for_display (
				$row['post_text'],
				$row['bbcode_uid'],
				$row['bbcode_bitfield'],
				OPTION_FLAG_BBCODE + OPTION_FLAG_SMILIES + OPTION_FLAG_LINKS
			);
			if ($row['post_attachment'])
				parse_attachments ($row['forum_id'], $row['message'], $attachments[$row['post_id']], $update_count);

			// Insére + d'infos... à l'emplacement du tag [suite]
			$ms = explode ('<suite>', $row['message']);
			if (count ($ms) > 1)
				$row['message'] = $ms[0].
					'<a href="viewtopic.php?p='.$row['post_id'].
					'" title="Voir la suite du texte">Plus d\'infos...</a>';

			// Liste des menus
			preg_match ('/:menu=([0-9]*)/', $row['forum_desc'], $no_menu);
			if ($no_menu) {
				$menus [$no_menu[1]] [$row['post_subject']] = $row;
				$this->template->assign_var ('NO_MENU', $no_menu[1]);
			}

			// Posts à afficher sur la première page
			if (stripos ($row['forum_desc'], ':une') !== false)
				$une [$row['post_subject']] = $row;

			// Séances à afficher dans l'horaire
			if (stripos ($row['forum_desc'], ':horaire') !== false) {
				$dans_cet_horaire = [$row ['gym_activite'], $row ['gym_animateur'], $row ['gym_lieu']];
				$en_horaire = array_merge($en_horaire, $dans_cet_horaire);

				if (in_array ($this->request->variable('p', 0), $dans_cet_horaire) ||
					stripos ($var['page_title'], 'horaire') !== false)
					$horaire
						[intval ($row ['gym_jour'])]
						[intval ($row['gym_heure']) * 60 + intval ($row['gym_minute'])] =
						$row;
			}

			// Calendriers de toutes les séances de l'activité
			if ($row['gym_semaines'] &&
				$row['gym_semaines'] != 'off' &&
				$row['gym_activite'] == $this->request->variable('p', 0)
				)
				$calendriers [intval ($row['gym_jour'])] = $row;
		}
		$this->db->sql_freeresult($result);

		// Menus du header
		ksort ($menus); // Par n° de menu dans forum_desc
		foreach ($menus AS $k=>$v) {
			ksort ($v); // Par ordre alphabétique des lignes du menu

			// Menu title
			$menu_head = array_values($v)[0];

			if ($menu_head['post_subject'][0] == '!')
				array_shift ($v);
			else
				$menu_head = [
					'post_title' => $menu_head['forum_name'],
					'forum_id' => $menu_head['forum_id'],
				];

			$this->template->assign_block_vars ('menu',
				array_change_key_case ($menu_head, CASE_UPPER) + [
					'COLOR' => $this->couleur (),
					'COLOR_TITLE' => $this->couleur (80, 162, 0),
				]
			);

			foreach ($v AS $vv) {
				$vv['color'] =  $this->couleur ();

				// Sous-items des menus
				if ($vv['post_subject'] != $vv['forum_name'] &&
					($k == 1 || in_array ($vv['post_id'], $en_horaire)))
					$this->template->assign_block_vars ('menu.item',
						array_change_key_case ($vv, CASE_UPPER)
					);

				// Posting selections
				$this->template->assign_block_vars ('liste_saisie_'.$k,
					array_change_key_case ($vv, CASE_UPPER)
				);
			}
		}

		// Textes de la première page
		ksort ($une); // Par ordre alphabétique de titre
		foreach (array_values ($une) AS $k=>$v)
			$this->template->assign_block_vars ('une',
				array_change_key_case ($v, CASE_UPPER) + ['MENU_LINE_NUMBER' => $k]
			);

		// Horaires
		global $gym_const;
		ksort ($horaire);
		foreach ($horaire AS $j=>$jour) { // Jours de la semaine
			$first = array_values($jour)[0];
			$first['jour_literal'] = $gym_const['jour'][$j];
			$first['couleur'] = $this->couleur ();
			$first['couleur_fond'] = $this->couleur (35, 255, 0);
			$first['couleur_bord'] = $this->couleur (40, 196, 0);
			$this->template->assign_block_vars ('jour',
				array_change_key_case ($first, CASE_UPPER)
			);

			ksort ($jour); // Horaires dans la journée
			foreach ($jour AS $s) { // Séances
				$m = intval (@$s['gym_minute']);
				$h = intval (@$s['gym_heure']);
				$m_fin = $m + intval (@$s['gym_duree_heures']) * 60;
				$h_fin = $h + floor ($m_fin / 60);
				$s['debut'] = substr ('00' .$h, -2) .'h'. substr ('00' .$m, -2);
				$s['fin'] = substr('00' .$h_fin, -2) .'h'. substr ('00' .$m_fin % 60, -2);

				$this->template->assign_block_vars ('jour.seance',
					array_change_key_case ($s, CASE_UPPER)
				);
			}
		}

		// Calendriers
		if ($calendriers) {
			ksort ($calendriers); // Par n° de jour dans la semaine
			foreach ($calendriers AS $k=>$v) {
				$v['gym_jour_literal'] = $gym_const['jour'][$k];

				$this->template->assign_block_vars ('calendrier',
					array_change_key_case ($v, CASE_UPPER)
				);
			}
		}
	}

	function page_footer_after($var) {
		// Change le template viewtopic sauf après viewforum
		$url_viewtopic = strpos (@$this->server['SCRIPT_NAME'], 'viewtopic') !== false;
		$ref_viewforum = strpos (@$this->server['HTTP_REFERER'], 'viewforum') !== false;

		if ($url_viewtopic && !$ref_viewforum)
			$this->template->set_filenames(array(
				'body' => 'viewtopic.html',
			));
	}

	function gen_sort_selects_after($vars) {
		// Ordre d'affichage
		$vars['sort_key'] = 's';
		$vars['sort_dir'] = 'a';
	}

	/**
		INDEX.PHP
	*/
	function index_modify_page_title() {
		foreach (glob ('fichiers/slider/*') AS $f)
			$this->template->assign_block_vars ('slider', [
				'FILE_NAME' => $f,
			]);
	}

	/**
		VIEWTOPIC.PHP
	*/
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];

		// Tête de menu
		$post_row['FIRST_MENU_LINE'] = @$post_row['POST_SUBJECT'][0] == '!' ? 'true' : 'false';

		// Titre sans ses premiers chiffres
		preg_match ('/[!0-9]* ?(.*)/', $post_row['POST_SUBJECT'], $title);
		if ($title)
			$post_row['POST_SUBJECT'] = $title[1];

		// Enlever les balises des titres
		$post_row['POST_SUBJECT'] = preg_replace ('/<[^>]+>/', '', $post_row['POST_SUBJECT']);

		// Redirect the page to an URL is text includes rediriger(URL)
		$sans_balises = preg_replace ('/<[^>]+>/', '', $vars['row']['post_text']);
		preg_match ('/rediriger\]([^\[]+)/', $sans_balises, $rediriger);
		if ($rediriger)
			$this->template->assign_var ('REDIRIGER', $rediriger[1]);

		// Include a template file
		preg_match ('/inclure\]([^\[]+)/', $sans_balises, $inclure);
		if ($inclure && is_file($this->ext_path.'styles/prosilver/template/'.$inclure[1].'.html'))
			$this->template->assign_var ('INCLURE', $inclure[1]);

		$vars['post_row'] = $post_row; // Data to be displayed
	}

	/**
		POSTING.PHP
	*/
	// Called when viewing the post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

		if (stripos ($post_data['forum_desc'], ':horaire') !== false) {
			$this->template->assign_var ('SAISIE_HORAIRE', true);

			// Set specific variables
			foreach ($post_data AS $k=>$v)
				if (!strncmp ($k, 'gym', 3)) {
					$this->template->assign_var (strtoupper ($k), $v ?: 0);
					$data[$k] = explode (',', $v); // Expand grouped values
				}

			// Static selections
			global $gym_const;
			foreach ($gym_const AS $k=>$v)
				if (is_array ($v))
					foreach ($v AS $vk=>$vv)
						$this->template->assign_block_vars ('liste_'.$k, [
								'MENU_LINE_NUMBER' => $vk,
								'VALEUR' => $vv,
							]
						);
		}
	}

	// Called during validation of the data to be saved
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];

		// Get special columns list
		$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "gym_%"';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$sql_data[POSTS_TABLE]['sql'][$row['Field']] = 'off'; // Default field value
		$this->db->sql_freeresult($result);

		// Treat specific data
		if ($this->args)
			foreach ($this->args AS $k=>$v)
				if (!strncmp ($k, 'gym', 3)) {
					if(is_array($v))
						$v = implode (',', $v);

				// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
				$sql_data[POSTS_TABLE]['sql'][$k] = utf8_normalize_nfc($v) ?: null; // null allows the deletion of the field
			}
		$vars['sql_data'] = $sql_data; // return data
		$this->modifs = $sql_data[POSTS_TABLE]['sql']; // Save change
	}

	/**
		FUNCTIONS
	*/
	function couleur(
		$saturation = 60, // on 127
		$luminance = 255,
		$increment = 1.8
	) {
		if (!isset ($this->angle_couleur))
			$this->angle_couleur = 0;
		$this->angle_couleur += $increment;
		$couleur = '#';
		for ($angle = 0; $angle < 6; $angle += 2)
			$couleur .= substr ('00'.dechex ($luminance - $saturation + $saturation * sin ($this->angle_couleur + $angle)), -2);
		return $couleur;
	}

	/**
		ADM
	*/
	// Appelé par n'importe quelle page de l'administration
	function adm_page_header() {
		// Create required SQL columns when needed
		$columns = [
			'gym_activite',
			'gym_lieu',
			'gym_acces',
			'gym_animateur',
			'gym_nota',
			'gym_jour',
			'gym_heure',
			'gym_minute',
			'gym_duree_heures',
			'gym_duree_jours',
 			'gym_semaines',
		];
		foreach ($columns AS $column) {
			$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "'.$column.'"';
			$result = $this->db->sql_query($sql);
			$row = $this->db->sql_fetchrow($result);
			$this->db->sql_freeresult($result);
			if (!$row) {
				$sql = 'ALTER TABLE '.POSTS_TABLE.' ADD '.$column.' TEXT';
				$this->db->sql_query($sql);
			}
		}
	}
}