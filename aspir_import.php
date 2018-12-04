<?php
// Importation des bases enquete-pastorale.irstea

/* OPERATIONS

INSTALL
=======
Créer BDD
Copier PhpBB3 sauf doc
Copier repertoire de GeoBB + aspir_import.php
Lancer install
-> Français -> Change
Installer -> Installer
config.php -> clés cartes : $geo_keys = [...]
Paramètres de cookie -> Domaine du cookie : VIDE
Supprimer install
Administration ==>
Genéral -> Paramètres des fichiers joints -> Taille maximale du fichier : : 5 Mo
Général -> Configuration du forum -> Libellé du site Internet :
Genéral -> Paramètres de cookie -> Domaine du cookie : VIDE
Général -> Paramètres du serveur -> Activer la compression GZip : oui
Personnaliser -> Désactiver VigLink
Personnaliser -> Installation de styles -> Aspir -> Détails -> Définir comme style par défaut
Personnaliser -> Gérer de styles -> Prosilver -> Désactiver
Messages -> Ajouter un bbcode -> [first={TEXT}][/first] / <span></span> / ne pas oublier [/first] dans les forum_desc
Messages -> Ajouter un bbcode -> [fiche={TEXT}][/fiche] / <span></span> / ne pas oublier [/fiche] dans les forum_desc
Général -> Gérer les forums -> Créer Alpages, Cabanes, Points d'eau, Forum des utilisateurs
	catégorie Coin des modérateurs, Configuration, Formulaires, Bienvenue, Aide, 
	catégorie Bugs et améliorations, Bugs et améliorations résolus
Permissions -> Permissions des forums -> Coin des modérateurs + Configuration . Bugs * -> Envoyer
	Robots + Invités + Utilisateurs * enregistrés -> Aucun accès -> Appliquer toutes
Permissions -> Permissions des forums -> Alpages + Cabanes + Forum utilisateurs
	Utilisateurs * enregistrés -> Accès standard -> Appliquer toutes
Créer un item d'Alpage, Cabane, Point d'eau
Exécuter aspir_import.php ...
Administration -> Gérer les forums -> Alpages -> Resynchroniser

ACCEPTER MODERATEUR
===================
Administration -> Gérer les membres -> formulaire : Groupes -> Ajouter ce membre au groupe : Modérateurs globaux -> Définir comme groupe par défaut


						UPDATE VERSION PHPBB
						====================
						//TODO ASPIR test 1&1 & migation
						copier full package
						install/app.php/update -> database only
						delete install
						ext/Dominique92/GeoBB/aspir_import.php?d=07
						administration -> resync les forums
						Ajouter catégorie forum 'forum"
						Ajouter sujet "Bienvenue"

						RESYNC ASPIR
						============
						Vider cache / cache de l'explorateur
						structure phpbb_posts -> supprime colonnes geo*
						cree cabane / valide PUIS cree alpage / valide
						vide phpbb_posts
						admin -> resync les forums
						aspir_import.php -> cliquer sur tous
						??? ajouter phrase / code aspir

						Notification -> Activation requise
						-> Administrer le membre -> Outils rapides -> Activer son compte
						Formulaire -> Groupes -> Ajouter ce membre = Modérateurs globaux

Formulaires
===========
[b][u]MODE D'EMPLOI[/u][/b]
Chaque type de page est représenté par un post dont le nom est égal au nom du type de fiche (Alpages, Cabanes, ...)
Chaque ligne représente une donnée. Elle est constituée de champs séparés par des | (sur le clavier : AltGr + 6)
Champ 1 = { : Début de bloc. Le champ 2 contient alors le titre de ce bloc qui n'est affiché que si le bloc contient des informations valides.
ou champ 1 = } : fin du bloc (les blocs peuvent être imbriqués).
ou champ 1 = identifiant de la donnée dans la base : Exclusivement constitué de minuscules non accentuées, de chiffres ou du caractère _. on peut en changer mais il ne faut pas deux fois le même.
Champ 2 = texte à afficher en début de ligne
Champ 3 = nature du champ qui peut être :
- 0 : la saisie sera numérique
- court : la saisie sera une zone texte de 1 ligne
- long : la saisie sera une zone de texte comprenant plusieurs lignes
- plusieurs valeurs séparées par une , : liste de choix
- date : une date
- proches : la liste des plus proches géographiquement (les alpages)
- attaches : la liste des points attachés (cabanes ou points d'eau)
Champ 4 = Indication à afficher dans la boite de saisie quand elle est vide. Cette indication disparaît quand on entre dans la boite de saisie et n'est jamais enregistrée dans la base.
ou champ 4 = texte affiché après la donnée (unité par exemple)
Un changement peut générer une erreur à la modification d'une fiche. Revenir sur le forum de description et essayer de corriger la dernière modification. Sinon, me contacter.
[color=red]Il est important de bien respecter la structure des lignes et des { } et |[/color]

Vous pouvez modifier ces formulaires en cliquant sur le petit crayon en haut à droite.

Alpages
=======
surface|Surface|automatique|ha
commune|Commune|automatique
irstea_code|Code Irstea|automatique
irstea_type|Type Irstea|automatique
unite_pastorale|Unite Pastorale Irstea|automatiqueign|Carte IGN|automatique
reserve|Par ou réserve|automatique
{|1. L'alpage
{|1.1 Équipements
{|Autres équipements disponibles
equipements_pediluve|- Pédiluve|oui,non,ne sait pas
equipements_contention|- Couloir de contention|oui,non,ne sait pas
equipements_pediluve|- Parc infirmerie en dur|oui,non,ne sait pas
equipements_filets|- Nombre de filets|0
equipements_poste|- Nombre de postes électriques|0
equipements_precisions|- Autres précisions|court
}}
{|1.2 Caractéristiques
altitude|Altitude|automatique|m
topographie|Topographie|long
risques|Risques|court|Vide, chute de pierres, orages violents...
especes_proteges|Présence espèces remarquables et/ou protégées|court|Faune ou flore
ressource_fourragere|Ressource fourragère|long|Qualité de l'herbe ? Note sur 5
contains|Point(s) d'eau|attaches|point_eau
operateur|Opérateur téléphonique recommandé|Orange,Bouygues Télécom,Free,SFR,autre,ne sait pas
operateur_autre|autre opérateur|court
}
{|1.3 Accès
acces_par|Accès par|route,piste,sentier
acces_etat|État de l'accès|Bon,Moyen,mauvais
acces_bat|Accès avec animaux de bâts|oui,non,ne sait pas
acces_parking|Où se garer ?|long
acces_parcours|Temps de parcours|court
acces_ravitaillement|Lieu de ravitaillement le plus proche|court
acces_appui|Lieu d'appui aux bergers, lieu de rencontre|court
}
{|1.4 Mesures environnementales
maec|Présence de MAEC|oui,non,autre,ne sait pas
maec_autre|- Autres mesures|court
parc_national|Réserve naturelle nationale|oui,non,ne sait pas
parc_regional|Réserve naturelle régionale|oui,non,ne sait pas
ens|ENS|oui,non,ne sait pas
natura_2000|Natura 2000|oui,non,ne sait pas
}
{|1.5 Autres usagers
{|- Récréatif
usagers_vtt|VTT|Faible,Moyenne,Importante
usagers_randonnee|Sentiers randonnée|Faible,Moyenne,Importante
usagers_quad|Quad|Faible,Moyenne,Importante
usagers_4x4|4x4|Faible,Moyenne,Importante
usagers_remontees|Remontées mécaniques (fonctionnant l'été)|Faible,Moyenne,Importante
usagers_chasseurs|Chasseurs|Faible,Moyenne,Importante
usagers_parapente|Parapentes|Faible,Moyenne,Importante
usagers_autre|Autre
}
{|- Professionnel
usagers_gardes|Gardes|Faible,Moyenne,Importante
usagers_forestiers|Forestiers|Faible,Moyenne,Importante
usagers_refuges|Refuges|Faible,Moyenne,Importante
}}
{|1.6 Héliportages
heliportages_debut|Date approximative début estive|date
heliportages_fin|Date approximative fin estive|date
heliportages_poids|Poids à la disposition du berger|0|Kg
}}
|2. Logement
contains|Cabane(s)|attaches|cabane
{|3. Les bêtes
{|3.1 Le troupeau
troupeau_nb_eleveurs|Nombre d'éleveurs|0
troupeau_nb_brebis|Nombre de brebis|0
{|- Eleveur 1 :
troupeau_nom_eleveur1|Nom éleveur 1|court
troupeau_nb_brebis1|Nombre brebis 1|0
troupeau_race1|Race dominante 1|court
troupeau_exploitation1|Siège exploitation 1|court
}
{|- Eleveur 2 :
troupeau_nom_eleveur2|Nom éleveur 2|court
troupeau_nb_brebis2|Nombre brebis 2|0
troupeau_race2|Race dominante 2|court
troupeau_exploitation2|Siège exploitation 2|court
}
{|- Eleveur 3 :
troupeau_nom_eleveur3|Nom éleveur 3|court
troupeau_nb_brebis3|Nombre brebis 3|0
troupeau_race3|Race dominante 3|court
troupeau_exploitation3|Siège exploitation 3|court
}
{|- Eleveur 4 :
troupeau_nom_eleveur4|Nom éleveur 4|court
troupeau_nb_brebis4|Nombre brebis 4|0
troupeau_race4|Race dominante 4|court
troupeau_exploitation4|Siège exploitation 4|court
troupeau_transhumance|Transhumance|oui,non,ne sait pas
troupeau_transhumance_detail|- si oui, itinéraire et durée|court
troupeau_beliers|Présence de béliers|oui,non,ne sait pas
troupeau_chevres|Présence de chèvres|oui,non,ne sait pas
troupeau_agneaux|Présence d'agneaux|oui,non,ne sait pas
troupeau_tri_empoussees|Date de tri des empoussées|date
troupeau_precisions|Autres précisions|long
}}
{|3.2 Les soins
{|- État général du troupeau
troupeau_antiparasitaire|Traitement antiparasitaire avant la montée|oui,non,ne sait pas
troupeau_bain|Traitement teigne/tique/poux/bain la montée?|oui,non,ne sait pas
troupeau_pediluve|Pédiluve|oui,non,ne sait pas
troupeau_maladies|Maladies récurrentes liées à l'alpage|oui,non,ne sait pas
troupeau_precisions|autres précisions|long
troupeau_soins|soins vétérinaires habituellement pratiqués|long
}}
{|3.3 La prédation
predation_loups|Présence avérée de loups|oui,non,ne sait pas
predation_zonage|Zonage|Cercle 1 (présence du loup détectée ou probable,Cercle 2 (susceptibles d'être colonisé par le loup),ne sait pas
{|Mesures de protection :
predation_bergers|Nombre de postes de bergers|0
predation_aides_bergers|Nombre de postes d'aides bergers|0
predation_parcs|Parcs de nuit|oui,non,ne sait pas
}
{|Chiens de protection :
predation_chiens_males|- Nombre de mâle(s)|0
predation_chiens_femelles|- Nombre de femelle(s)|0
predation_chiens_races|Race(s)|court
predation_chiens_castres|Castré(s)|court
predation_chiens_meute|Meute cohérente|court
predation_meutes_voisines|Lien meutes voisines|court
predation_chiens_autre|Autre|court
}
{|Fréquence des attaques :
attaques_frequence|- nombre d'attaques|0
attaques_victimes|- nombre de victimes|0
attaques_diagnostic|Diagnostic de vulnérabilité à la prédation|oui,non,ne sait pas
attaques_informations|Informations complémentaires et conseils aux futurs bergers|long
attaques_arme|Arme à disposition|oui,non,ne sait pas
attaques_permis|Besoin permis de chasse|oui,non,ne sait pas
}}
{|3.4 La conduite du troupeau
{|Description des quartiers : dates approximatives, principales caractéristiques, spécificités de la garde, conseils...
quartier1|Quartier 1|court
quartier2|Quartier 2|court
quartier3|Quartier 3|court
}}
{|4. les aides
eleveurs_implication|Implication des éleveurs pendant l'estive|Beaucoup,Un peu,Pas du tout
eleveurs_soins|Participation éleveurs soins|Beaucoup,Un peu,Pas du tout
emontagnage_date|Date d'emontagnage|date
demontagnage_date|Date de démontagnage|date
}
{|5. Le berger
{|- emploi :
berger_salarie|- salarié|oui,non,ne sait pas
berger_entrepreneur|- entrepreneur de garde|oui,non,ne sait pas
berger_eleveur|- éleveur berger|oui,non,ne sait pas
berger_temps_travail|- temps de travail|court
berger_contrat|- type de contrat|court
berger_autre|- autres informations|court
berger_contact_ancien|- contact ancien berger|court
}
}}
{|5. Le responsable d'alpage
forme_juridique|- Forme juridique|Groupement pastoral,Groupement d'employeurs pour l'insertion et la qualification,Exploitant individuel,Autre
forme_juridique_autre|Autre forme juridique|court
{|Siège social de l'employeur
forme_juridique_commune|- commune|court
forme_juridique_departement|- département|court
}
|6. Autres informations :

Cabanes
=======
altitude|Altitude|automatique|m
contains|Alpage d’appartenance|proches
commune|Commune|automatique
ign|Carte IGN|automatique
reserve|Par ou réserve|automatique
cabane_etat|État général de la cabane|bon,moyen,mauvais
cabane_etancheite|Étanchéité pluie|oui,non
cabane_isolation|Isolation vent|oui,non
cabane_douche|Douche chaude|oui,non
cabane_chauffage_eau|- Source énergie chauffage eau|court
cabane_wc|WC|oui,non
cabane_wc_type|- Type : classique / sec …|
cabane_rangements|Rangements|oui,non
cabane_armoire|- Armoire à l'abri des rongeurs|oui,non
cabane_appentis|- Appentis (rangement filets, cabanes chiens...)|oui,non
cabane_pieces|Nombre de pièces|0
cabane_surface|Surface|0|m²
cabane_gaziniere|Gazinière|oui,non
cabane_gaziniere_etat|- État|bon,moyen,mauvais
cabane_four|- Four|oui,non
cabane_gaz|Gaz fourni par les éleveurs|oui,non
cabane_gaz_bouteilles|- Nb bouteilles consommée par saison|0
cabane_eau_courante|Eau courante|oui,non
cabane_eau_potable|Eau potable|oui,non
cabane_eau_potable_distance|- Si non, distance à l'eau potable|0|m
cabane_electricite|Électricité|oui,non
cabane_electricite_type|- Type|court
cabane_electricite_equipements|- Équipements nécessaires|court
cabane_ustensiles|Ustensiles cuisine|oui,non
cabane_vaisselle|Vaisselle|oui,non
cabane_chambres|Nombre de chambres|0
cabane_literie|Literie
cabane_literie_nombre|– Nombre de lits|0
cabane_matelas|– État des matelas|bon,moyen,mauvais
cabane_chauffage|Moyen de chauffage|court
cabane_poele|– Qualité poêle|bon,moyen,mauvais
cabane_tirage|– Qualité tirage|bon,moyen,mauvais
cabane_bois|Bois de chauffage|oui,non
cabane_bois_a_debiter|– A débiter|oui,non
cabane_ravitaillement|Ravitaillement|a faire soi même,par les éleveurs
|Logement adéquat pour
cabane_famille|– Une famille|oui,non
cabane_cohabitation|– Cohabitation 2 personnes|oui,non
cabane_telephone|Capte le réseau téléphonique|oui,non,aléatoire,ne sait pas
cabane_internet|Capte le réseau Internet|oui,non,aléatoire,ne sait pas
|Autres remarques ou commentaires

Points d'eau
============
altitude|Altitude|automatique|m
contains|Alpage d’appartenance|proches
commune|Commune|automatique
ign|Carte IGN|automatique
reserve|Par ou réserve|automatique
{|Points d'eau Marais/zones humides : Eau (zones en défens, sources, ...)
point_eau_destination|Destination|hommes,animaux
point_eau_debit|Débit|source,rivière,point d'eau permanent,point d'eau semi permanent,abreuvoir,impluvium
}
|Autres informations :

*/

