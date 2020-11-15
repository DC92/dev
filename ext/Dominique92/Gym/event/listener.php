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

		$this->annee_debut = 2020;
		$this->semaines = '5,6,7,8,9,10,13,14,15,16,17,18,19,22,23,24,25,26,27,30,31,32,33,34,35,36,39,40,41,42,43,44,45,46,47';

		$this->ns = explode ('\\', __NAMESPACE__);
		$this->ext_path = 'ext/'.$this->ns[0].'/'.$this->ns[1].'/';
		$this->server = $this->request->get_super_global(\phpbb\request\request_interface::SERVER);
		$this->args = $this->request->get_super_global(\phpbb\request\request_interface::REQUEST);
	}

	static public function getSubscribedEvents() {
		return [
			// All
			'core.page_header' => 'page_header',
			'core.page_footer_after' => 'page_footer_after',
			'core.twig_environment_render_template_after' => 'twig_environment_render_template_after',

			// Viewtopic
			'core.viewtopic_gen_sort_selects_before' => 'viewtopic_gen_sort_selects_before',
			'core.viewtopic_modify_page_title' => 'viewtopic_modify_page_title',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Viewforum
			'core.viewforum_modify_topicrow' => 'viewforum_modify_topicrow',

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
		$this->template->assign_var ('EXT_PATH', $this->ext_path);
		foreach ($this->args AS $k=>$v)
			$this->template->assign_var ('REQUEST_'.strtoupper ($k), $v);

		$this->popule_posts();
	}

	/**
		Change le template sur demande
	*/
	// Appelé juste avant d'afficher
	function viewtopic_modify_page_title($vars) {
		if (!$this->args['f'] && $this->args['t'] ||
			$this->args['p'])
			$this->my_template = 'viewtopic';
	}

	// Appelé après viewtopic_modify_page_title & template->set_filenames
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
		Expansion des "BBCodes" maisons : (INCLUDE|LOCATION valeur)
	*/
	//TODO DELETE
	function twig_environment_render_template_after($vars) {
		if ($vars['name'] == 'index_body.html' ||
			$vars['name'][0] == '@')
			$vars['output'] = preg_replace_callback (
				'/\(([A-Z]+) ?([^\)]*)\)/s',
				function ($match) {
					$uris = explode ('/', $this->server['SERVER_NAME'].$this->server['REQUEST_URI']);
					$uris [count($uris) - 1] = str_replace (
						['%23','%26','amp%3B','%3F','%3D'],
						['#','&','','?','='],
						urlencode (urldecode ($match[2]))
					);
					$url = 'http://'.implode ('/', $uris);

					// Cas où le paramètre est une url bbcodisée
					$match_url = explode ('"', $match[2]);
					if ($match_url[0] == '<a href=')
						$url = $match_url[1];

					switch ($match[1]) {
						// (INCLUDE relative_url) replace this string by the url content
						case 'INCLUDE':
							return file_get_contents (
								$url.
								'&it='.$this->request->variable('t',0).
								'&ip='.$this->request->variable('p',0).
								'&mod='.$this->auth->acl_get('m_')
							);

						// (LOCATION relative_url) replace this page by the url
						case 'LOCATION':
							header ('Location: '.urldecode($url));
							exit;
					}
					// Sinon, on ne fait rien
					return $match[0];
				},
				$vars['output']
			);
	}

	/**
		VIEWFORUM.PHP
	*/
	function viewforum_modify_topicrow($vars) {
		// Permet la visualisation en vue forum pour l'édition du site
		$topic_row = $vars['topic_row'];
		$topic_row['U_VIEW_TOPIC'] .= '&template=';
		$vars['topic_row'] = $topic_row;
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
	}

	// Appelé lors de la deuxième passe sur les données des posts qui prépare dans $post_row les données à afficher sur le post du template
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];
		$post_id = $post_row['POST_ID'];
		$post_data = $this->all_post_data[$post_id] ?: [];
		$topic_data = $vars['topic_data'];

		// Assign some values to template
		$post_row['TOPIC_FIRST_POST_ID'] = $topic_data['topic_first_post_id'];
		$post_row['GYM_MENU'] = $this->all_post_data[$post_row['POST_ID']]['gym_menu'];
		$post_row['COULEUR'] = $this->couleur(); // Couleur du sous-menu

		// Assign the gym values to the template
		foreach ($post_data AS $k=>$v)
			if (strstr ($k, 'gym') && is_string ($v))
				$post_row[strtoupper($k)] = $v;

		// Remplace dans le texte du message VARIABLE_TEMPLATE par sa valeur
		$post_row['MESSAGE'] = preg_replace_callback(
			'/([A-Z_]+)/',
			function ($matches) use ($post_row) {
				$r = $post_row[$matches[1]];
				return urlencode ($r ?: $matches[1]);
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

		// Quelles saisies spéciales
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
		$sql = "SELECT post_id, post_subject, topic_id
			FROM ".POSTS_TABLE."
			JOIN ".TOPICS_TABLE." USING (topic_id)
			WHERE post_id != topic_first_post_id
				AND topic_id IN(2,3,4)";
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$values [$row['topic_id']][$row['post_subject']] = $row;
		$this->db->sql_freeresult($result);

		foreach ($values AS $k=>$v) {
			ksort ($v);
			foreach ($v AS $vv)
				$this->template->assign_block_vars ('liste_'.$k, array_change_key_case ($vv, CASE_UPPER));
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
	function adm_page_header() {
		// Create required SQL columns when needed
		$columns = [
			'gym_activite',
			'gym_lieu',
			'gym_ouverture',
			'gym_animateur',
			'gym_cert',
			'gym_jour',
			'gym_heure',
			'gym_minute',
			'gym_duree_heures',
			'gym_duree_jours',
 			'gym_scolaire',
 			'gym_semaines',
			'gym_accueil',
			'gym_actualite',
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
	}

	// Popule les templates
	function popule_posts() {
		// Filtre pour horaires
		$cond = ['TRUE'];
		$post_id = $this->request->variable('id', '', true);
		if ($post_id)
			$cond[] = 'p.post_id='.$post_id;

		$request_it = $this->request->variable('it', 0);
		$request_ip = $this->request->variable('ip', 0);
		if ($request_it == 2 && $request_ip)
			$cond[] = 'ac.post_id='.$request_ip;
		elseif ($request_it == 3 && $request_ip)
			$cond[] = 'li.post_id='.$request_ip;
		elseif ($request_it == 4 && $request_ip)
			$cond[] = 'an.post_id='.$request_ip;

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

			// Extrait des résumé des parties à afficher
			foreach (['accueil','actualite','presentation'] AS $k) {
				$vs = explode ("<!--$k-->", $row['display_text']);
				if (count ($vs) > 1)
					$row[strtoupper($k)] = $vs[1];
			}

			// Date
			$this->template->assign_var ('ANNEE_DEBUT', $this->annee_debut);
			$row['gym_jour_literal'] = $this->listes()['jours'][intval ($row['gym_jour'])];

			if($row['gym_scolaire'] == 'on')
				$row['gym_semaines'] = $this->semaines;

			if($row['gym_semaines'] && !$row['gym_menu']) {
				setlocale(LC_ALL, 'fr_FR');
				$row['next_end_time'] = INF;
				foreach (explode (',', $row['gym_semaines']) AS $s) {
					$beg_time = mktime (
						$row['gym_heure'], $row['gym_minute'], 0,
						8, 3 + $s * 7 + $row['gym_jour'], $this->annee_debut // A partir du lundi suivant le 1er aout $annee_debut
					);
					$end_time = mktime (
						$row['gym_heure'] + $row['gym_duree_heures'] + 24 * $row['gym_duree_jours'],
						$row['gym_minute'],
						0, // Secondes
						8, 3 + $s * 7 + $row['gym_jour'], $this->annee_debut // Lundi suivant le 1er aout $annee_debut
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

			// Range les résultats dans l'ordre et le groupage espéré
			$liste [
				$this->request->variable('template', '') == 'horaires' ?
					$row['gym_jour'] // Horaires
				:
					$row['first_gym_ordre_menu'].'*'. // Menu
					$row['next_beg_time'].'*'. // Actualité
					$row['topic_id'] // Pour séparer les topics dans les menus
			][
				$row['gym_ordre_menu'].'*'. // Horaires
				$row['horaire_debut'].'*'.
				$row['post_id'] // Pour séparer les exeaco
			] = array_change_key_case ($row, CASE_UPPER);
		}
		$this->db->sql_freeresult($result);

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