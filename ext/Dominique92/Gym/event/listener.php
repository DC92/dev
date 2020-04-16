<?php
/**
 * EPGV specific functions & style for the phpBB Forum
 *
 * @copyright (c) 2020 Dominique Cavailhez
 * @license GNU General Public License, version 2 (GPL-2.0)
 */


//cacher page mode d'emploi
//Extension pbpBB : Tableaux, Log edit posts
//TODO mettre une couleur de plus en plus soutenue selon le niveau de la gym 
//TODO style print
//BEST favicon en posting et autres pages non index
//BEST erradiquer f=2
//BEST template/event/posting_editor_subject_after.html : IF TOPIC_TITLE == 'Séances' or TOPIC_TITLE == 'Événements'
//APRES enlever le .robot et faire un SEO


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
	[horaires]{TEXT}[/horaires] / <div class="include">.?template=horaires&{TEXT}=POST_SUBJECT</div> / Affiche des horaires
	[calendrier]{TEXT}[/calendrier] / <div class="include">.?template=calendrier&{TEXT}=POST_SUBJECT</div> / Affiche un calendrier
	[include]{TEXT}[/include] / <div class="include">{TEXT}</div>
	[resume]{TEXT}[/resume] / <!-- resume -->{TEXT}<!-- emuser --> / Résumé pour les évenements
	[doc={TEXT1}]{TEXT2}[/doc] / <a href="download/file.php?id={TEXT1}">{TEXT2}</a> / Lien vers un document
	[page={TEXT1}]{TEXT2}[/page] / <a href="viewtopic.php?p={TEXT1}">{TEXT2}</a> / Lien vers une page
	[rubrique={TEXT1}]{TEXT2}[/rubrique] / <a href="viewtopic.php?t={TEXT1}">{TEXT2}</a> / Lien vers une runrique
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
			'core.viewtopic_gen_sort_selects_before' => 'viewtopic_gen_sort_selects_before',
			'core.viewtopic_modify_page_title' => 'viewtopic_modify_page_title',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Viewforum
			'core.viewforum_modify_topicrow' => 'viewforum_modify_topicrow',

			// Posting
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
		];
	}

	/**
		ALL
	*/
	function page_footer_after() {
		// Change le template sur demande
		$template = $this->request->variable('template', '');
		if ($template)
			$this->my_template = "@Dominique92_Gym/$template.html";

		if ($this->my_template)
			$this->template->set_filenames([
				'body' => $this->my_template,
			]);

		$this->template->assign_var ('EXT_PATH',$this->ext_path);

		// Assigne les paramètres de l'URL aux variables template
		$this->request->enable_super_globals();
		$get = $_GET;
		$server = $_SERVER;
		$this->request->disable_super_globals();
		foreach ($get AS $k=>$v)
			$this->template->assign_var (strtoupper ("get_$k"), $v);

		// Menu principal
		$this->liste_fiches (
			'menu', [
				'post.post_id=t.topic_first_post_id',
				'post.gym_menu="on"',
			],
			'gym_menu','gym_ordre_menu'
		);

		// Pour le BBCode [horaire]
		$this->liste_fiches (
			'horaires', [
				'post.gym_horaires="on"',
			],
			'gym_jour','horaire_debut'
		);

		// Pour le BBCode [calendrier]
		$this->liste_fiches ('calendrier', [], 'gym_jour','post_id');
	}

	/**
		INDEX.PHP
	*/
	function index_modify_page_title() {
		// Inclusions des données de la page d'acceuil
		$this->liste_fiches (
			'presentation', [
				'post.gym_presentation="on"',
			],
			'gym_presentation','gym_ordre_menu'
		);

		$this->liste_fiches (
			'evenements', [
				'post.gym_evenements="on"',
			],
			'next_end_time','next_beg_time'
		);
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Called before reading reads phpbb-posts SQL data
	function viewtopic_gen_sort_selects_before($vars) {
		// Tri des sous-menus dansle bon ordre
		$sort_by_sql = $vars['sort_by_sql'];

		$view = $this->request->variable('view', '');
		if (!$view)
			$sort_by_sql['t'] = array_merge (['p.gym_ordre_menu'],$sort_by_sql['t']);

		$vars['sort_by_sql'] = $sort_by_sql;
	}

	// Called during first pass on post data that reads phpbb-posts SQL data
	function viewtopic_post_rowset_data($vars) {
		//Stores post SQL data for further processing (viewtopic proceeds in 2 steps)
		$this->all_post_data[$vars['row']['post_id']] = $vars['row'];
	}

	// Appelé lors de la deuxième passe sur les données des posts qui prépare dans $post_row les données à afficher sur le post du template
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];

		$post_row['TOPIC_FIRST_POST_ID'] = $vars['topic_data']['topic_first_post_id'];
		$post_row['GYM_MENU'] = $this->all_post_data[$post_row['POST_ID']]['gym_menu'];
		$post_row['COULEUR'] = $this->couleur(); // Couleur du sous-menu

		// Remplace dans le texte du message VARIABLE_TEMPLATE par sa valeur
		$post_row['MESSAGE'] = preg_replace_callback(
			'/([A-Z_]+)/',
			function ($matches) use ($post_row) {
				$r = $post_row[$matches[1]];
				return $r ? $r : urlencode ($matches[1]);
			},
			$post_row['MESSAGE']
		);

		$vars['post_row'] = $post_row;
	}

	// Appelé juste avant d'afficher
	function viewtopic_modify_page_title($vars) {
		$view = $this->request->variable('view', '');
		if (!$view)
			$this->my_template = 'index_body.html';
	}

	/**
		VIEWFORUM.PHP
	*/
	function viewforum_modify_topicrow($vars) {
		// Permet la visualisation en vue forum pour l'édition du site
		$topic_row = $vars['topic_row'];
		$topic_row['U_VIEW_TOPIC'] .= '&view=forum';
		$vars['topic_row'] = $topic_row;
	}

	/**
		POSTING.PHP
	*/
	// Called when viewing the post page
	function posting_modify_template_vars($vars) {
		// Permet la visualisation en vue forum pour l'édition du site
		$page_data = $vars['page_data'];
		$page_data['U_VIEW_TOPIC'] .= '&view=forum';
		$vars['page_data'] = $page_data;

		$post_data = $vars['post_data'];

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
		$sql = "SELECT post_id, post_subject, topic_title
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

		//
		if ($vars['mode'] == 'reply') { // Template vide pour posting/création
			$liste = [];
			foreach ($static_values['semaines'] AS $s)
				$liste['new'][][] = [
					'NO' => $s,
					'POST_ID' => 0,
					'GYM_JOUR' => 0,
					'GYM_IN_CALENDRIER' => 0,
				];
			$this->liste_fiches (
				'calendrier', [],
				'','', $liste
			);
		} elseif ($post_data['post_id']) // Modification
			$this->liste_fiches (
				'calendrier', [
					'post.post_id='.$post_data['post_id'],
				],
				'',''
			);
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
		$this->request->enable_super_globals(); // Allow access to $_POST & $_SERVER
		foreach ($_POST AS $k=>$v)
			if (!strncmp ($k, 'gym', 3)) {
				if(is_array($v))
					$v = implode (',', $v);

				// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
				$sql_data[POSTS_TABLE]['sql'][$k] = utf8_normalize_nfc($v) ?: null; // null allows the deletion of the field
			}
		$this->request->disable_super_globals();

		$vars['sql_data'] = $sql_data; // return data
		$this->modifs = $sql_data[POSTS_TABLE]['sql']; // Save change
	}

	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		// Allows entering a POST with empty text
		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
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
			'intensites' => ['?','douce','modérée','moyenne','soutenue','cardio'],
			'heures' => [0,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
			'minutes' => ['00','05',10,15,20,25,30,35,40,45,45,50,55],
			'jours' => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
			// Numéros depuis le dimanche suivant le 1er aout (commence à 0)
			'semaines' => [4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,
				23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49],
			'duree' => [1,1.5,2,7.5],
		];
	}

	function verify_column($table, $columns) {
		foreach ($columns AS $column) {
			$sql = "SHOW columns FROM $table LIKE '$column'";
			$result = $this->db->sql_query($sql);
			$row = $this->db->sql_fetchrow($result);
			$this->db->sql_freeresult($result);
			if (!$row) {
				$sql = "ALTER TABLE $table ADD $column TEXT";
				$this->db->sql_query($sql);
			}
		}
	}

	// Popule les templates horaires, calendrier, actualité
	function liste_fiches($assign, $cond, $tri1, $tri2, $liste = []) {
		$this->verify_column(POSTS_TABLE, [
			'gym_activite',
			'gym_intensite',
			'gym_lieu',
			'gym_animateur',
			'gym_jour',
			'gym_heure',
			'gym_minute',
			'gym_duree_heures',
			'gym_duree_jours',
			'gym_scolaire',
			'gym_semaines',
			'gym_evenements',
			'gym_horaires',
			'gym_menu',
			'gym_ordre_menu',
			'gym_presentation',
		]);

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

		if ($cond) {
			$static_values = $this->listes();

			// Récupère la table de tous les attachements pour les inclusions BBCode
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
				post.gym_evenements, post.gym_horaires, post.gym_menu, post.gym_ordre_menu
				FROM ".POSTS_TABLE." AS post
					LEFT JOIN  ".POSTS_TABLE." AS ac on (post.gym_activite = ac.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS li on (post.gym_lieu = li.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS an on (post.gym_animateur = an.post_id)
					JOIN ".TOPICS_TABLE." AS t ON (post.topic_id = t.topic_id)
				WHERE ".implode(' AND ',$cond );

			$result = $this->db->sql_query($sql);
			while ($row = $this->db->sql_fetchrow($result)) {
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
				if (count ($resume))
					$row['resume'] = '<p>'.implode('</p><p>',$resume).'</p>';
				$row['display_text'] = $display_text;

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

				$row['couleur'] = $this->couleur();
				$row['couleur_fond'] = $this->couleur(35, 255, 0);
				$row['couleur_bord'] = $this->couleur(40, 196, 0);

				// Tableau des semaines d'un calendrier
				if ($assign == 'calendrier') {
					$semaines = explode (',', $row['gym_semaines']);
					foreach ($static_values['semaines'] AS $s) {
						$row['no'] = $s;
						$row['gym_in_calendrier'] = in_array ($s, $semaines) ? 1 : 0;
						$liste [$row[$tri1]] [$row[$tri2]] [] = array_change_key_case ($row, CASE_UPPER);
					}
				}
				//TODO BUG il y a quelque chose qui rajoute 2 fois la dernière semaine !!!

				// Range les résultats dans l'ordre et le groupage espéré
				$liste [$row[$tri1]] [$row[$tri2]] [] = array_change_key_case ($row, CASE_UPPER);
			}
			$this->db->sql_freeresult($result);
		}

		if ($liste) {
			ksort ($liste);
			foreach ($liste AS $v) { // Tri du 1er niveau
				ksort ($v);
				$this->template->assign_block_vars($assign, array_values ($v)[0][0]); // La première pour avoir les valeurs générales
				foreach ($v AS $vv) // Tri du 2" niveau
					foreach ($vv AS $vvv) // S'il y a plusieurs séances à la même heure
						$this->template->assign_block_vars("$assign.item", $vvv);
			}
		}
	}
}