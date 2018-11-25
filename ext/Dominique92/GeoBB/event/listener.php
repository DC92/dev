<?php
/**
 *
 * @package GeoBB
 * @copyright (c) 2016 Dominique Cavailhez
 * @license http://opensource.org/licenses/gpl-2.0.php GNU General Public License v2
 *
 */

namespace Dominique92\GeoBB\event;

if (!defined('IN_PHPBB'))
{
	exit;
}

use Symfony\Component\EventDispatcher\EventSubscriberInterface;

class listener implements EventSubscriberInterface
{
	public function __construct(
		\phpbb\db\driver\driver_interface $db,
		\phpbb\request\request_interface $request,
		\phpbb\template\template $template,
		\phpbb\user $user,
		\phpbb\auth\auth $auth,
		\phpbb\extension\manager $extension_manager,
		$root_path
	) {
		$this->db = $db;
		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
		$this->auth = $auth;
//TODO BEST		$this->extension_manager = $extension_manager;
//TODO BEST		$this->root_path = $root_path;
	}

	// Liste des hooks et des fonctions associées
	// On trouve le point d'appel en cherchant dans le logiciel de PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		return [
			// All
			'core.user_setup' => 'user_setup',
			'core.page_footer' => 'dump_template',

			// Index
			'core.display_forums_modify_row' => 'display_forums_modify_row',
			'core.index_modify_page_title' => 'index_modify_page_title',

			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',

