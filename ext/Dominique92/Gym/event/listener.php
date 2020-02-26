<?php
/**
 * EPGV specific functions & style for the phpBB Forum
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

//BUG calendrier si plusieurs noms identique prend le premier => utiliser ID
//TODO BUG BBCode ne marche pas dans actualités / résumé
//TODO Inclusion actualités en page d'accueil chargée (pour référencement)
//TODO retrouver les posts non publiés
//TODO Mode d'emploi / FAQ pour moderateurs
//TODO style pas blanc de fond pour les horaires ??
//APRES enlever le .robot et faire un SEO
//APRES déactiver Dominique92/phpBB

// List template vars : phpbb/template/context.php line 135
//echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($ref,true).'</pre>';

/** CONFIG
PERSONNALISER / extension gym
MEMBRES ET GROUPES / Permissions des groupes / Utilisateurs enregistrés / Permissions avancées / Panneau de l'utilisateur / Peut modifier son nom d’utilisateur
GENERAL / Fonctionnalités du forum / Autoriser les changements de nom d’utilisateur
MESSAGES / Paramètres des fichiers joints / taille téléchargements
MESSAGES / Gérer les groupes d’extensions des fichiers joints / +Documents -Archives
MESSAGES / BBCodes / cocher afficher
	[activites][/activites] / <div class="include">?template=activites</div> / Affiche la liste des seances par activité
	[bandeau-vert]{TEXT}[/bandeau-vert] / <div class="bandeau-vert">{TEXT}</div> / Applique un style
	[calendrier]{TEXT}[/calendrier] / <div class="include">?template=calendrier&{TEXT}=POST_SUBJECT</div> / Affiche un calendrier
	[carte]{TEXT}[/carte] / <br style="clear:both" /><div class="carte">{TEXT}</div> / Insére une carte [carte]longitude, latitude[/carte]
	[droite]{TEXT}[/droite] / <div class="image-droite">{TEXT}</div> / Affiche une image à droite
	[gauche]{TEXT}[/gauche] / <div class="image-gauche">{TEXT}</div> / Affiche une image à gauche
	[horaires]{TEXT}[/horaires] / <div class="include">?template=horaires&{TEXT}=POST_SUBJECT</div> / Affiche des horaires
	[include]{TEXT}[/include] / <div class="include">{TEXT}</div>
	[resume]{TEXT}[/resume] / {TEXT} / Résumé pour la page d'actualité
	[texte-vert]{TEXT}[/texte-vert] / <div class="texte-vert">{TEXT}</div> / Applique un style
	[titre-gris]{TEXT}[/titre-gris] / <div class="titre-gris">{TEXT}</div> / Applique un style
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
		$this->language = $language;

		// Includes language and style files of this extension
		$ns = explode ('\\', __NAMESPACE__);
		$this->language->add_lang('common', $ns[0].'/'.$ns[1]);
		$template->set_style([
			'ext/'.$ns[0].'/'.$ns[1].'/styles',
			'styles', // core styles
		]);
	}

	// List of hooks and related functions
	// We find the calling point by searching in the software of PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		// For debug, Varnish will not be caching pages where you are setting a cookie
		if (defined('TRACES_DOM'))
			setcookie('disable-varnish', microtime(true), time()+600, '/');

		return [
			// All
			'core.page_footer_after' => 'all',

			// Index
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_modify_post_data' => 'viewtopic_modify_post_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_submit_post_after' => 'posting_modify_submit_post_after',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
		];
	}

	/**
		ALL
	*/
	function all() {
		// Assigne les paramètres de l'URL aux variables template
		$this->request->enable_super_globals();
		$get = $_GET;
		$server = $_SERVER;
		$this->request->disable_super_globals();
		foreach ($get AS $k=>$v)
			$this->template->assign_var (strtoupper ("get_$k"), $v);

		// Change le template sur demande
		$template = $this->request->variable('template', '');
		if ($template)
			$this->template->set_filenames([
				'body' => "@Dominique92_Gym/$template.html",
			]);

		// Dictionaries depending on the database content
		$sql = "SELECT topic_title, post_id, post_subject
			FROM ".POSTS_TABLE."
			JOIN ".TOPICS_TABLE." USING (topic_id)
			WHERE post_id != topic_first_post_id";
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$values [$row['topic_title']][$row['post_subject']] = $row;
		$this->db->sql_freeresult($result);

		setlocale(LC_ALL, 'fr_FR');
		foreach ($values AS $k=>$v) {
			$kk = 'liste_'.strtolower (iconv ('UTF-8','ASCII//TRANSLIT', ($k)));
			ksort ($v);
			foreach ($v AS $vk=>$vv)
				$this->template->assign_block_vars ($kk, array_change_key_case ($vv, CASE_UPPER));
		}

		// Add horaires to template data
		$get['horaires'] = 'on'; // Use arguments _GET &sujet=XXX
		$seances = $this->get_seances($get);

		foreach ($seances AS $row)
			$horaires[$row ['gym_jour']][$row ['gym_heure']*24+$row ['gym_minute']][] = $row;

		if ($horaires) {
			$static_values = $this->listes();
			ksort ($horaires);
			foreach ($horaires AS $jour=>$j) {
				$jour_literal = $static_values['jours'][$jour ?: 0];
				$this->template->assign_block_vars('horaires', ['JOUR' => $jour_literal]);
				ksort ($j);
				foreach ($j AS $heure=>$rows)
					foreach ($rows AS $row) // S'il y a plusieurs séances à la même heure
						$this->template->assign_block_vars('horaires.seance', array_change_key_case ($row, CASE_UPPER));
			}
		}

		// Add seances par activités
		$nb_lignes = 0;
		foreach ($seances AS $row)
			if ($row['activite']) {
				$colonne = substr('000'.$row['activite_ordre'],-3).substr('000'.$row['gym_activite'],-3);
				$activites[$colonne][] = $row;
				$nb_lignes = max ($nb_lignes, count ($activites[$colonne]));
			}
		if ($activites) {
			ksort ($activites);

			// Titres
			$this->template->assign_block_vars('activites', []);
			foreach ($activites AS $ordre => $lignes)
				$this->template->assign_block_vars('activites.seance', [
					'NOM' => $lignes[0]['activite'],
					'POST_ID' => $lignes[0]['gym_activite'],
				]);

			// Autant de lignes qu'il faut pour les seances de chaque activité
			for ($ligne = 0; $ligne < $nb_lignes; $ligne++) {
				$this->template->assign_block_vars('activites', []);
				foreach ($activites AS $ordre => $lignes) {
					$case = [];
					foreach ($lignes AS $l => $row)
						if ($l == $ligne)
							$case = $row;
					$this->template->assign_block_vars('activites.seance', array_change_key_case ($case, CASE_UPPER));
				}
			}
		}

		// Add calendrier to template data
		foreach ($seances AS $row)
			if ($row['nom'] == $get['sujet'])
				$this->set_specific_vars ($row);

		// Add actualites to template data
		$seances = $this->get_seances([
			'actualites' => 'on',
		]);
		usort ($seances, function($a, $b){
			return $this->tri_next_beg_time ($a, $b);
		});
		foreach ($seances AS $row) 
			if($row['date'])
				$this->template->assign_block_vars('actualites', array_change_key_case ($row, CASE_UPPER));
	}

	function tri_next_beg_time($a, $b) {
		return $a['next_beg_time'] - $b['next_beg_time'];
	}

	function set_specific_vars($post_data) {
		// Set specific variables
		foreach ($post_data AS $k=>$v)
			if (!strncmp ($k, 'gym', 3) && $v) {
				$this->template->assign_var (strtoupper ($k), $v);
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
	}

	function get_seances($arg = []) {
		$static_values = $this->listes();
		$seances = [];

		foreach ($arg AS $k=>$v)
			switch ($k) {
				case 'template';
					break;
				case 'menu';
				case 'horaires';
				case 'actualites';
					$cond[] = "post.gym_$k = '$v'";
					break;
				case 'activite';
				case 'lieu';
				case 'animateur';
					$cond[] = substr($k,0,2).'.post_subject="'.urldecode($v).'"';
					break;
				case 'sujet';
					$cond[] = 'post.post_subject="'.urldecode($v).'"';
			}

		$sql = "SELECT post.post_id, post.post_subject AS nom, post.post_text,
			ac.post_subject AS activite,
			ac.gym_ordre_menu AS activite_ordre,
			li.post_subject AS lieu,
			an.post_subject AS animateur,
			post.gym_activite, post.gym_intensite, post.gym_lieu, post.gym_animateur,
			post.gym_jour, post.gym_heure, post.gym_minute, post.gym_duree_heures, post.gym_duree_jours,
			post.gym_scolaire, post.gym_semaines,
			post.gym_actualites, post.gym_horaires, post.gym_menu
			FROM ".POSTS_TABLE." AS post
				LEFT JOIN  ".POSTS_TABLE." AS ac on (post.gym_activite = ac.post_id)
				LEFT JOIN  ".POSTS_TABLE." AS li on (post.gym_lieu = li.post_id)
				LEFT JOIN  ".POSTS_TABLE." AS an on (post.gym_animateur = an.post_id)";
		if ($cond)
			$sql .= " WHERE ".implode(' AND ',$cond );

		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			$row['seance'] = str_replace ('§', '<br/>', $row['seance']);
			if ($row['gym_intensite']) {
				$row['intensite'] = $static_values['intensites'][$row['gym_intensite']];
				$row['seance'] .= ' - intensité '.$row['intensite'];
			}
			// Jour dans la semaine
			$row['gym_jour_literal'] = $row['jour'] = $static_values['jours'][$row['gym_jour']];
			// Temps début
			$row['gym_heure'] = intval ($row['gym_heure']);
			$row['gym_minute'] = intval ($row['gym_minute']);
			// Temps fin
			$row['gym_duree_heures'] = intval ($row['gym_duree_heures']);
			$row['gym_duree_jours'] = intval ($row['gym_duree_jours']);
			$gym_minute_fin = $row['gym_minute'] + $row['gym_duree_heures'] * 60 + $row['gym_duree_jours'] * 60 * 24;
			$gym_heure_fin = $row['gym_heure'] + floor ($gym_minute_fin / 60);
			$gym_minute_fin = $gym_minute_fin % 60;

			// Date
			if($row['gym_semaines'] && $row['gym_semaines'] != 'off') {
				setlocale(LC_ALL, 'fr_FR');
				$row['next_end_time'] = INF;
				foreach (explode (',', $row['gym_semaines']) AS $semaine) {
					$beg_time = mktime(
						$gym_heure, $gym_minute,
						0, -4, // 1er septembre
						$row['gym_jour'] + $semaine * 7 + 5,
						date('Y')
					);
					$end_time = mktime(
						$gym_heure_fin, $gym_minute_fin,
						0, -4, // 1er septembre
						$row['gym_jour'] + $semaine * 7 + 5,
						date('Y')
					);
					// Garde le premier évènement qui finit après la date courante
					if ($end_time > time() && $end_time < $row['next_end_time']) {
						$row['next_beg_time'] = $beg_time;
						$row['next_end_time'] = $end_time;
						$row['date'] = ucfirst (str_replace ('  ', ' ', utf8_encode (strftime ('%A %e %B', $row['next_end_time']))));
					}
				}
			}

			// Horaires
			if ($row['gym_minute'] < 10)
				$row['gym_minute'] = '0'.$row['gym_minute'];
			if ($gym_minute_fin < 10)
				$gym_minute_fin = '0'.$gym_minute_fin;
			if ($row['gym_heure'] < 10)
				$row['gym_heure'] = '0'.$row['gym_heure'];
			if ($gym_heure_fin < 10)
				$gym_heure_fin = '0'.$gym_heure_fin;
			$row['horaire_debut'] = $row['gym_heure'].':'.$row['gym_minute'];
			$row['horaire_fin'] = $gym_heure_fin.':'.$gym_minute_fin;

			$seances[$row['post_id']] = $row;
		}
		$this->db->sql_freeresult($result);

		return $seances;
	}

	function listes() {
		return [
			'intensites' => ['?','douce','modérée','moyenne','soutenue','cardio'],
			'heures' => [0,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
			'minutes' => ['00','05',10,15,20,25,30,35,40,45,45,50,55],
			'jours' => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
			'semaines' => [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22, // A partir de 1er aout
				23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47],
			'duree' => [1,1.5,2,7.5],
		];
	}

	/**
		INDEX.PHP
	*/
	// Popule le menu et sous-menu
	function index_modify_page_title() {
		$sql = "
			SELECT p.post_id, p.post_subject, t.topic_id, t.topic_title, t.topic_first_post_id,
				p.gym_ordre_menu, first.gym_ordre_menu AS first_ordre_gym_menu
			FROM ".POSTS_TABLE." AS p
			JOIN ".TOPICS_TABLE." AS t ON (t.topic_id = p.topic_id)
			LEFT JOIN ".POSTS_TABLE." AS first ON (first.post_id = t.topic_first_post_id)
			WHERE p.gym_menu = 'on'";
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			foreach ($row AS $k=>$v)
				$row["norm_$k"] = substr("000$v", -3);
			$menu [$row['topic_id']] [] = array_change_key_case ($row, CASE_UPPER);
		}
		$this->db->sql_freeresult($result);

		foreach ($menu AS $titre=>$v) {
			$v[0] ['COUNT'] = count($v);
			$this->template->assign_block_vars('menu', $v[0]);
			foreach ($v AS $vv)
				$this->template->assign_block_vars('menu.sous_menu', $vv);
		}
	}

	/**
		VIEWTOPIC.PHP
	*/
	function viewtopic_modify_post_data($vars) {
		$rowset = $vars['rowset'];
		$first_post_id = $vars['topic_data']['topic_first_post_id'];

		// Need to take the first post from the base if there are more tnan 10 posts in the topic
		$sql = 'SELECT post_text FROM '.POSTS_TABLE.' WHERE post_id = '.$first_post_id;
		$result = $this->db->sql_query($sql);
		$row = $this->db->sql_fetchrow($result);
		$this->db->sql_freeresult($result);
		preg_match_all ('/<HORAIRES.+\/HORAIRES>/', $row['post_text'], $bbcodes);

		foreach ($rowset AS $k=>$v) {
			// Ajoute les BBCodes du premier post à tous les autres
			if ($bbcodes && $first_post_id != $v['post_id'])
				$rowset[$k]['post_text'] = '<r>'.str_replace(['<r>','</r>'],'',$v['post_text']).implode ('', $bbcodes[0]).'</r>';

			// Prépare un résumé pour les actualités
			preg_match ('/\[resume\]<\/s>(.+)<e>\[\/resume\]/', $v['post_text'], $bbcode_resume);
			$rowset[$k]['resume'] = count ($bbcode_resume)
				? $bbcode_resume[1]
				: $v['post_text'];
		}

		$vars['rowset'] = $rowset;
	}

	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];
		$post_id = $post_row['POST_ID'];

		// Remplace dans le texte du message {VARIABLE_POST_TEMPLATE} par sa valeur
		//TODO traiter /g pour plusieurs remplacements
		$this->post_row = $post_row;
		$post_row['RESUME'] = $vars['row']['resume'];
		$post_row['MESSAGE'] = preg_replace_callback(
			'/([A-Z_]+)/',
			function ($matches) {
				$r = $this->post_row[$matches[1]];
				return urlencode ($r ? $r : $matches[1]);
			},
			$post_row['MESSAGE']
		);

		// Ajoute les informations spéciales calculées par get_seances() à chaque post
		if (!isset ($this->vwt_seances))
			$this->vwt_seances = $this->get_seances();

		if ($this->vwt_seances[$post_id])
			$post_row = array_merge($post_row, array_change_key_case ($this->vwt_seances[$post_id], CASE_UPPER));

		$vars['post_row'] = $post_row;
	}

	/**
		POSTING.PHP
	*/
	// Called when validating the data to be saved
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];

		// Get special columns list
		$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "gym_%"';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			$special_columns[$row['Field']] = $row['Type'];
			$sql_data[POSTS_TABLE]['sql'][$row['Field']] = 'off'; // Default field value
		}
		$this->db->sql_freeresult($result);

		// Treat specific data
		$this->request->enable_super_globals(); // Allow access to $_POST & $_SERVER
		foreach ($_POST AS $k=>$v)
			if (!strncmp ($k, 'gym', 3)) {
				// Create the column if none
				if(!isset($special_columns[$k])){
					$sql = 'ALTER TABLE '.POSTS_TABLE." ADD $k varchar(255)";
					$this->db->sql_query($sql);
				}
				if(is_array($v))
					$v = implode (',', $v);

				// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
				$sql_data[POSTS_TABLE]['sql'][$k] = utf8_normalize_nfc($v) ?: null; // null allows the deletion of the field
			}
		$this->request->disable_super_globals();

		$vars['sql_data'] = $sql_data; // return data
		$this->modifs = $sql_data[POSTS_TABLE]['sql']; // Save change
//		$this->modifs['geojson'] = str_replace (['ST_GeomFromGeoJSON(\'','\')'], '', $this->modifs['geom']);
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

			if (!is_dir('LOG'))
				mkdir('LOG');

			$file_name = 'LOG/'.$post_data['post_id'].'.txt';
			if (!$create_if_null || !file_exists($file_name))
				file_put_contents ($file_name, implode ("\n", $to_save)."\n\n", FILE_APPEND);

			$this->request->disable_super_globals();
		}
	}

	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		// Allows entering a POST with empty text
		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
	}

	// Return to index if end of config
	function posting_modify_submit_post_after($vars) {
		if ($vars['post_data']['forum_name'] == 'Configuration')
			$vars['redirect_url'] = './index.php#'.$vars['post_id'];
	}

	// Called when display post page
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

		// To prevent an empty title to invalidate the full page and input.
		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'Nom';

		// Create a log file with the existing data if there is none
		$this->save_post_data($post_data, $vars['message_parser']->attachment_data, $post_data, true);

		$this->set_specific_vars ($vars['post_data']);
	}
}