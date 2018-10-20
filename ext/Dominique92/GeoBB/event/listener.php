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
		\phpbb\extension\manager $extension_manager,
		$root_path
	) {
		$this->db = $db;
//		$this->request = $request;
		$this->template = $template;
		$this->user = $user;
//		$this->extension_manager = $extension_manager;
//		$this->root_path = $root_path;

		// Recherche du répertoire de l'extension
		$ns = explode ('\\', __NAMESPACE__);
		$this->ext_dir = 'ext/'.$ns[0].'/'.$ns[1].'/';

		// Inclue les fichiers langages de cette extension
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

	// Liste des hooks et des fonctions associées
	// On trouve le point d'appel en cherchant dans le logiciel de PhpBB 3.x: "event core.<XXX>"
	static public function getSubscribedEvents() {
		return [
			// Index
			'core.index_modify_page_title' => 'geobb_activate_map', //226

			// Viewtopic
			'core.viewtopic_get_post_data' => 'viewtopic_get_post_data',
			'core.viewtopic_post_rowset_data' => 'viewtopic_post_rowset_data',
			'core.viewtopic_modify_post_row' => 'viewtopic_modify_post_row',
			'geobb.gis_modify_data' => 'gis_modify_data', //gis.php

			// Posting
			'core.submit_post_modify_sql_data' => 'submit_post_modify_sql_data',
			'core.posting_modify_template_vars' => 'posting_modify_template_vars',
			'core.posting_modify_submission_errors' => 'posting_modify_submission_errors',
		];
	}

	function geobb_activate_map($vars) {
		global $geo_olkeys;

		preg_match ('/\[(first|all)=([a-z]+)\]/i', html_entity_decode ($vars['forum_desc'].'[all=accueil]'), $regle);
		switch (@$regle[1]) {
			case 'first': // Régle sur le premier post seulement
				if (!$vars['first_post'])
					break;

			case 'all': // Régle sur tous les posts
				$this->template->assign_vars([
					'EXT_DIR' => $this->ext_dir,
					'GEO_MAP_TYPE' => $regle[2],
					'GEO_OLKEYS' => $geo_olkeys,
//					'STYLE_NAME' => $this->user->style['style_name'],
//					'MAP_KEYS' => @$config_locale['keys-js']
				]);
		}
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
		$this->post_data [$vars['row']['post_id']] = $vars['row'];
	}

	// Appelé lors de la deuxième passe sur les données des posts qui prépare dans $post_row les données à afficher sur le post du template
	function viewtopic_modify_post_row($vars) {
		$vars['forum_desc'] = $post_data['forum_desc'];
		$this->geobb_activate_map($vars);

		if (isset ($this->post_data [$vars['row']['post_id']])) {
			$row = $this->post_data [$vars['row']['post_id']]; // Récupère les données SQL du post 
			$post_row = $vars['post_row'];

			// Convert the geom info in geoJson format
			preg_match ('/\[(first|all)=([a-z]+)\]/i', $vars['topic_data']['forum_desc'], $regle);
			if (count ($regle) == 3 &&
				(
					($regle[1] == 'all') ||
					($regle[1] == 'first' && ($row['post_id'] == $vars['topic_data']['topic_first_post_id']))
				) &&
				@$row['geomwkt']
			) {
				include_once('assets/geoPHP/geoPHP.inc'); // Librairie de conversion WKT <-> geoJson (needed before MySQL 5.7)
				$g = \geoPHP::load($row['geomwkt'],'wkt');
				$row['geomjson'] = $g->out('json');
				$this->get_bounds($g);
				$this->get_automatic_data($row);
				$this->geobb_activate_map($vars, $vars['topic_data']['forum_desc']);
			}

			foreach ($row AS $k=>$v)
				if (strstr ($k, 'geo')) {
					// Assign the phpbb-posts.geo* SQL data of to each template post area
					$post_row[strtoupper ($k)] = $v;

					// Assign the phpbb-posts.geo* SQL data of the first post to the template
					if ($vars['topic_data']['topic_first_post_id'] == $row['post_id'])
						$this->template->assign_var (strtoupper ($k), $v);
				}

			$vars['post_row'] = $post_row;
		}
	}

	function gis_modify_data($vars) {
//if(defined('TRACES_DOM'))//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export('gis_modify_data',true).'</pre>';
/*
		// Insère l'extraction des données externes dans le flux géographique
		$row = $vars['row'];

		if ($vars['diagBbox'])
			$this->optim ($row['geomphp'], $vars['diagBbox'] / 200); // La longueur min des segments de lignes & surfaces sera de 1/200 de la diagonale de la BBOX

		$vars['row'] = $row;
*/
	}
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
if(defined('TRACES_DOM'))/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export('get_automatic_data',true).'</pre>';
/*
		global $config_locale;
		preg_match_all('/([0-9\.\-]+)/', $row['geomwkt'], $ll);

		// Calcul de l'altitude avec mapquest
		if (array_key_exists ('geo_altitude', $row) && !$row['geo_altitude']) {
			$mapquest = 'http://open.mapquestapi.com/elevation/v1/profile?key='.$config_locale['keys-mapquest']
					   .'&callback=handleHelloWorldResponse&shapeFormat=raw&latLngCollection='.$ll[1][1].','.$ll[1][0];
			preg_match_all('/"height":([0-9]+)/', @file_get_contents ($mapquest), $retour);//TODO DCMM preg_match
			if ($r = @$retour[1][0])
				$row['geo_altitude'] = // Pour affichage
				$sql_update['geo_altitude'] = // Pour modification de la base
					$r.'~'; // ~ indique que la valeur & été déterminée par le serveur
		}

		// Détermination du massif par refuges.info
		if (array_key_exists ('geo_massif', $row) && !$row['geo_massif']) {
			$f_wri_export = 'http://www.refuges.info/api/polygones?type_polygon=1,10,11,17&bbox='.$ll[1][0].','.$ll[1][1].','.$ll[1][0].','.$ll[1][1];
			$wri_export = json_decode (@file_get_contents ($f_wri_export));
			if($wri_export->features)
				foreach ($wri_export->features AS $f)
					$ms [$f->properties->type->id] = $f->properties->nom;
			if (isset ($ms))
				ksort ($ms);
			$row['geo_massif'] = // Pour affichage
			$sql_update['geo_massif'] = // Pour modification de la base
				@$ms[array_keys($ms)[0]].'~'; // ~ indique que la valeur & été déterminée par le serveur
		}

		// Update de la base
		if (isset ($sql_update))
			$this->db->sql_query ('UPDATE '.POSTS_TABLE.' SET '.$this->db->sql_build_array('UPDATE',$sql_update)." WHERE post_id = ".$row['post_id']);

		// N'affiche pas le ~
		$row['geo_altitude'] = str_replace ('~', '', $row['geo_altitude']);
		$row['geo_massif'] = str_replace ('~', '', $row['geo_massif']);
*/
	}

	// Calcul de la bbox englobante
	function get_bounds($g) {
if(defined('TRACES_DOM'))/*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'> = ".var_export('get_bounds',true).'</pre>';
/*
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
*/
	}


	/**
		POSTING.PHP
	*/
	// Appelé lors de l'affichage de la page posting
	function posting_modify_template_vars($vars) {
		$post_data = $vars['post_data'];

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
			include_once('assets/geoPHP/geoPHP.inc'); // Librairie de conversion WKT <-> geoJson (needed before MySQL 5.7)
			$g = \geoPHP::load($post_data['geomwkt'],'wkt');
			$this->get_bounds($g);
			$gp = json_decode ($g->out('json')); // On transforme le GeoJson en objet PHP
			$this->optim ($gp, 0.0001); // La longueur min des segments de lignes & surfaces sera de 0.0001 ° = 10 000 km / 90° * 0.0001 = 11m
			$post_data['geomjson'] = json_encode ($gp);
		}

		// Pour éviter qu'un titre vide invalide la page et toute la saisie graphique.
		// TODO : traiter au niveau du formulaire (avertissement de modif ?)
		if (!$post_data['post_subject'])
			$post_data['draft_subject'] = 'NEW';

		// Assign the phpbb-posts SQL data to the template
		foreach ($post_data AS $k=>$v)
			if (is_string ($v))
				$this->template->assign_var (
					strtoupper ($k),
					strstr($v, '~') == '~' ? null : $v // Efface les champs finissant par ~ pour les recalculer automatiquement
				);

		// Assign the forums geom type flags to the template
		$vars['first_post'] =
			!isset ($post_data['topic_id']) || // Cas de la création d'un nouveau topic
			$post_data['topic_first_post_id'] == @$post_data['post_id'];

		$vars['forum_desc'] = $post_data['forum_desc'];
		$this->geobb_activate_map($vars);

		// HORRIBLE phpbb hack to accept geom values / TODO : check if done by PhpBB (supposed 3.2)
		$file_name = "phpbb/db/driver/driver.php";
		$file_tag = "\n\t\tif (is_null(\$var))";
		$file_patch = "\n\t\tif (strpos (\$var, 'GeomFromText') !== false) //GeoBB\n\t\t\treturn \$var;";
		$file_content = file_get_contents ($file_name);
		if (strpos($file_content, '{'.$file_tag))
			file_put_contents ($file_name, str_replace ('{'.$file_tag, '{'.$file_patch.$file_tag, $file_content));
	}

	// Appelé lors de la validation des données à enregistrer
	function submit_post_modify_sql_data($vars) {
		$sql_data = $vars['sql_data'];

		// Redefine basic fields
		global $post_shema;
		$post_shema ['geom'] = 'geometry';
		$post_shema ['geo_altitude'] = 'int(11)';
		$post_shema ['geo_massif'] = 'varchar(50)';

		// Enregistre dans phpbb-posts les valeurs de $_POST correspondantes à des champs de phpbb-posts commençant par geo
		$sql = 'SHOW columns FROM '.POSTS_TABLE.' LIKE "geo%"';
		$result = $this->db->sql_query($sql);
		while ($row = $this->db->sql_fetchrow($result)) {
			$col_name = $row['Field'];

			// Récupère les valeurs du questionnaire
			$val = request_var ($col_name, 'UNDEFINED', true); // Look in $_POST
			if ($val != 'UNDEFINED')
				$sql_data[POSTS_TABLE]['sql'][$col_name] = utf8_normalize_nfc($val) ?: null; // null permet la supression du champ

			// Donnée spaciale
			$json = request_var ($col_name.'json', ''); // Look in $_POSTS[*json]
			if ($json) {
				include_once('assets/geoPHP/geoPHP.inc'); // Librairie de conversion WKT <-> geoJson (needed before MySQL 5.7)
				$g = \geoPHP::load (html_entity_decode($json), 'json');
				if ($g) // Pas de geom
					$sql_data[POSTS_TABLE]['sql'][$col_name] = 'GeomFromText("'.$g->out('wkt').'")';
			}

			// Correct existing columns
			if ($post_shema[$col_name] && $post_shema[$col_name] != $row['Type'])
				$this->db->sql_query("ALTER TABLE ".POSTS_TABLE." CHANGE $col_name $col_name ".$post_shema[$col_name]." NULL");
			unset ($post_shema[$col_name]);
		}
		$this->db->sql_freeresult($result);

		// Add missing colums
		foreach ($post_shema AS $k => $v)
			$this->db->sql_query("ALTER TABLE ".POSTS_TABLE." ADD $k $v");

		$vars['sql_data'] = $sql_data;

		//-----------------------------------------------------------------
		// Save modif
		$data = $vars['data'];
		$save[] = date('r').' '.$this->user->data['username'];

		// Trace avant
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