			// Posting
			'core.modify_posting_parameters' => 'modify_posting_parameters',
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
		];
	}

	function dump_template() { // VISUALISATION VARIABLES TEMPLATE
//		ob_start();var_dump($this->template);echo'template = '.ob_get_clean();
	}

	function user_setup($vars) {
		// Inclue les fichiers langages de cette extension
		$ns = explode ('\\', __NAMESPACE__);
		$this->user->add_lang_ext($ns[0].'/'.$ns[1], 'common');

/*
		// On recherche les templates aussi dans l'extension
		$ext = $this->extension_manager->all_enabled();
		$ext[] = ''; // En dernier lieu, le style de base !
		foreach ($ext AS $k=>$v)
			$ext[$k] .= 'styles';
		$this->template->set_style($ext);
*/
	}

	function geobb_activate_map($forum_desc, $first_post = true) {
		global $geo_keys; // Private / defined in config.php

		preg_match ('/\[(first|all)=([a-z]+)\]/i', html_entity_decode ($forum_desc), $regle);
		switch (@$regle[1]) {
			case 'first': // Régle sur le premier post seulement
				if (!$first_post)
					break;

			case 'all': // Régle sur tous les posts
				$ns = explode ('\\', __NAMESPACE__);
				$this->template->assign_vars([
					'EXT_DIR' => 'ext/'.$ns[0].'/'.$ns[1].'/', // Répertoire de l'extension
					'GEO_MAP_TYPE' => $regle[2],
					'GEO_KEYS' => $geo_keys,
//					'STYLE_NAME' => $this->user->style['style_name'],
				]);
		}
	}

	/**
		INDEX.PHP
	*/
	// Ajoute un bouton créer un point en face de la liste des forums
	function display_forums_modify_row ($vars) {
		$row = $vars['row'];

		if ($this->auth->acl_get('f_post', $row['forum_id']) &&
			$row['forum_type'] == FORUM_POST)
			$row['forum_name'] .= ' &nbsp; '.
				'<a class="button" href="./posting.php?mode=post&f='.$row['forum_id'].'" title="Créer un nouveau sujet '.strtolower($row['forum_name']).'">Nouveau</a>';
		$vars['row'] = $row;
	}

	// Affiche les post les plus récents sur la page d'accueil
	function index_modify_page_title ($vars) {
		$this->geobb_activate_map('[all=accueil]');

		// More news count
		$news = request_var ('news', 20);
		$this->template->assign_var ('PLUS_NOUVELLES', $news * 2);

		// Display news
		$sql = "
			SELECT t.topic_id, topic_title,
				p.*, t.forum_id, forum_name, forum_image,
				topic_first_post_id, post_id, post_attachment, topic_posts_approved,
				username, poster_id, post_time
			FROM	 ".TOPICS_TABLE." AS t
				JOIN ".FORUMS_TABLE." AS f USING (forum_id)
				JOIN ".POSTS_TABLE ." AS p ON (p.post_id = t.topic_last_post_id)
				JOIN ".USERS_TABLE."  AS u ON (p.poster_id = u.user_id)
			WHERE post_visibility = ".ITEM_APPROVED."
			ORDER BY post_time DESC
			LIMIT ".$news;
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			if ($this->auth->acl_get('f_read', $row['forum_id'])) {
				$row ['post_time'] = '<span title="'.$this->user->format_date ($row['post_time']).'">'.date ('j M', $row['post_time']).'</span>';
				$row ['geo_massif'] = str_replace ('~', '', $row ['geo_massif']);
				$this->template->assign_block_vars('news', array_change_key_case ($row, CASE_UPPER));
			}
		$this->db->sql_freeresult($result);

		// Affiche un message de bienvenu dépendant du style pour ceux qui ne sont pas connectés
		// Le texte de ces messages sont dans les posts dont le titre est !style
		//$sql = "SELECT post_text,bbcode_uid,bbcode_bitfield FROM ".POSTS_TABLE." WHERE post_subject LIKE '!{$this->user->style['style_name']}'";
		$sql = 'SELECT post_text,bbcode_uid,bbcode_bitfield FROM '.POSTS_TABLE.' WHERE post_id = 1';
		$result = $this->db->sql_query($sql);
		$row = $this->db->sql_fetchrow($result);
		$this->template->assign_var ('GEO_PRESENTATION', generate_text_for_display($row['post_text'], $row['bbcode_uid'], $row['bbcode_bitfield'], OPTION_FLAG_BBCODE, true));
		$this->db->sql_freeresult($result);

/*//TODO DELETE injections SQL pour remetre le premier message

?????? => BOF !
INSERT INTO `phpbb_forums` (`forum_id`, `parent_id`, `left_id`, `right_id`, `forum_parents`, `forum_name`, `forum_desc`, `forum_desc_bitfield`, `forum_desc_options`, `forum_desc_uid`, `forum_link`, `forum_password`, `forum_style`, `forum_image`, `forum_rules`, `forum_rules_link`, `forum_rules_bitfield`, `forum_rules_options`, `forum_rules_uid`, `forum_topics_per_page`, `forum_type`, `forum_status`, `forum_last_post_id`, `forum_last_poster_id`, `forum_last_post_subject`, `forum_last_post_time`, `forum_last_poster_name`, `forum_last_poster_colour`, `forum_flags`, `display_on_index`, `enable_indexing`, `enable_icons`, `enable_prune`, `prune_next`, `prune_days`, `prune_viewed`, `prune_freq`, `display_subforum_list`, `forum_options`, `forum_posts_approved`, `forum_posts_unapproved`, `forum_posts_softdeleted`, `forum_topics_approved`, `forum_topics_unapproved`, `forum_topics_softdeleted`, `enable_shadow_prune`, `prune_shadow_days`, `prune_shadow_freq`, `prune_shadow_next`) VALUES
(1, 0, 1, 4, '', 'Votre première catégorie', '', '', 7, '', '', '', 0, '', '', '', '', 7, '', 0, 0, 0, 1, 2, '', 1543072163, 'Dominique', 'AA0000', 32, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 7, 1, 0),
(2, 1, 2, 3, '', 'Votre premier forum', 'Description de votre premier forum.', '', 7, '', '', '', 0, '', '', '', '', 7, '', 0, 1, 0, 1, 2, 'Bienvenue sur phpBB3', 1543072163, 'Dominique', 'AA0000', 48, 1, 1, 1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 0, 7, 1, 0);

INSERT INTO `phpbb_topics` (`topic_id`, `forum_id`, `icon_id`, `topic_attachment`, `topic_reported`, `topic_title`, `topic_poster`, `topic_time`, `topic_time_limit`, `topic_views`, `topic_status`, `topic_type`, `topic_first_post_id`, `topic_first_poster_name`, `topic_first_poster_colour`, `topic_last_post_id`, `topic_last_poster_id`, `topic_last_poster_name`, `topic_last_poster_colour`, `topic_last_post_subject`, `topic_last_post_time`, `topic_last_view_time`, `topic_moved_id`, `topic_bumped`, `topic_bumper`, `poll_title`, `poll_start`, `poll_length`, `poll_max_options`, `poll_last_vote`, `poll_vote_change`, `topic_visibility`, `topic_delete_time`, `topic_delete_reason`, `topic_delete_user`, `topic_posts_approved`, `topic_posts_unapproved`, `topic_posts_softdeleted`) VALUES
(1, 2, 0, 0, 0, 'Bienvenue sur phpBB3', 2, 1543072163, 0, 0, 0, 0, 1, 'Dominique', 'AA0000', 1, 2, 'Dominique', 'AA0000', 'Bienvenue sur phpBB3', 1543072163, 972086460, 0, 0, 0, '', 0, 0, 1, 0, 0, 1, 0, '', 0, 1, 0, 0);

INSERT INTO `phpbb_posts` (`post_id`, `topic_id`, `forum_id`, `poster_id`, `icon_id`, `poster_ip`, `post_time`, `post_reported`, `enable_bbcode`, `enable_smilies`, `enable_magic_url`, `enable_sig`, `post_username`, `post_subject`, `post_text`, `post_checksum`, `post_attachment`, `bbcode_bitfield`, `bbcode_uid`, `post_postcount`, `post_edit_time`, `post_edit_reason`, `post_edit_user`, `post_edit_count`, `post_edit_locked`, `post_visibility`, `post_delete_time`, `post_delete_reason`, `post_delete_user`) VALUES
(1, 1, 2, 2, 0, '::1', 1543072163, 0, 1, 1, 1, 1, '', 'Bienvenue sur phpBB3', 'Ceci est un exemple de message de votre installation phpBB3. Tout semble fonctionner. Vous pouvez si vous le voulez supprimer ce message et continuer à configurer votre forum. Durant le processus d’installation, votre première catégorie et votre premier forum sont assignés à un ensemble de permissions appropriées aux groupes d’utilisateurs que sont les administrateurs, les robots, les modérateurs globaux, les invités, les utilisateurs enregistrés et les utilisateurs COPPA enregistrés. Si vous choisissez de supprimer également votre première catégorie et votre premier forum, n’oubliez pas de régler les permissions de tous les groupes d’utilisateurs, pour toutes les nouvelles catégories et forums que vous allez créer. Il est recommandé de renommer votre première catégorie et votre premier forum et de copier leurs permissions sur chaque nouvelle catégorie et nouveau forum lors de leur création. Amusez-vous bien !', '5dd683b17f641daf84c040bfefc58ce9', 0, '', '', 1, 0, '', 0, 0, 0, 1, 0, '', 0);


*/
	}

	/**
		VIEWTOPIC.PHP
	*/
	// Appelé avant la requette SQL qui récupère les données des posts
	function viewtopic_get_post_data($vars) {
		// Insère la conversion du champ geom en format WKT dans la requette SQL
		$sql_ary = $vars['sql_ary'];
		$sql_ary['SELECT'] .= ',AsText(geom) AS geomwkt';
		$vars['sql_ary'] = $sql_ary;
	}

	// Appelé lors de la première passe sur les données des posts qui lit les données SQL de phpbb-posts
	function viewtopic_post_rowset_data($vars) {
		// Mémorise les données SQL du post pour traitement plus loin (viewtopic procède en 2 fois)
		$post_id = $vars['row']['post_id'];
		$this->post_data [$post_id] = $vars['row'];
	}

	// Appelé lors de la deuxième passe sur les données des posts qui prépare dans $post_row les données à afficher sur le post du template
	function viewtopic_modify_post_row($vars) {
		$post_id = $vars['row']['post_id'];
		$this->template->assign_var ('TOPIC_FIRST_POST_ID', $vars['topic_data']['topic_first_post_id']);
		$this->geobb_activate_map($vars['topic_data']['forum_desc']);

		// Search points included in a surface
		$sql = "
			SELECT p.*, t.topic_id, t.topic_title, f.forum_image
			FROM	 ".POSTS_TABLE ." AS p
				JOIN ".POSTS_TABLE ." AS v ON (v.post_id = $post_id)
				JOIN ".TOPICS_TABLE." AS t ON (t.topic_id = p.topic_id)
				JOIN ".FORUMS_TABLE." AS f ON (f.forum_id = p.forum_id)
			WHERE
				v.forum_id != p.forum_id AND
				Contains (v.geom, p.geom)
			";
		//TODO BEST en MySQL 5.7+, utiliser ST_Contains
		//TODO BEST ASPIR pour un point, trouver la zone qui le contient (ne marche pas pour alpages incluant le point)
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			$block = 'contains_'.basename ($row['forum_image'], '.png');
			$this->template->assign_block_vars($block, array_change_key_case ($row, CASE_UPPER));

			foreach ($row AS $k=>$v)
				if ($v && !strncmp ($k, 'geo_', 4) &&
					$k != 'geo_ign')
					$this->template->assign_block_vars ($block.'.point', array (
						'K' => ucfirst (str_replace (['geo_', '_'], ['', ' '], $k)),
						'V' => str_replace ('~', '', $v),
					));
		}
		$this->db->sql_freeresult($result);

		if (isset ($this->post_data [$post_id])) {
			$row = $this->post_data [$post_id]; // Récupère les données SQL du post 
			$post_row = $vars['post_row'];

			// Convert the geom info in geoJson format
			preg_match ('/\[(first|all)=([a-z]+)\]/i', $vars['topic_data']['forum_desc'], $regle);
			if (count ($regle) == 3 && (
					($regle[1] == 'all') ||
					($regle[1] == 'first' && ($row['post_id'] == $vars['topic_data']['topic_first_post_id']))
				) &&
				@$row['geomwkt']
			) {
				include_once('assets/geoPHP/geoPHP.inc');
				$geophp = \geoPHP::load($row['geomwkt'],'wkt');
				$row['geojson'] = $geophp->out('json');
				$this->get_bounds($geophp);
				$this->get_automatic_data($row);
			}

			foreach ($row AS $k=>$v)
				if (strstr ($k, 'geo')) {
				//TODO BEST [xxx=all] Assign the phpbb_posts.geo* SQL data of each template post area
/*
		// Assign the phpbb-posts SQL data to the template
		foreach ($post_data AS $k=>$v)
			if (!strncmp ($k, 'geo', 3)
				&& is_string ($v))
				$page_data[strtoupper ($k)] = strstr($v, '~') == '~' ? null : $v; // Clears fields ending with ~ for automatic recalculation
*/
					// Assign the phpbb_posts.geo* SQL data of the first post to the template
					if ($vars['topic_data']['topic_first_post_id'] == $row['post_id'])
						$this->template->assign_var (strtoupper ($k), str_replace ('~', '', $v));
				}

			$vars['post_row'] = $post_row;
		}
	}

	/*//TODO BEST geophp simplify : https://github.com/phayes/geoPHP/issues/24
    $oGeometry = geoPHP::load($sWkt,'wkt');    
    $reducedGeom = $oGeometry->simplify(1.5);
    $sWkt = $reducedGeom->out('wkt');Erradiquer geoPHP ? si SQL >= version 5.7 (inclue JSON) -> Phpbb 3.2
	*/
	function optim (&$g, $granularity) { // Fonction récursive d'optimisation d'un objet PHP contenant des objets géographiques
if(defined('TRACES_DOM'))/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export('optim',true).'</pre>';
/*
		if (isset ($g->geometries)) // On recurse sur les Collection, ...
			foreach ($g->geometries AS &$gs)
				$this->optim ($gs, $granularity);

		if (isset ($g->features)) // On recurse sur les Feature, ...
			foreach ($g->features AS &$fs)
				$this->optim ($fs, $granularity);

		if (preg_match ('/multi/i', $g->type)) {
			foreach ($g->coordinates AS &$gs)
				$this->optim_coordinate_array ($gs, $granularity);
		} elseif (isset ($g->coordinates)) // On a trouvé une liste de coordonnées à optimiser
			$this->optim_coordinate_array ($g->coordinates, $granularity);
*/
	}
	function optim_coordinate_array (&$cs, $granularity) { // Fonction d'optimisation d'un tableau de coordonnées
if(defined('TRACES_DOM'))/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export('optim_coordinate_array',true).'</pre>';
/*
		if (count ($cs) > 2) { // Pour éviter les "Points" et "Poly" à 2 points
			$p = $cs[0]; // On positionne le point de référence de mesure de distance à une extrémité
			$r = []; // La liste de coordonnées optimisées
			foreach ($cs AS $k=>$v)
				if (!$k || // On garde la première extrémité
					$k == count ($cs) - 1) // Et la dernière
					$r[] = $v;
				elseif (hypot ($v[0] - $p[0], $v[1] - $p[1]) > $granularity)
					$r[] = // On copie ce point
					$p = // On repositionne le point de référence
						$v;
			$cs = $r; // On écrase l'ancienne
		}
*/
	}

	// Calcul des données automatiques
	function get_automatic_data(&$row) {
		$update = []; // Datas to be updated

		// Calcul du centre pour toutes les actions
		include_once('assets/geoPHP/geoPHP.inc');
		$geophp = \geoPHP::load($row['geomwkt'],'wkt');
		$centre = $geophp->getCentroid()->coords;

		// Calcul de la surface en ha avec geoPHP
		if (array_key_exists ('geo_surface', $row) && !$row['geo_surface']) {
			$update['geo_surface'] =
				round ($geophp->getArea()
					* 1111 // hm par ° delta latitude
					* 1111 * sin ($centre[1] * M_PI / 180) // hm par ° delta longitude
				);
		}

		// Calcul de l'altitude avec mapquest
		if (array_key_exists ('geo_altitude', $row) && !$row['geo_altitude']) {
			global $geo_mapquest_key;
			$mapquest = @file_get_contents (
				'http://open.mapquestapi.com/elevation/v1/profile'.
				'?key='.$geo_mapquest_key.
				'&callback=handleHelloWorldResponse'.
				'&shapeFormat=raw'.
				'&latLngCollection='.$centre[1].','.$centre[0]
			);
			if ($mapquest) {
				preg_match ('/"height":([0-9]+)/', $mapquest, $match);
				$update['geo_altitude'] = @$match[1];
			}
		}

		// Infos refuges.info
		if ((array_key_exists('geo_massif', $row) && !$row['geo_massif']) ||
			(array_key_exists('geo_reserve', $row) && !$row['geo_reserve']) ||
			(array_key_exists('geo_ign', $row) && !$row['geo_ign'])) {
			$url = "http://www.refuges.info/api/polygones?type_polygon=1,3,12&bbox={$centre[0]},{$centre[1]},{$centre[0]},{$centre[1]}";
			$wri_export = @file_get_contents($url);
			if ($wri_export) {
				$igns = [];
				$fs = json_decode($wri_export)->features;
				foreach($fs AS $f)
					switch ($f->properties->type->type) {
						case 'massif':
							if (array_key_exists('geo_massif', $row))
								$update['geo_massif'] = $f->properties->nom;
							break;
						case 'zone réglementée':
							if (array_key_exists('geo_reserve', $row))
								$update['geo_reserve'] = $f->properties->nom;
							break;
						case 'carte':
							$ms = explode(' ', $f->properties->nom);
							$igns[] = "<a target=\"_BLANK\" href=\"https://ignrando.fr/boutique/catalogsearch/result/?q={$ms[1]}\">$nom</a>";
							break;
					}
			}
		}

		// Calcul de la commune (France)
		if (array_key_exists ('geo_commune', $row) && !$row['geo_commune']) {
			$ch = curl_init ();
			curl_setopt ($ch, CURLOPT_URL, 
				'http://wxs.ign.fr/d27mzh49fzoki1v3aorusg6y/geoportail/ols?'.
				http_build_query ( array(
					'output' => 'json',
					'xls' =>
<<<XML
<?xml version="1.0" encoding="UTF-8"?>
<XLS 
xmlns:xls="http://www.opengis.net/xls"
	xmlns:gml="http://www.opengis.net/gml"
	xmlns="http://www.opengis.net/xls"
	xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" version="1.2"	xsi:schemaLocation="http://www.opengis.net/xls
	http://schemas.opengis.net/ols/1.2/olsAll.xsd">
	<RequestHeader/>
	<Request requestID="" version="1.2" methodName="LocationUtilityService" maximumResponses="10">
		<ReverseGeocodeRequest>
			<Position>
				<gml:Point>
					<gml:pos>{$centre[1]} {$centre[0]}</gml:pos>
				</gml:Point>
			</Position>
			<ReverseGeocodePreference>CadastralParcel</ReverseGeocodePreference>
		</ReverseGeocodeRequest>
	</Request>
</XLS>
XML
				))
			);
			ob_start();
			curl_exec($ch);
			$json = ob_get_clean();
			preg_match ('/Municipality\\\">([^<]+)/', $json, $commune);
			preg_match ('/Departement\\\">([^<]+)/', $json, $departement);

			// Calcul du code postal (France)
			$nominatim = json_decode (@file_get_contents (
				'https://nominatim.openstreetmap.org/reverse?format=json&lon='.$centre[0].'&lat='.$centre[1],
				false, 
				stream_context_create (array ('http' => array('header' => "User-Agent: StevesCleverAddressScript 3.7.6\r\n")))
			));
			$code_postal = @$nominatim->address->postcode;

			if ($commune[1])
				$update['geo_commune'] = ($code_postal ?: $departement[1]).' '.$commune[1];
		}

if(defined('TRACES_DOM'))/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>AUTOMATIC DATA = ".var_export($update,true).'</pre>';

		// Pour affichage
		$row = array_merge ($row, $update);

		// Update de la base
		if ($update)
			$this->db->sql_query (
				'UPDATE '.POSTS_TABLE.
				' SET '.$this->db->sql_build_array('UPDATE',$update).
				' WHERE post_id = '.$row['post_id']
		);
	}

	// Calcul de la bbox englobante
	function get_bounds($g) {
		$b = $g->getBBox();
		$m = 0.005; // Marge autour d'un point simple (en °)
		foreach (['x','y'] AS $xy) {
			if ($b['min'.$xy] == $b['max'.$xy]) {
				$b['min'.$xy] -= $m;
				$b['max'.$xy] += $m;
			}
			foreach (['max','min'] AS $mm)
				$this->bbox['geo_bbox_'.$mm.$xy] =
					isset ($this->bbox['geo_bbox_'.$mm.$xy])
					? $mm ($this->bbox['geo_bbox_'.$mm.$xy], $b[$mm.$xy])
					: $b[$mm.$xy];
		}
		$this->template->assign_vars (array_change_key_case ($this->bbox, CASE_UPPER));
	}


	/**
		POSTING.PHP
	*/
	function topic_field () {
		$data = [
			'1. L\'alpage' => 'h2',
			'1.1 Équipements' => 'h3',
	//	<p>Nombre de filets <input type="number" name="geo_filets-int-5" size="25" class="inputbox autowidth" value="{GEO_FILETS}" /></p>
			'Nombre de filets' => [
				'tag' => 'input',
				'type' => 'text',
//				'type' => 'number',
				'sql_name' => 'geo_filets',
				'sql_type' => 'int-5',
/*				'choice' => [
				]*/
			],
		];
		foreach ($data AS $k=>$v) {
			$d = ['INNER' => $k];
			switch (gettype ($v)) {
				case 'string':
					$d['TAG'] = $v;
					break;
				case 'array':
					foreach ($v AS $kv=>$vv) {
						$d[strtoupper($kv)] = $vv;
						$d[strtoupper($kv).'_UP'] = strtoupper($vv);
					}
			}
/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export($d,true).'</pre>';
			$this->template->assign_block_vars('topic_field', $d);
/*			foreach ($row AS $k=>$v) {
				$this->template->assign_block_vars ('topic_field.element', array (
					'K' => ucfirst (str_replace (['geo_', '_'], ['', ' '], $k)),
					'V' => str_replace ('~', '', $v),
				));
			}*/
		}
	}

	// Appelé au début pour ajouter des parametres de recherche sql
	function modify_posting_parameters($vars) {
		// Création topic avec le nom d'image
		$forum_image = $this->request->variable('type', '');
		$sql = 'SELECT * FROM '.FORUMS_TABLE.' WHERE forum_image LIKE "%/'.$forum_image.'.%"';
		$result = $this->db->sql_query ($sql);
		$row = $this->db->sql_fetchrow ($result);
		$this->db->sql_freeresult ($result);
		if ($row) {
			// Force le forum
			$vars['forum_id'] = $row ['forum_id'];
		}
	}

	// Appelé lors de l'affichage de la page posting
	function posting_modify_template_vars($vars) {
		$this->topic_field();

		$post_data = $vars['post_data'];
		$page_data = $vars['page_data'];
		$this->geobb_activate_map($post_data['forum_desc'], $post_data['post_id'] == $post_data['topic_first_post_id']);

		// Récupère la traduction des données spaciales SQL
		if (isset ($post_data['geom'])) {
			// Conversion WKT <-> geoJson
			$sql = 'SELECT AsText(geom) AS geomwkt
				FROM ' . POSTS_TABLE . '
				WHERE post_id = ' . $post_data['post_id'];
			$result = $this->db->sql_query($sql);
			$post_data['geomwkt'] = $this->db->sql_fetchfield('geomwkt');
			$this->db->sql_freeresult($result);

			// Traduction en geoJson
			include_once('assets/geoPHP/geoPHP.inc');
			$geophp = \geoPHP::load($post_data['geomwkt'],'wkt');
			$this->get_bounds($geophp);
			$gp = json_decode ($geophp->out('json')); // On transforme le GeoJson en objet PHP
//TODO BEST			$this->optim ($gp, 0.0001); // La longueur min des segments de lignes & surfaces sera de 0.0001 ° = 10 000 km / 90° * 0.0001 = 11m
			$post_data['geojson'] = json_encode ($gp);
		}

		// Pour éviter qu'un titre vide invalide la page et toute la saisie graphique.
		//TODO BEST traiter au niveau du formulaire (avertissement de modif ?)
		if (!$post_data['post_subject'])
			$page_data['DRAFT_SUBJECT'] = $this->post_name ?: 'NEW';

		$page_data['TOPIC_ID'] = $post_data['topic_id'] ?: 0;
		$page_data['POST_ID'] = $post_data['post_id'] ?: 0;
		$page_data['TOPIC_FIRST_POST_ID'] = $post_data['topic_first_post_id'] ?: 0;

		// Assign the phpbb-posts SQL data to the template
		foreach ($post_data AS $k=>$v)
			if (!strncmp ($k, 'geo', 3)
				&& is_string ($v))
				$page_data[strtoupper ($k)] =
					strstr($v, '~') == '~' ? null : $v; // Clears fields ending with ~ for automatic recalculation

		// HORRIBLE phpbb hack to accept geom values //TODO BEST : check if done by PhpBB (supposed 3.2)
		$file_name = "phpbb/db/driver/driver.php";
		$file_tag = "\n\t\tif (is_null(\$var))";
		$file_patch = "\n\t\tif (strpos (\$var, 'GeomFromText') !== false) //GeoBB\n\t\t\treturn \$var;";
		$file_content = file_get_contents ($file_name);
		if (strpos($file_content, '{'.$file_tag))
			file_put_contents ($file_name, str_replace ('{'.$file_tag, '{'.$file_patch.$file_tag, $file_content));

		$vars['page_data'] = $page_data;
	}

	// Called when validating the data to be saved
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];

		// Get special columns list
		$special_columns = [];
		$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "geo%"';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result))
			$special_columns [] = $row['Field'];
		$this->db->sql_freeresult($result);

		// Treat specific data
		$this->request->enable_super_globals();
		foreach ($_POST AS $k=>$v)
			if (!strncmp ($k, 'geo', 3)) {
				// <Input name="..."> : <sql colomn name>-<sql colomn type>-[<sql colomn size>]
				$ks = split ('-', $k);

				// Create or modify the SQL column
				if (count ($ks) == 3)
					$ks[2] = '('.$ks[2].')';
				$this->db->sql_query(
					'ALTER TABLE '.POSTS_TABLE.
					(in_array ($ks[0], $special_columns) ? ' CHANGE '.$ks[0].' ' : ' ADD ').
					implode (' ', $ks)
				);

				// Retrieves the values of the geometry, includes them in the phpbb_posts table
				if ($ks[1] == 'geometry' && $v) {
					include_once('assets/geoPHP/geoPHP.inc');
					$geophp = \geoPHP::load (html_entity_decode($v), 'json');
					if ($geophp)
						$v = 'GeomFromText("'.$geophp->out('wkt').'")';
				}

				// Retrieves the values of the questionnaire, includes them in the phpbb_posts table
				$sql_data[POSTS_TABLE]['sql'][$ks[0]] = utf8_normalize_nfc($v) ?: null; // null allows the deletion of the field
			}
		$this->request->disable_super_globals();

		$vars['sql_data'] = $sql_data;

		//-----------------------------------------------------------------
		// Save change
		$data = $vars['data'];
		$save[] = date('r').' '.$this->user->data['username'];

		// Trace before
		if ($data['post_id']) {
			$sql = 'SELECT *, AsText(geom) AS geomwkt FROM '.POSTS_TABLE.' WHERE post_id = '.$data['post_id'];
			$result = $this->db->sql_query($sql);
			$data_avant = $this->db->sql_fetchrow($result);
			$this->db->sql_freeresult($result);

			$sql = 'SELECT attach_id FROM '.ATTACHMENTS_TABLE.' WHERE post_msg_id = '.$data['post_id'];
			$result = $this->db->sql_query($sql);
			while ($rowattchm = $this->db->sql_fetchrow($result))
				$attach_avant[] = $rowattchm['attach_id'];
			$this->db->sql_freeresult($result);

			if (isset ($attach_avant))
				$data_avant['attachments'] = implode ('|', $attach_avant);

			foreach (['forum_id','topic_id','post_id','poster_id','post_subject','post_text','geomwkt','attachments',] AS $k)
				if (@$data_avant[$k])
					$avant[] = $k.'='.str_replace("\n","\\n",$data_avant[$k]);

			$save[] = 'avant:'.implode(',',$avant);
		}

		// Trace aprés
		if (isset ($data['attachment_data'])) {
			foreach ($data['attachment_data'] AS $a)
				$attach_apres[] = $a['attach_id'];
			if (isset ($attach_apres))
				$data['attachments'] = implode ('|', $attach_apres);
		}
		if (isset ($data['geom']))
			$data['geom'] = str_replace (['GeomFromText("','")'], '', $sql_data[POSTS_TABLE]['sql']['geom']);

		foreach (['forum_id','topic_id','post_id','poster_id','topic_title','message','geom','attachments',] AS $k)
			if (@$data[$k])
				$apres[] = $k.'='.str_replace("\n","\\n",$data[$k]);

		$save[] = $vars['post_mode'].':'.implode(',',$apres);

		file_put_contents ('EDIT.log', implode ("\n", $save)."\n\n", FILE_APPEND);
	}

	// Permet la saisie d'un POST avec un texte vide
	function posting_modify_submission_errors($vars) {
		$error = $vars['error'];

		foreach ($error AS $k=>$v)
			if ($v == $this->user->lang['TOO_FEW_CHARS'])
				unset ($error[$k]);

		$vars['error'] = $error;
	}
}