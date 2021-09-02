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

		$this->semaines = '5,6,7,8,9,10,13,14,15,16,17,18,19,22,23,24,25,26,27,30,31,32,33,34,35,36,39,40,41,42,43,44,45,46,47';

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

			// Viewtopic
			'core.viewtopic_gen_sort_selects_before' => 'viewtopic_gen_sort_selects_before',
			'core.viewtopic_modify_page_title' => 'viewtopic_modify_page_title',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
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
	function page_header() {
		// Includes language and style files of this extension
		$this->language->add_lang ('common', $this->ns[0].'/'.$this->ns[1]);

		// Includes style files of this extension
		if (!strpos ($this->server['SCRIPT_NAME'], 'adm/'))
			$this->template->set_style ([
				$this->ext_path.'styles',
				'styles', // core styles
			]);

		// Assign requested template
		foreach ($this->args AS $k=>$v)
			$this->template->assign_var ('REQUEST_'.strtoupper ($k), $v);

		$this->popule_posts();
	}

	/**
		Change le template sur demande
	*/
	// Appelé juste avant d'afficher
	function viewtopic_modify_page_title($vars) {
		if (strpos($vars['topic_data']['forum_desc'],':gym') !== false &&
				((!$this->args['f'] && $this->args['t']) ||
					$this->args['p']
				)
			)
			$this->my_template = 'viewtopic';
	}

	// Appelé après viewtopic_modify_page_title & template->set_filenames
	// Pour les templates inclus [include]template[/include]
	function page_footer_after() {
		$template = $this->request->variable (
			'template',
			$this->my_template ?: ''
		);
		if ($template)
			$this->template->set_filenames ([
				'body' => "@Dominique92_Gym/$template.html",
			]);
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Called before reading phpbb-posts SQL data
	function viewtopic_gen_sort_selects_before($vars) {
		// Tri des sous-menus dans le bon ordre
		$sort_by_sql = $vars['sort_by_sql'];
		$sort_by_sql['t'] = array_merge (
			['p.gym_ordre_menu IS NULL, p.gym_ordre_menu'],
			$sort_by_sql['t']
		);
		$vars['sort_by_sql'] = $sort_by_sql;
	}

	// Called during first pass on post data that read phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {
		//Stores post SQL data for further processing (viewtopic proceeds in 2 steps)
		$this->all_post_data[$vars['row']['post_id']] = $vars['row'];
		$p = $this->request->variable ('p', 0);

		// [redirect]ABSOLUTE_PATH[/redirect] go to ABSOLUTE_PATH */
		if ($vars['row']['post_id'] == $p || !$p) { // Only if a specific post is required
			// Purge unused <...>
			$text = preg_replace_callback (
				'/<[^>]*>/',
				function () {return '';},
				$vars['row']['post_text']
			);

			preg_match ('/\[redirect\](.*)\[\/redirect\]/', $text, $match);
			if ($match)
				exit ('<meta http-equiv="refresh" content="0;URL='.$match[1].'">');
		}
	}

	// Appelé lors de la deuxième passe qui prépare dans $post_row les données à afficher
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];
		$post_id = $post_row['POST_ID'];
		$post_data = $this->all_post_data[$post_id] ?: [];
		$topic_data = $vars['topic_data'];

		// Supprime les balises inutiles pour l'affichage complet
		$post_row['MESSAGE'] = str_replace (['(resume)','(/resume)'], '', $post_row['MESSAGE']);

		// Assign some values to template
		$post_row['TOPIC_FIRST_POST_ID'] = $topic_data['topic_first_post_id'];
		$post_row['GYM_MENU'] = $this->all_post_data[$post_row['POST_ID']]['gym_menu'];
		$post_row['COULEUR'] = $this->couleur(); // Couleur du sous-menu
		$post_row['GEO_JSON'] = $post_data['geo_json']; // Position sur la carte

		// Assign the gym values to the template
		foreach ($post_data AS $k=>$v)
			if (strstr ($k, 'gym') && is_string ($v))
				$post_row[strtoupper($k)] = $v;

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
		// Replace by a code & redirection manager
		if ($post_row['POST_ID'] == $p)
			$post_row['MESSAGE'] = preg_replace_callback (
				'/\[visio\](.*)\[\/visio\]/',
				function ($match) {
					// Mem the code
					if (@$this->args['code']) {
						setcookie ('code', $this->args['code'], time() + 31*24*3600);
						$this->cookies['code'] = $this->args['code'];
					}

					// Trace
					file_put_contents ('LOG/visio.LOG', var_export([
						'date' => date(DATE_RFC2822),
						'query' => $this->server['QUERY_STRING'],
						'ip' => $this->server['REMOTE_ADDR'],
						'referer' => @$this->server['HTTP_REFERER'],
						'agent' => @$this->server['HTTP_USER_AGENT'],
					], true), FILE_APPEND);

					// Vérification et routage
					global $myphp_template;
					if (strpos ($this->cookies['code'], $myphp_template['code_visio']) !== false &&
						isset($this->args['anim']))
						exit ('<meta http-equiv="refresh" content="0;URL=https://meet.jit.si/'.
							$myphp_template['code_visio'].'-'.
							$this->args['anim'].'">'
						);

					return // Add a code formulaire
						'<form action="'.$this->server['REQUEST_URI'].'" method="post">'.
							'<input name="code" type="text" style="width:200px">'.
							'<button type="submit">Envoyer</button>'.
						'</form>'.
						($this->cookies['code'] ? '<p style="color:red;font-weight:bold">Le code fourni n\'est pas (ou plus) valable</p>' : '');
				},
				$post_row['MESSAGE']
			);

		$vars['post_row'] = $post_row;
	}

	/**
		POSTING.PHP
	*/
	// Called when viewing the post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

		// Conditions d'affichage dépendant du forum
		preg_match_all ('/([\.:])(activ|calen|publi)/', $post_data['forum_desc'], $params);
		foreach ($params[2] AS $k=>$v)
			if ($params[1][$k] == ':' || // Map on all posts
				$post_data['post_id'] == $post_data['topic_first_post_id']) // Only map on the first post
				$this->template->assign_var ('PARAM_'.strtoupper($v), true);

		// Set specific variables
		foreach ($post_data AS $k=>$v)
			if (!strncmp ($k, 'gym', 3)) {
				$this->template->assign_var (strtoupper ($k), $v ?: 0);
				$data[$k] = explode (',', $v); // Expand grouped values
			}

		// Static dictionaries
		$static_values = $this->listes();
		foreach ($static_values AS $k=>$v)
			foreach ($v AS $vk=>$vv)
				$this->template->assign_block_vars (
					'liste_'.$k, [
						'NO' => $vk,
						'VALEUR' => $vv,
						'BASE' => in_array (strval ($v[$vk]), $data["gym_$k"] ?: [], true),
					]
				);

		// Dictionnaires en fonction du contenu de la base de données
		global $myphp_template;
		$topics_keys = $myphp_template['topic_activites'].','.$myphp_template['topic_lieux'].','.$myphp_template['topic_equipe'];
		$sql = "SELECT post_id, post_subject, topic_id
			FROM ".POSTS_TABLE."
			JOIN ".TOPICS_TABLE." USING (topic_id)
			WHERE post_id != topic_first_post_id
				AND topic_id IN($topics_keys)";
		$result = $this->db->sql_query($sql);

		$myphpbb_topics = @array_flip($myphp_template);
		$values = [];
		while ($row = $this->db->sql_fetchrow($result)) {
			$nom_liste = str_replace ('topic', 'liste', $myphpbb_topics[$row['topic_id']]);
			$values [$nom_liste][$row['post_subject']] = $row;
		}
		$this->db->sql_freeresult($result);

		foreach ($values AS $k=>$v) {
			ksort ($v);
			foreach ($v AS $vv)
				$this->template->assign_block_vars ($k, array_change_key_case ($vv, CASE_UPPER));
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
		$this->angle_couleur += $increment;
		$couleur = '#';
		for ($angle = 0; $angle < 6; $angle += 2)
			$couleur .= substr ('00'.dechex ($luminance - $saturation + $saturation * sin ($this->angle_couleur + $angle)), -2);
		return $couleur;
	}

	function listes() {
		return [
			'heures' => [0,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
			'minutes' => ['00','05',10,15,20,25,30,35,40,45,45,50,55],
			'jours' => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
			'duree' => [1,1.5,2,7.5],
		];
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
			'gym_cert',
			'gym_nota',
			'gym_jour',
			'gym_heure',
			'gym_minute',
			'gym_duree_heures',
			'gym_duree_jours',
 			'gym_scolaire',
 			'gym_semaines',
			'gym_accueil',
 			'gym_horaires',
 			'gym_menu',
 			'gym_ordre_menu',
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
php redirect
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

			//TODO AFTER3 DELETE
			['[accueil]{TEXT}[/accueil]','(resume){TEXT}(/resume)'],
			['[actualite]{TEXT}[/actualite]','(resume){TEXT}(/resume)'],
			['[presentation]{TEXT}[/presentation]','(resume){TEXT}(/resume)','Presentation pour affichage dans la rubrique'],
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

	// Popule les templates
	function popule_posts() {
		// Filtres pour horaires
		$cond = ['TRUE'];

		$p = $this->request->variable('p', 0);
		if ($this->request->variable('filtre', 0))
			$cond[] = "(ac.post_id=$p OR li.post_id=$p OR an.post_id=$p)";

		// Récupère la table de tous les attachements pour les inclusions BBCode
		$sql = 'SELECT * FROM '. ATTACHMENTS_TABLE .' ORDER BY attach_id DESC, post_msg_id ASC';
		$result = $this->db->sql_query($sql);
		$attachments = $update_count_ary = [];
		while ($row = $this->db->sql_fetchrow($result))
			$attachments[$row['post_msg_id']][] = $row;
		$this->db->sql_freeresult($result);

		$sql = "SELECT p.*, t.topic_title, t.topic_first_post_id,
			first.gym_menu AS first_gym_menu,
			first.gym_ordre_menu AS first_gym_ordre_menu,
			first.post_subject AS first_post_subject,
			li.post_subject AS lieu,
			an.post_subject AS animateur,
			ac.post_subject AS activite
			FROM ".POSTS_TABLE." AS p
				LEFT JOIN ".POSTS_TABLE." AS ac ON (ac.post_id = p.gym_activite)
				LEFT JOIN ".POSTS_TABLE." AS li ON (li.post_id = p.gym_lieu)
				LEFT JOIN ".POSTS_TABLE." AS an ON (an.post_id = p.gym_animateur)
				LEFT JOIN ".TOPICS_TABLE." AS t ON (t.topic_id = p.topic_id)
				LEFT JOIN ".POSTS_TABLE." AS first ON (first.post_id = t.topic_first_post_id)
				WHERE ".implode(' AND ',$cond )."
				ORDER BY p.topic_id, p.post_id";

		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			// Assigne le titre
			if ($row['post_id'] == $p)
				$this->template->assign_var ('POST_SUBJECT', $row['post_subject']);

			// Clean non selected values
			foreach ($row AS $k=>$v)
				if ($v == 'off' || $v == '?')
					unset($row[$k]);

			// BBCodes et attachements
			$row['display_text'] = generate_text_for_display(
				$row['post_text'],
				$row['bbcode_uid'], $row['bbcode_bitfield'],
				OPTION_FLAG_BBCODE + OPTION_FLAG_SMILIES + OPTION_FLAG_LINKS
			);
			if (!empty($attachments[$row['post_id']]))
				parse_attachments($row['forum_id'], $row['display_text'], $attachments[$row['post_id']], $update_count_ary);

			// Extrait le résumé
			preg_match ('/\(resume\)(.*)\(\/resume\)/s', $row['display_text'], $match);
			$row['resume'] = count($match)
				? $match[1]
				: $row['display_text'];

			// Date
			global $myphp_js;
			$row['gym_jour_literal'] = $this->listes()['jours'][intval ($row['gym_jour'])];

			if($row['gym_scolaire'] == 'on')
				$row['gym_semaines'] = $this->semaines;

			if($row['gym_semaines'] && !$row['gym_menu']) {
				setlocale(LC_ALL, 'fr_FR');
				$row['next_end_time'] = INF;
				foreach (explode (',', $row['gym_semaines']) AS $s) {
					$beg_time = mktime (
						$row['gym_heure'], $row['gym_minute'], 0,
						8, 2 + $s * 7 + $row['gym_jour'], $myphp_js['annee_debut'] // A partir du lundi suivant le 1er aout annee_debut
					);
					$end_time = mktime (
						$row['gym_heure'] + $row['gym_duree_heures'] + 24 * $row['gym_duree_jours'],
						$row['gym_minute'],
						0, // Secondes
						8, 3 + $s * 7 + $row['gym_jour'], $myphp_js['annee_debut'] // Lundi suivant le 1er aout annee_debut
					);
					// Garde le premier évènement qui finit après la date courante
					if ($end_time > time() && $end_time < $row['next_end_time']) {
						$row['next_beg_time'] = $beg_time;
						$row['next_end_time'] = $end_time;
						$row['date'] = ucfirst (
							str_replace ('  ', ' ',
							utf8_encode (
							strftime ('%A %e %B', $beg_time)
						)));
					}
				}
			} else
				$row['next_beg_time'] = 1234567890 + $row['gym_jour'];

			// Horaires
			$row['gym_heure'] = substr('00'.$row['gym_heure'], -2);
			$row['gym_minute'] = substr('00'.$row['gym_minute'], -2);

			$row['gym_minute_fin'] = $row['gym_minute'] + $row['gym_duree_heures'] * 60;
			$row['gym_heure_fin'] = $row['gym_heure'] + floor ($row['gym_minute_fin'] / 60);
			$row['gym_minute_fin'] = $row['gym_minute_fin'] % 60;

			$row['gym_heure_fin'] = substr('00'.$row['gym_heure_fin'], -2);
			$row['gym_minute_fin'] = substr('00'.$row['gym_minute_fin'], -2);
			$row['horaire_debut'] = $row['gym_heure'].'h'.$row['gym_minute'];
			$row['horaire_fin'] = $row['gym_heure_fin'].'h'.$row['gym_minute_fin'];

			if($row['gym_horaires'] == 'on' && $row['gym_acces'] == 'ferme')
				$this->template->assign_var ('ACCES_FERME', true);

			// Fil de la page d'acueil
			if (@$row['gym_accueil'])
				$accueil [
					sprintf("%05d", $row['gym_ordre_menu']).
					$row['horaire_debut'].
					$row['post_id'] // Pour séparer les exeaco
				] = array_change_key_case ($row, CASE_UPPER);

			// Range les résultats dans l'ordre et le groupage espéré
			$liste [
				$this->request->variable('template', '') == 'horaires'
					? $row['gym_jour'] // Horaires
					: $row['first_gym_ordre_menu'] // Menu
			][
				$row['gym_ordre_menu'].'*'. // Horaires
				$row['horaire_debut'].'*'.
				$row['post_subject']. // Pour trier par nom
				$row['post_id'] // Pour séparer les exeaco
			] = array_change_key_case ($row, CASE_UPPER);
		}
		$this->db->sql_freeresult($result);
	
		if ($accueil) {
			ksort ($accueil, SORT_STRING);
			foreach ($accueil AS $k=>$v)
				$this->template->assign_block_vars ('accueil', $v);
		}

		if ($liste) {
			// Tri du 1er niveau
			ksort ($liste, SORT_STRING);
			foreach ($liste AS $k=>$v) {
				// La première ligne pour avoir les valeurs générales
				$first = [];
				foreach ($v AS $vv)
					$first = array_merge ($vv, $first);
				$first['COULEUR'] = $this->couleur ();
				$first['COULEUR_FOND'] = $this->couleur (35, 255, 0);
				$first['COULEUR_BORD'] = $this->couleur (40, 196, 0);
				$first['COULEUR_TITRE'] = $this->couleur (80, 162, 0);
				$first['COUNT'] = count ($v);
				$this->template->assign_block_vars ('topic', $first);

				// Tri du 2" niveau
				ksort ($v, SORT_STRING);
				foreach ($v AS $kv=>$vv) {
					if ($this->request->variable('template', '') == 'submenu')
						$vv['COULEUR'] = $this->couleur (); // Pour submenu
					$this->template->assign_block_vars ('topic.post', $vv);
				}
			}
		}
	}
}