echo"<p>
<a href='aspir_import.php?d=01'>01</a> &nbsp; 
<a href='aspir_import.php?d=04'>04</a> &nbsp; 
<a href='aspir_import.php?d=05'>05</a> &nbsp; 
<a href='aspir_import.php?d=07'>07</a> &nbsp; 
<a href='aspir_import.php?d=13'>13</a> &nbsp; 
<a href='aspir_import.php?d=26'>26</a> &nbsp; 
<a href='aspir_import.php?d=38'>38</a> &nbsp; 
<a href='aspir_import.php?d=42'>42</a> &nbsp; 
<a href='aspir_import.php?d=43'>43</a> &nbsp; 
<a href='aspir_import.php?d=63'>63</a> &nbsp; 
<a href='aspir_import.php?d=69'>69</a> &nbsp; 
<a href='aspir_import.php?d=73'>73</a> &nbsp; 
<a href='aspir_import.php?d=74'>74</a> &nbsp; 
<a href='aspir_import.php?d=83'>83</a> &nbsp; 
<a href='aspir_import.php?d=84'>84</a> &nbsp; 
</p>";

define('IN_PHPBB', true);
$phpbb_root_path = (defined('PHPBB_ROOT_PATH')) ? PHPBB_ROOT_PATH : './';
$phpEx = substr(strrchr(__FILE__, '.'), 1);
include($phpbb_root_path . 'common.' . $phpEx);
include($phpbb_root_path . 'includes/functions_posting.' . $phpEx);

