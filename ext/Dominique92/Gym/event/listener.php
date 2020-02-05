<?php
/**
 * @package Gym
 * @copyright (c) 2020 Dominique Cavailhez
 * @license http://opensource.org/licenses/gpl-2.0.php GNU General Public License v2
 *
 */

//TODO
// développer sous-activités et informations
// actualités (next de chaque)
// petit include de dates prochaines actualités
// horaires avec filtre (dans les 3 mois)
// CSS renommer boutons / enlever ce qui ne sert pas (sondages, ...)
// ne pas afficher l'icone edit si pas modérateur
// retour aprés modif à la page qui l'a demandé

//// List template vars : phpbb/template/context.php line 135

/** CONFIG
PERSONNALISER / extension gym
MESSAGES / Paramètres des fichiers joints / taille téléchargements
MESSAGES / Gérer les groupes d’extensions des fichiers joints / +Documents -Archives
MESSAGES / BBCodes / cocher afficher
	[titre-gris]{TEXT}[/titre-gris] / <div class="post-titre-gris">{TEXT}</div>
	[bandeau-vert]{TEXT}[/bandeau-vert] / <div class="post-bandeau-vert">{TEXT}</div>
	[texte-vert]{TEXT}[/texte-vert] / <div class="post-texte-vert">{TEXT}</div>
	[carte]{TEXT}[/carte] / <div class="carte">{TEXT}</div>
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
		\phpbb\auth\auth $auth
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->auth = $auth;
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

			// Viewtopic
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.modify_submit_notification_data' => 'modify_submit_notification_data',
		];
	}

	/**
		ALL
	*/
	function page_footer_after() {
		// Assigne les paramètres de l'URL aux variables template
		$this->request->enable_super_globals();
		foreach ($_GET AS $k=>$v)
			$this->template->assign_var (strtoupper ("get_$k"), $v);
		$this->request->disable_super_globals();

		// Change le template pour les requettes ajax en particulier
		//TODO generaliser : lire get_filename_from_handle) | retrieve_var / vérifier fichier
		$template = $this->request->variable('template', '');
		if ($template)
			$this->template->set_filenames([
				'body' => "@Dominique92_Gym/$template.html",
			]);
		elseif ($this->template->retrieve_var('SCRIPT_NAME') == 'index')
			$this->template->set_filenames([
				'body' => "@Dominique92_Gym/index.html",
			]);

		// Includes language files for this extension
		$ns = explode ('\\', __NAMESPACE__);
		$this->user->add_lang_ext($ns[0].'/'.$ns[1], 'common');

		// Dictionaries depending on database content
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

		// Add horaires template data
		$static_values = $this->listes();
		$this->get_horaire();
		ksort ($this->horaires);
		foreach ($this->horaires AS $jour=>$j) {
			$jour_literal = $static_values['jours'][$jour ?: 0];
			$this->template->assign_block_vars('horaires', ['JOUR' => $jour_literal]);
			ksort ($j);
			foreach ($j AS $heure=>$rows)
				foreach ($rows AS $row) // S'il y a plusieurs activités à la même heure
					$this->template->assign_block_vars('horaires.activite', array_change_key_case ($row, CASE_UPPER));
		}
	}

	/**
		VIEWTOPIC.PHP
	*/
	function viewtopic_modify_post_row($vars) {
		$post_row = $vars['post_row'];
		$post_id = $post_row['POST_ID'];

		// Ajoute les informations spéciales calculées par get_horaire() à chaque post
		$this->get_horaire();
		if ($this->horaires_row[$post_id]) {
			$horaires_row = array_change_key_case ($this->horaires_row[$post_id], CASE_UPPER);
			$post_row = array_merge($post_row, $horaires_row);
		}

		$vars['post_row'] = $post_row;
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
						'BASE' => in_array ($vk, $data["gym_$k"] ?: []),
					]
				);

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

	// Call when validating the data to be saved
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

			//TODO protéger l'accès à ces fichiers
			//TODO sav avec les balises !
			$file_name = 'LOG/'.$post_data['post_id'].'.txt';
			if (!$create_if_null || !file_exists($file_name))
				file_put_contents ($file_name, implode ("\n", $to_save)."\n\n", FILE_APPEND);

			$this->request->disable_super_globals();
		}
	}

	/**
		COMMON FUNCTIONS
	*/
	function listes() {
		return [
			'intensites' => ['?','douce','modérée','moyenne','soutenue','cardio'],
			'heures' => [0,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22],
			'minutes' => ['00','05',10,15,20,25,30,35,40,45,45,50,55],
			'jours' => ['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'],
			'semaines' => [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,
				23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43],
			'duree' => [1,1.5,2,7.5],
		];
	}

	function get_horaire() {
		if (!$this->horaires) {
			$static_values = $this->listes();
			$sql = "SELECT post.post_id, post.post_subject AS activite,
				ca.post_subject AS categorie,
				li.post_subject AS lieu,
				an.post_subject AS animateur,
				post.gym_categorie, post.gym_intensite, post.gym_lieu, post.gym_animateur,
				post.gym_jour, post.gym_heure, post.gym_minute, post.gym_duree,
				post.gym_scolaire, post.gym_semaines,
				post.gym_actualites, post.gym_horaires
				FROM ".POSTS_TABLE." AS post
					LEFT JOIN  ".POSTS_TABLE." AS ca on (post.gym_categorie = ca.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS li on (post.gym_lieu = li.post_id)
					LEFT JOIN  ".POSTS_TABLE." AS an on (post.gym_animateur = an.post_id)
				WHERE post.topic_id = 1 AND
					post.gym_horaires = 'on'";
			$result = $this->db->sql_query($sql);
			while ($row = $this->db->sql_fetchrow($result)) {
				$row['activite'] = str_replace ('§', '<br/>', $row['activite']);
				if ($row['gym_intensite']) {
					$row['intensite'] = $static_values['intensites'][$row['gym_intensite']];
					$row['activite'] .= ' - intensité '.$row['intensite'];
				}
				$row['gym_heure'] = intval ($row['gym_heure']);
				$row['gym_minute'] = intval ($row['gym_minute']);
				$mm = $row['gym_minute'] + $row['gym_duree'] * 60;
				$hh = $row['gym_heure'] + floor ($mm / 60);
				$mm = $mm % 60;
				if ($row['gym_minute'] < 10)
					$row['gym_minute'] = '0'.$row['gym_minute'];
				if ($mm < 10)
					$mm = '0'.$mm;
				if ($row['gym_heure'] < 10)
					$row['gym_heure'] = '0'.$row['gym_heure'];
				if ($hh < 10)
					$hh = '0'.$hh;
				$row['horaires'] = $row['gym_heure'].':'.$row['gym_minute'];
				if ($hh < 24)
					$row['horaires'] .= " - $hh:$mm";
				$row['jour'] = $static_values['jours'][$row['gym_jour']];

				$this->horaires[$row ['gym_jour']][$row ['gym_heure']*24+$row ['gym_minute']][] = $row;

				// Mem it for any listener usage
				$this->horaires_row[$row['post_id']] = $row;
			}
			$this->db->sql_freeresult($result);
		}
	}
}
