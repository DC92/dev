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
		$this->template->assign_var ('ANNEE_DEBUT', $gym_const['annee_debut']);

		// Assign command line
		if ($this->args)
			foreach ($this->args AS $k=>$v)
				$this->template->assign_var ('REQUEST_'.strtoupper ($k), $v);

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
			WHERE p.post_visibility = 1";
		$result = $this->db->sql_query($sql);

		$menus = $accueil = $horaire = $en_horaire = $calendriers = [];
		while ($row = $this->db->sql_fetchrow($result)) {
			// Titre sans ses premiers chiffres
			preg_match ('/[!0-9]* ?(.*)/', $row['post_subject'], $title);
			if ($title)
				$row['post_title'] = $title[1];

			// Liste des menus
			preg_match ('/:menu=([0-9]*)/', $row['forum_desc'], $no_menu);
			if ($no_menu)
				$menus [$no_menu[1]] [$row['post_subject']] = $row;

			// Posts à afficher sur la page d'accueil
			if (stripos ($row['forum_desc'], ':accueil') !== false)
				$accueil [$row['post_subject']] = $row;

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

		// Popule les menus
		ksort ($menus); // Par n° de menu dans forum_desc
		foreach ($menus AS $k=>$v) {
			// Menus du header
			$menu_name = array_values($v)[0]['forum_name'];

			$this->template->assign_block_vars ('menu', [
				'TITLE' => $menu_name,
				'POST_ID' => @$v[$menu_name]['post_id'],
				'TOPIC_ID' => array_values($v)[0]['topic_id'],
				'FORUM_ID' => array_values($v)[0]['forum_id'],
				'COLOR' => $this->couleur (),
				'COLOR_TITLE' => $this->couleur (80, 162, 0),
			]);

			ksort ($v); // Par ordre alphabétique des rubriques du menu
			foreach ($v AS $vv) {
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

		// Textes de la page d'accueil
		ksort ($accueil); // Par ordre alphabétique de titre
		foreach ($accueil AS $a) {
			// Traduit les BBcodes
			$a['display_text'] = generate_text_for_display(
				$a['post_text'],
				$a['bbcode_uid'], $a['bbcode_bitfield'],
				OPTION_FLAG_BBCODE + OPTION_FLAG_SMILIES + OPTION_FLAG_LINKS
			);

			$this->template->assign_block_vars ('accueil',
				array_change_key_case ($a, CASE_UPPER)
			);
		}

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
		$url_viewtopic = strpos (@$this->server['SCRIPT_URI'], 'viewtopic') !== false;
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
		VIEWTOPIC.PHP
	*/
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];

		// Titre sans ses premiers chiffres
		preg_match ('/[!0-9]* ?(.*)/', $post_row['POST_SUBJECT'], $title);
		if ($title)
			$post_row['POST_SUBJECT'] = $title[1];

		// Redirect the page to an URL is text includes rediriger(URL)
		$sans_balises = preg_replace ('/<[^>]+>/', '', $vars['row']['post_text']);
		preg_match ('/rediriger\(([^\)]+)/', $sans_balises, $rediriger);
		if ($rediriger)
			$this->template->assign_var ('REDIRIGER', $rediriger[1]);

		$vars['post_row'] = $post_row; // Data to be displayed
	}

/*
		//Stores post SQL data for further processing (viewtopic proceeds in 2 steps)
		$this->all_post_data[$vars['row']['post_id']] = $vars['row'];

		$post_id = $post_row['POST_ID'];
		$post_data = $this->all_post_data[$post_id] ?: []; // Initial sql values
		$topic_data = $vars['topic_data'];

		// Supprime les balises inutiles pour l'affichage complet
		$post_row['MESSAGE'] = str_replace (['(resume)','(/resume)'], '', $post_row['MESSAGE']);

		// Replace (include)RELATIVE_PATH(/include)
		// by the content of the RELATIVE_PATH
		// Only on the required post
		$p = $this->request->variable ('p', 0);
		if ($post_row['POST_ID'] == $p || !$p)
			$post_row['MESSAGE'] = preg_replace_callback (
				'/\(include\)(.*)\(\/include\)/',
				function ($match) {
					$url = str_replace ('ARGS', // Replace ARGS by the current page arguments
							parse_url ($this->uri, PHP_URL_QUERY),
							pathinfo ($this->uri, PATHINFO_DIRNAME).'/'.htmlspecialchars_decode($match[1])
						);
					$url .= (parse_url ($url, PHP_URL_QUERY) ? '&' : '?').
						'mcp='.$this->auth->acl_get('m_');

					if (defined('MYPHPBB_BBCODE_INCLUDE_TRACE'))
						echo $url.'<br/>';

					return file_get_contents ($url);
				},
				$post_row['MESSAGE']
			);
*/

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
								'NO' => $vk,
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
		return; //TODO /////////////////////////////////////

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
/* //TODO DELETE
			'gym_accueil',
 			'gym_horaires',
 			'gym_menu',
 			'gym_ordre_menu',
 			'gym_scolaire',
*/
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

		// Add / correct the specific BBcodes
/*
//BBCODES
DELETE actualite
ancre
carte
centre
doc
droite
gauche
php include
location
page
presentation
DELETE php redirect
php resume
rubrique
saut_ligne
separation
surligne
titre1
titre2
titre3
titre4
video
youtube
*/

/* Activer uniquement pour créer un nouveau site ou updater les BBCODES
	//TODO DELETE
		$this->add_bbcode([
			['[droite]{TEXT}[/droite]','<div class="image-droite">{TEXT}</div>','Affiche une image à droite'],
			['[gauche]{TEXT}[/gauche]','<div class="image-gauche">{TEXT}</div>','Affiche une image à gauche'],
			['[doc={TEXT1}]{TEXT2}[/doc]','<a href="fichiers/{TEXT1}.pdf">{TEXT2}</a>','Lien vers un document'],
			['[page={TEXT1}]{TEXT2}[/page]','<a href="viewtopic.php?p={TEXT1}">{TEXT2}</a>','Lien vers une page'],
			['[rubrique={TEXT1}]{TEXT2}[/rubrique]','<a href="viewtopic.php?t={TEXT1}">{TEXT2}</a>','Lien vers une rubrique'],
			['[centre]{TEXT}[/centre]','<div style="text-align:center">{TEXT}</div>','Texte centré'],
			['[saut_ligne][/saut_ligne]','<br style="clear:both" />'],
			['[separation][/separation]','<hr/>','Ligne horizontale'],
			['[resume]{TEXT}[/resume]','(resume){TEXT}(/resume)','Partie de texte à afficher (accueil, actualité, ...)'],
			['[youtube]{TEXT}[/youtube]','<a href="ext/Dominique92/Gym/youtube.php?y={TEXT}">https://youtu.be/{TEXT}</a>'],
			['[surligne]{TEXT}[/surligne]','<span style="background:yellow">{TEXT}</span>','Surligné en jaune'],
			['[carte]{TEXT}[/carte]','<div id="carte"></div>','Insère la carte'],
			['[titre1]{TEXT}[/titre1]','<h1>{TEXT}</h1>','Caractères blancs sur fond bleu'],
			['[titre2]{TEXT}[/titre2]','<h2>{TEXT}</h2>','Caractères noirs sur fond vert'],
			['[titre3]{TEXT}[/titre3]','<h3>{TEXT}</h3>'],
			['[titre4]{TEXT}[/titre4]','<h4>{TEXT}</h4>'],
			['[video]{URL}[/video]', '<video width="100%" controls><source src="fichiers/{URL}.mp4" type="video/mp4">Your browser does not support HTML video.</video>', 'Insérer une vidéo MP4'],

			['[include]{TEXT}[/include]','(include){TEXT}(/include)','Inclut le contenu d\'une url dans la page'],
			['[redirect]{URL}[/redirect]','{URL}','Redirige la page vers l\'url'],
		]);
		*/
	}