include_once('./assets/geoPHP/geoPHP.inc');
include_once('./assets/proj4php/vendor/autoload.php');
use proj4php\Proj4php;
use proj4php\Proj;
use proj4php\Point;

// Start session management
$user->session_begin();
$auth->acl($user->data);
$user->setup();

// Initialise Proj4
$proj4 = new Proj4php();
$projSrc = new Proj('EPSG:3857', $proj4);
$projDst = new Proj('EPSG:4326', $proj4);

// Parameters
$epid = $request->variable('d', '00');
$upzp = $request->variable('p', 'UP');
$alp_forum_id = $request->variable('f', 2);
echo"<pre style='background-color:white;color:black;font-size:14px;'>Import enquete ".var_export($upzp.':'.$epid,true).'</pre>';

// Get irstea list
// http://enquete-pastorale.irstea.fr/getPHP/getUPJSON.php?id=38
// http://enquete-pastorale.irstea.fr/getPHP/getZPJSON.php?id=38
$epifile = file_get_contents ('http://enquete-pastorale.irstea.fr/getPHP/get'.$upzp.'JSON.php?id='.$epid);
$epiphp = json_decode($epifile);
conv_3857_to_4326($epiphp);
function conv_3857_to_4326(&$p){
	global $proj4, $projSrc, $projDst;
	if($p->features)
		conv_3857_to_4326($p->features);
	if($p->geometry)
		conv_3857_to_4326($p->geometry);
	if($p->coordinates)
		conv_3857_to_4326($p->coordinates);
	if(gettype($p) == 'array') {
		if (gettype($p[0]) == 'integer'){
			$pointSrc = new Point($p[0], $p[1], $projSrc);
			$pointDest = $proj4->transform($projDst, $pointSrc);
			$p[0] = $pointDest->__get('x');
			$p[1] = $pointDest->__get('y');
		} else
			foreach($p AS &$p1)
				conv_3857_to_4326($p1);
	}
}

