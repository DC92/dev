<?php
/**
 * EPGV specific functions & style for the phpBB Forum
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */

//horaires < 600 px large !! responsive
// retour modif d'un horaire revient à l'accueil
// pas de lien dans le tableau horaire => #pid !!
//BUG horaires d'un cours liste tout
//BUG Paul bert l'image chevauche le texte
//BUG actualité texte en gras si pas dominique
//BUG double sous menu accueil
//TODO ne pas afficher présentation et actualité dans les pages index#123

//TODO ?? insérer sous menu "choix activité"
//TODO BBCode inclure la liste des activités
//TODO retrouver les posts non publiés
//TODO style print
//APRES enlever le .robot et faire un SEO

// List template vars : phpbb/template/context.php line 135
//echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($ref,true).'</pre>';

/** CONFIG
PERSONNALISER / extension gym
MEMBRES ET GROUPES / Permissions des groupes / Utilisateurs enregistrés / Permissions avancées / Panneau de l'utilisateur / Peut modifier son nom d’utilisateur
GENERAL / Fonctionnalités du forum / Autoriser les changements de nom d’utilisateur
GENERAL / Paramètres des messages / Messages par page : 99
MESSAGES / Paramètres des fichiers joints / taille téléchargements
MESSAGES / Gérer les groupes d’extensions des fichiers joints / +Documents -Archives
MESSAGES / BBCodes / cocher afficher
	[titre-gris]{TEXT}[/titre-gris] / <div class="titre-gris">{TEXT}</div> / Applique un style
	[bandeau-vert]{TEXT}[/bandeau-vert] / <div class="bandeau-vert">{TEXT}</div> / Applique un style
	[texte-vert]{TEXT}[/texte-vert] / <div class="texte-vert">{TEXT}</div> / Applique un style
	[image-droite]{TEXT}[/image-droite] / <div class="image-droite">{TEXT}</div> / Affiche une image à droite
	[image-gauche]{TEXT}[/image-gauche] / <div class="image-gauche">{TEXT}</div> / Affiche une image à gauche

	[carte]{TEXT}[/carte] / <br style="clear:both" /><div class="carte">{TEXT}</div> / Insére une carte [carte]longitude, latitude[/carte]
	[resume]{TEXT}[/resume] / <!-- resume -->{TEXT}<!-- emuser --> / Résumé pour les actualités
	[include]{TEXT}[/include] / <div class="include">{TEXT}</div>

//TODO DELETE remplacer par include
	[activites][/activites] / <div class="include">?template=activites</div> / Affiche la liste des seances par activité
	[calendrier][/calendrier] / <div class="include">?template=calendrier&id=POST_ID</div> / Affiche un calendrier
	[horaires]{TEXT}[/horaires] / <div class="include">.?template=horaires&{TEXT}=POST_SUBJECT</div> / Affiche des horaires
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
		$this->ext_path = 'ext/'.$ns[0].'/'.$ns[1].'/';
		$template->set_style([
			$this->ext_path.'styles',
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
			'core.page_footer_after' => 'page_footer_after',

			// Index
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_modify_page_title' => 'viewtopic_modify_page_title',
			'core.viewtopic_modify_post_data' => 'viewtopic_modify_post_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.posting_modify_submit_post_after' => 'posting_modify_submit_post_after',
		];
	}

	/**
		ALL
	*/
	function page_footer_after() {
		$this->template->assign_var ('EXT_PATH', $this->ext_path);

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
			$this->my_template = "@Dominique92_Gym/$template.html";

		if ($this->my_template)
			$this->template->set_filenames([
				'body' => $this->my_template,
			]);
	}

	/**
		INDEX.PHP
	*/
	function index_modify_page_title() {
		$this->liste_fiches (
			$assign = 'menu', [
				'post.post_id=t.topic_first_post_id',
				'post.gym_menu="on"',
			],
			'gym_menu','gym_ordre_menu'
		);

		$this->liste_fiches (
			$assign = 'presentation', [
				'post.gym_presentation="on"',
			],
			'gym_presentation','gym_ordre_menu'
		);

		$this->liste_fiches (
			$assign = 'actualites', [
				'post.gym_actualites="on"',
			],
			'next_end_time','next_beg_time'
		);

		$this->liste_fiches (
			$assign = 'horaires', [
				'post.gym_horaires="on"',
			],
			'gym_jour','horaire_debut'
		);

return;
		// Popule le menu et sous-menu
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

		$this->liste_fiches ('presentation', 'presentation');
		$this->liste_fiches ($this->request->variable ('template', 'actualites'));
	}

	/**
		VIEWTOPIC.PHP
	*/
	function viewtopic_modify_page_title($vars) {
		if ($vars['forum_id'] == 2)
			$this->my_template = 'index_body.html';

		$this->liste_fiches (
			$assign = 'menu', [
				'post.post_id=t.topic_first_post_id',
				'post.gym_menu="on"',
			],
			'gym_menu','gym_ordre_menu'
		);
	}

	function viewtopic_modify_post_data($vars) {
return;
		$rowset = $vars['rowset'];
		$first_post_id = $vars['topic_data']['topic_first_post_id'];

		// Ajoute les BBCodes du premier post à tous les autres
		// Need to take the first post from the base if there are more tnan 10 posts in the topic
		$sql = 'SELECT post_text FROM '.POSTS_TABLE.' WHERE post_id = '.$first_post_id;
		$result = $this->db->sql_query($sql);
		$row = $this->db->sql_fetchrow($result);
		$this->db->sql_freeresult($result);
		preg_match_all ('/<HORAIRES.+\/HORAIRES>/', $row['post_text'], $bbcodes);
		foreach ($rowset AS $k=>$v) {
			if ($bbcodes && $first_post_id != $v['post_id'])
				$rowset[$k]['post_text'] = '<r>'.str_replace(['<r>','</r>'],'',$v['post_text']).implode ('', $bbcodes[0]).'</r>';
		}

		$vars['rowset'] = $rowset;
	}

	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];

		// Couleur du sous-menu
		$post_row['COULEUR'] = $this->couleur();