/*
	function add_bbcode($bb) {
		// Récupère le prochain bbcode_id libre
		$sql = 'SELECT MAX(bbcode_id) as max_bbcode_id FROM '. BBCODES_TABLE;
		$result = $this->db->sql_query($sql);
		$row = $this->db->sql_fetchrow($result);
		$this->db->sql_freeresult($result);
		$next = $row['max_bbcode_id'] + 1;

		$sql = 'SELECT bbcode_tag FROM '. BBCODES_TABLE;
		$result = $this->db->sql_query($sql);
		$attachments = $update_count_ary = [];
		while ($row = $this->db->sql_fetchrow($result))
			$tags[$row['bbcode_tag']] = true;
		$this->db->sql_freeresult($result);

		foreach ($bb AS $k=>$v) {
			// Extract the tag
			preg_match ('/[a-z_0-9]+/', $v[0], $match);

			if (!isset ($tags[@$match[0]])) { // If it doesn't exist
				// Créate the tag line
				$sql = 'INSERT INTO '.BBCODES_TABLE.' VALUES ('.$next++.', "'.$match[0].
					'", "", 1, "", "", "/(?!)/", "", "/(?!)/", "")';
				$this->db->sql_query($sql);
			}
			// Update all
			$sql = 'UPDATE '.BBCODES_TABLE.' SET '.
				'bbcode_match = "'.$v[0].'", '.
				'bbcode_tpl = "'.addslashes($v[1]).'", '.
				'bbcode_helpline = "'.@$v[2].'", '.
				'display_on_posting = 1 '.
				'WHERE bbcode_tag = "'.$match[0].'"';
			$this->db->sql_query($sql);
		}
	}
*/
}