$stay_lower = ['le','la','les','du','de','des','sur'];

foreach ($epiphp->features as $p)
	if($p->geometry) {
		// Get geometry
		$geomjson = json_encode($p->geometry);
		$geomphp = \geoPHP::load ($geomjson, 'json');
		$geomsql = 'GeomFromText("'.$geomphp->out('wkt').'")';

		// Normalise data
		if (!$p->properties->surface)
			$p->properties->surface = 0;
		if (!$p->properties->nom1)
			$p->properties->nom1 = $p->properties->code;
		$p->properties->nom1 = str_replace('_', ' ',
		$p->properties->nom1);
		$p->properties->nom1 = ucfirst (preg_replace_callback (
			'/([A-Z]+)/',
			function ($m) {
				global $stay_lower;
				$r = strtolower($m[0]);
				return in_array ($r, $stay_lower) || !$r[1] // l'xxx, d'xxx
					? $r
					: ucfirst ($r);
			},
			$p->properties->nom1
		));

		// Check existing subject
		$sql = "SELECT * FROM phpbb_posts WHERE geo_irstea_code = '{$p->properties->code}'";
		$result = $db->sql_query($sql);
		$data = $db->sql_fetchrow($result);
		$db->sql_freeresult($result);

		//  Création d'une fiche
		if ($p->geometry->coordinates && !$data['topic_id']) {
			echo '<pre style="background-color:white;color:black;font-size:14px;">Céation de '.var_export($p->properties->nom1,true).'</pre>';

			$data = [
				'forum_id' => $alp_forum_id,
				'topic_id' => 0, // Le créer
				'post_id' => 0, // Le créer
				'post_subject' => $p->properties->nom1,
				'message' => '',
				'message_md5' => md5(''),
				'bbcode_bitfield' => 0,
				'bbcode_uid' => 0,
				'icon_id' => 0,
				'enable_bbcode' => true,
				'enable_smilies' => true,
				'poster_id' => $user->data['user_id'],
				'enable_urls' => true,
				'enable_sig' => true,
				'topic_visibility' => true,
				'post_visibility' => true,
				'enable_indexing' => true,
				'post_edit_locked' => false,
				'notify_set' => false,
				'notify' => false,
			];
			$poll = [];
			\submit_post(
				'post',
				$p->properties->nom1,
				$user->data['username'],
				POST_NORMAL,
				$poll,
				$data
			);
		}

		// Update geo_ data
		if ($data['post_id']) {
			$sql = "UPDATE phpbb_topics 
					SET topic_title = '".str_replace ("'", "\\'", $p->properties->nom1)."'
					WHERE topic_id = {$data['topic_id']}";
			$result = $db->sql_query($sql);
		}

		// Update geo_ data
		if ($data['post_id']) {
			$sql = "UPDATE phpbb_posts
					SET geom = $geomsql,
					post_subject = '".str_replace ("'", "\\'", $p->properties->nom1)."',
					geo_unite_pastorale = '".str_replace ("'", "\\'", $p->properties->nom1)."',
					geo_surface = {$p->properties->surface},
					geo_irstea_code = '{$p->properties->code}',
					geo_irstea_type = '$upzp:$epid'
				WHERE post_id = {$data['post_id']}";
			$result = $db->sql_query($sql);
		}
	}