//return;
//		$post_id = $post_row['POST_ID'];

		// Remplace dans le texte du message {VARIABLE_POST_TEMPLATE} par sa valeur
		//TODO traiter /g pour plusieurs remplacements
		$this->post_row = $post_row;
//TODO ???		$post_row['RESUME'] = $vars['row']['resume'];
		$post_row['MESSAGE'] = preg_replace_callback(
			'/([A-Z_]+)/',
			function ($matches) {
				$r = $this->post_row[$matches[1]];
				return urlencode ($r ? $r : $matches[1]);
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

		// To prevent an empty title to invalidate the full page and input.
		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'Nom';

		// Set specific variables
		foreach ($vars['post_data'] AS $k=>$v)
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

		// Dictionnaires en fonction du contenu de la base de données
		//TODO importer seulement activités, lieux, animateurs
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

		$this->liste_fiches (
			$assign = $vars['mode'] == 'edit' ? 'calendrier' : 'new', [
				'post.gym_horaires="on"',
				'post.post_id='.$post_data['post_id'],
			],
			'',''
		);

		// Create a log file with the existing data if there is none
		$this->save_post_data($post_data, $vars['message_parser']->attachment_data, $post_data, true);
	}

	// Called during validation of the data to be saved
	function submit_post_modify_sql_data($vars) {
return;
		$sql_data = $vars['sql_data'];

		// Get special columns list
		$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "gym_%"';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
//			$special_columns[$row['Field']] = $row['Type'];
			$sql_data[POSTS_TABLE]['sql'][$row['Field']] = 'off'; // Default field value
		}
		$this->db->sql_freeresult($result);

		// Treat specific data
		$this->request->enable_super_globals(); // Allow access to $_POST & $_SERVER
		foreach ($_POST AS $k=>$v)
			if (!strncmp ($k, 'gym', 3)) {
				// Create the column if none
/*				if(!isset($special_columns[$k])){
					$sql = 'ALTER TABLE '.POSTS_TABLE." ADD $k varchar(255)";
					$this->db->sql_query($sql);
				}*/
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
return;
		$this->save_post_data($vars['data_ary'], $vars['data_ary']['attachment_data'], $this->modifs);
	}
	// Keep trace of values prior to modifications
	//TODO test
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
			file_put_contents ('LOG/index.html', '');

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
return;
		if ($vars['post_data']['forum_name'] == 'Configuration')
			$vars['redirect_url'] = './index.php#'.$vars['post_id'];
	}

	/**
		FUNCTIONS
	*/
	function couleur(
		$luminance = 170, // on 255
		$saturation = 80, // on 128
		$increment = 1.8
	) {
		$this->angle_couleur += $increment;
		$couleur = '#';
		for ($angle = 0; $angle < 6; $angle += M_PI * 0.66)
			$couleur .= dechex($luminance + $saturation * sin ($this->angle_couleur + $angle));
		return $couleur;
	}

	function listes() {
		return [
			'intensites' => ['?','douce','modérée','moyenne','soutenue','cardio'],
			'heures' => [0,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
			'minutes' => ['00','05',10,15,20,25,30,35,40,45,45,50,55],
			'jours' => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
			// Numéros depuis le dimanche suivant le 1er aout (commence à 0)
			'semaines' => [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,
				23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47],
			'duree' => [1,1.5,2,7.5],
		];
	}

	// Popule les templates horaires, calendrier, actualité
	function liste_fiches($assign, $cond, $tri1, $tri2) {
		$static_values = $this->listes();
/*
		if ($template == 'horaires')
			$cond = ['post.gym_horaires="on"'];
		if ($template == 'calendrier')
			$cond = ['post.gym_horaires="on"'];
		if ($template == 'presentation')
			$cond = ['post.gym_presentation="on"'];
		if ($template == 'actualites')
			$cond = ['post.gym_actualites="on"'];
		if ($template == 'new')
			$cond = ['FALSE'];
		$post_id = $this->request->variable('p', '', true);
		if ($post_id)
			$cond[] = 'post.post_id='.$post_id;

		$nom = $this->request->variable('nom', '', true);
		if ($nom)
			$cond[] = 'post.post_subject="'.urldecode($nom).'"';

		$lieu = $this->request->variable('lieu', '', true);
		if ($lieu)
			$cond[] = 'li.post_subject="'.urldecode($lieu).'"';

		$animateur = $this->request->variable('animateur', '', true);
		if ($animateur)
			$cond[] = 'an.post_subject="'.urldecode($animateur).'"';

		$activite = $this->request->variable('activite', '', true);
		if ($activite)
			$cond[] = 'ac.post_subject="'.urldecode($activite).'"';
*/
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($cond,true).'</pre>';

		if ($cond) {
			// Récupère la table de tous les attachements
			$sql = 'SELECT * FROM '. ATTACHMENTS_TABLE .' ORDER BY attach_id DESC, post_msg_id ASC';
			$result = $this->db->sql_query($sql);
			$attachments = $update_count_ary = [];
			while ($row = $this->db->sql_fetchrow($result))
				$attachments[$row['post_msg_id']][] = $row;
			$this->db->sql_freeresult($result);

			$sql = "SELECT post.post_id, t.topic_id, t.forum_id,
				post.post_subject AS nom,
				post.post_text, post.bbcode_uid, post.bbcode_bitfield,
				li.post_subject AS lieu,
				an.post_subject AS animateur,
				ac.post_subject AS activite,
				post.gym_activite, post.gym_intensite, post.gym_lieu, post.gym_animateur,
				post.gym_jour, post.gym_heure, post.gym_minute, post.gym_duree_heures, post.gym_duree_jours,
				post.gym_scolaire, post.gym_semaines,
				post.gym_actualites, post.gym_horaires, post.gym_menu, post.gym_ordre_menu
				FROM ".POSTS_TABLE." AS post
					LEFT JOIN  ".POSTS_TABLE." AS ac on (post.gym_activite = ac.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS li on (post.gym_lieu = li.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS an on (post.gym_animateur = an.post_id)
					JOIN ".TOPICS_TABLE." AS t ON (post.topic_id = t.topic_id)
				WHERE ".implode(' AND ',$cond );
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($sql,true).'</pre>';

			$result = $this->db->sql_query($sql);
			while ($row = $this->db->sql_fetchrow($result)) {
//*DCMM*/$row['post_text'] = '';
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>ROW $assign = ".var_export($row,true).'</pre>';

				// BBCodes et attachements
				$display_text = generate_text_for_display(
					$row['post_text'],
					$row['bbcode_uid'], $row['bbcode_bitfield'],
					OPTION_FLAG_BBCODE + OPTION_FLAG_SMILIES + OPTION_FLAG_LINKS
				);
				if (!empty($attachments[$row['post_id']]))
					parse_attachments($row['forum_id'], $display_text, $attachments[$row['post_id']], $update_count_ary);

				// Extrait les résumés
				$expl = explode ('<!-- resume -->', $display_text);
				$resume = [];
				foreach ($expl AS $k=>$fragment)
					if ($k) { // Sauf le premier
						$frag_exp = explode ('<!-- emuser -->', $fragment);
						if (count ($frag_exp) > 1)
							$resume[] = $frag_exp[0];
					}
				$row['resume'] = count ($resume)
					? '<p>'.implode('</p><p>',$resume).'</p>'
					: '<p>'.$display_text.'</p>';

				// Paramètres spécifiques
				if ($row['gym_intensite']) {
					$row['intensite'] = $static_values['intensites'][$row['gym_intensite']];
					$row['seance'] .= ' - intensité '.$row['intensite'];
				}
				// Jour dans la semaine
				$row['gym_jour'] = intval ($row['gym_jour']);
				$row['gym_jour_literal'] = $static_values['jours'][$row['gym_jour']];
				// Temps début
				$row['gym_heure'] = intval ($row['gym_heure']);
				$row['gym_minute'] = intval ($row['gym_minute']);
				// Temps fin
				$row['gym_duree_heures'] = intval ($row['gym_duree_heures']);
				$row['gym_duree_jours'] = intval ($row['gym_duree_jours']);
				$row['gym_minute_fin'] = $row['gym_minute'] + $row['gym_duree_heures'] * 60 + $row['gym_duree_jours'] * 60 * 24;
				$row['gym_heure_fin'] = $row['gym_heure'] + floor ($row['gym_minute_fin'] / 60);
				$row['gym_minute_fin'] = $row['gym_minute_fin'] % 60;

				// Date
				if($row['gym_semaines'] && $row['gym_semaines'] != 'off') {
					setlocale(LC_ALL, 'fr_FR');
					$row['next_end_time'] = INF;
					$semaines = explode (',', $row['gym_semaines']);
					foreach ($semaines AS $s) {
//						$row["gym_semaine_$s"] = true;
						$beg_time = mktime(
							$gym_heure, $gym_minute,
							0, -4, // 1er aout
							$row['gym_jour'] + $s * 7 + 5,
							date('Y')
						);
						$end_time = mktime(
							$row['gym_heure_fin'], $row['gym_minute_fin'],
							0, -4, // 1er aout
							$row['gym_jour'] + $s * 7 + 5,
							date('Y')
						);
						// Garde le premier évènement qui finit après la date courante
						if ($end_time > time() && $end_time < $row['next_end_time']) {
							$row['next_beg_time'] = $beg_time;
							$row['next_end_time'] = $end_time;
							$row['date'] = ucfirst (
								str_replace ('  ', ' ',
								utf8_encode (
								strftime ('%A %e %B', $row['next_end_time'])
							)));
						}
					}
				}

				// Horaires
				$row['gym_heure'] = substr('00'.$row['gym_heure'], -2);
				$row['gym_minute'] = substr('00'.$row['gym_minute'], -2);
				$row['gym_heure_fin'] = substr('00'.$row['gym_heure_fin'], -2);
				$row['gym_minute_fin'] = substr('00'.$row['gym_minute_fin'], -2);
				$row['horaire_debut'] = $row['gym_heure'].':'.$row['gym_minute'];
				$row['horaire_fin'] = $row['gym_heure_fin'].':'.$row['gym_minute_fin'];
				$row['couleur'] = $this->couleur(208, 47);
				$row['couleur_bord'] = $this->couleur(128, 24, 0);

				// Range les résultats dans l'ordre et le groupage espéré
				$liste [$row[$tri1]] [$row[$tri2]] [] = array_change_key_case ($row, CASE_UPPER);

				// Tableau des semaines d'un calendrier
				$semaines = explode (',', $row['gym_semaines']);
				if (is_numeric($semaines[0]))
					foreach ($static_values['semaines'] AS $s) {
						$row['no'] = $s;
						$row['gym_in_calendrier'] = in_array ($s, $semaines) ? 1 : 0;
						$liste [$row[$tri1]] [$row[$tri2]] [] = array_change_key_case ($row, CASE_UPPER);
					}
			}

			// Template vide pour posting/création
			if ($assign == 'new')
				foreach ($static_values['semaines'] AS $s)
					$liste['new'][][] = [
						'NO' => $s,
						'POST_ID' => 0,
						'GYM_JOUR' => 0,
						'GYM_IN_CALENDRIER' => 0,
					];

			$this->db->sql_freeresult($result);
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>LISTE $assign = ".var_export($liste,true).'</pre>'; 

			if ($liste) {
				ksort ($liste);
				foreach ($liste AS $v) { // Tri du 1er niveau
					ksort ($v);
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export(array_values ($v)[0][0],true).'</pre>';
					$this->template->assign_block_vars($assign, array_values ($v)[0][0]); // La première pour avoir les valeurs générales
					foreach ($v AS $vv) // Tri du 2" niveau
						foreach ($vv AS $vvv) // S'il y a plusieurs séances à la même heure
							$this->template->assign_block_vars("$assign.item", $vvv);
				}
			}
		}
	}
}