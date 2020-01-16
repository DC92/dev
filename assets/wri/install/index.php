<style>
p {
	margin: 0;
	color: green;
}
strong {
	display: block;
	color: red;
}
</style>
<?php
/*
//TODO
======
Nom zip phpbb...version
phpbb.zip : ajouter install
purge forum : ajouter doc/...

//DOC
=====
Pour des coller au max avec les process d'instal du forum (qui sont quand même une bonne base de notre site, j'ai réorganisé les modeles et config :
Le modèle de .htaccess se trouve en /install/modeles/.htaccess
Les paramètres de confs privée se trouvent dans /forum/config.php (qui n'est pas inclus dans le git)
Les paramètres additionels de refuges.info sont ajoutés au /forum/config.php  et leur modèle est dans /install/modeles/config.php
*/
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>COOKIE = ".var_export($_COOKIE,true).'</pre>';
//*DCMM*/echo"<pre style='background-color:white;color:black;font-size:14px;'>POST = ".var_export($_POST,true).'</pre>';

// Fichier destiné à guider l'installation ou l'upgrade d'une configuration de refuges.info

error_reporting(E_ALL | E_STRICT);
ini_set('display_errors', 'on');
ini_set("log_errors", 'on');

/* Etat de refuges.info */
// Fichier .htaccess
if (!file_exists('../.htaccess')) {
	echo '<div>Initialisation du fichier .htaccess</div>';
	copy ('../htaccess.modele.txt', '../.htaccess');
} else
	echo '<p>Fichier .htaccess présent</p>';

// Fichier config_privee.php
if (!file_exists('../config_privee.php')) {
	echo '<div>Initialisation du fichier config_privee.php</div>';
	if (file_exists('../../config_privee.php')) 
		// On peut mettre un config_privee.php perso dans le répertoire en dessous de la racine du site
		copy ('../../config_privee.php', '../config_privee.php');
	else
		copy ('../config_privee.php.modele', '../config_privee.php');
} else
	echo '<p>Fichier config_privee.php présent</p>';

// Connexion à la base
include ('../includes/bdd.php');
$query="SELECT * FROM information_schema.tables";
$res = $pdo->query($query);
if (!$res) {
	echo '<strong>Les paramètres de config_privee.php ne permettent pas de se connecter à la base</strong>';
	exit;
} else
	echo '<p>Connexion à PGSQL OK</p>';


/* Etat de phpBB */
// Version phpbb disponible dans le répertoire /install
$phpbb_version_disponible = null;
$forum_zip = glob ('phpBB*prod*.zip');
if ($forum_zip) {
	preg_match ('/[0-9]+\.[0-9]+\.[0-9]+/', $forum_zip[0], $match);
	if ($match)
		$phpbb_version_disponible = $match[0];
}
if ($phpbb_version_disponible)
	echo "<p>Version phpBB disponible : $phpbb_version_disponible</p>";
else
	echo "<div>Pas de phpBB livré</div>";

// Etat des fichiers installés
$phpbb_version_fichiers = null;
if (file_exists ('../forum/includes/constants.php')) {
	define('IN_PHPBB', true);
	include ('../forum/includes/constants.php');
	$phpbb_version_fichiers = PHPBB_VERSION;
}
if (!$phpbb_version_fichiers)
	echo "<strong>Pas de fichiers phpBB installés</strong>";
elseif ($phpbb_version_fichiers != $phpbb_version_disponible)
	echo "<strong>Version phpBB des fichiers installés : $phpbb_version_fichiers</strong>";
else
	echo "<p>Version phpBB des fichiers installés : $phpbb_version_fichiers</p>";

// Etat de la base phpBB
$phpbb_version_bdd = null;
if (file_exists('../forum/config.php')) {
	include ('../forum/config.php');
	$query="SELECT config_value FROM ".$table_prefix."config WHERE config_name = 'version'";
	$res = $pdo->query($query);
	if ($res)
		$phpbb_version_bdd = $res->fetch()->config_value;
}
																			$phpbb_version_bdd = null;
if (!$phpbb_version_bdd)
	echo "<strong>Pas de base de donnée phpBB installée</strong>";
elseif ($phpbb_version_bdd != $phpbb_version_disponible)
	echo "<strong>Version phpBB base de donnée : $phpbb_version_bdd</strong>";
else
	echo "<p>Version phpBB base de donnée : $phpbb_version_bdd</p>";

// Installation ou écrasement des fichiers phpBB pour être au même niveau que la base
if (!$phpbb_version_fichiers ||
	(!$phpbb_version_bdd && !is_dir('../forum/install')) ||
	($phpbb_version_bdd && $phpbb_version_fichiers != $phpbb_version_bdd)) {
	echo '<div>Installation ou écrasement des fichiers phpBB pour être au même niveau que la base</div>';
	if ($phpbb_version_bdd)
		$zip_file = 'phpBB-'.$phpbb_version_bdd.'_prod_FR.zip';
	else
		$zip_file = 'phpBB-'.$phpbb_version_disponible.'_prod_FR.zip';
	if (!file_exists($zip_file)) {
		echo "<strong>Fichier $zip_file manquant</strong>";
	} else {
		echo "<div>Décompression de $zip_file dans ".__DIR__."/../forum/</div>";
		ob_flush ();
		flush ();
		system ('unzip -oqd ../forum/ '.$zip_file);
		echo "<p>Fin de décompression. <a href='./'>RELANCER L'INSTALLATION</a></p>";
	}
	exit;
}

// On a les bons fichiers mais il n'y a pas de base phpBB installée
if (!$phpbb_version_bdd) {
	echo '<div>Installation de la base de données phpBB <a href="../forum//app.php/update">INSTALLER</a></div>';
	exit;
}

// C'est fini !
echo "<div>Purge des fichiers phpBB install & cache</div>";
system ('rm -r ../forum/install');
system ('rm -r ../forum/doc');
system ('rm -r ../forum/cache/installer');
system ('rm -r ../forum/cache/production');
echo "<p><b>Votre installation, est à jour</b></p>";
echo "<div><a href='../'>SE CONNECTER</div>";

exit;/////////////////////////////////////

// Etat fichiers phpBB
if (!file_exists('../forum/common.php')) {
}

// Si les fichiers du forum ne sont pas là
if (!file_exists('../forum/common.php')) {
	//unzip ('', '');
	//TODO vérifier version dans la base
}

// S'il n'est pas installé
if (!file_exists('../forum/config.php')) {
	setcookie('lang', 'fr', time()+3600, '/');
	echo '<p>Exécutez l\'installation du forum <a href="../forum/install/app.php/install">INSTALLER PHPBB</a></p>';
}

function unzip ($fichier, $rep) {
	echo "<p>Extraction des fichiers de $fichier . . .</p>";
	ob_flush ();
	flush ();
	$zip = new ZipArchive;
	$res = $zip->open($fichier);
	if (!$res) {
		echo "<p>Fichier $fichier inexistant ou incorrect</p>";
		exit;
	}
	echo "<p>Fin de l\'extraction des fichiers de $fichier</p>";
}

include ('../config_privee.php');
foreach ($config_wri AS $k=>$v)
	if ($v && $v[0] == '?') {
		echo "<p>Renseigner le champs \$config_wri['$k'] de /config_privee.php</p>";
		$stop = true;
	}
if (isset ($stop)) {
	$dirs = explode ('/', __dir__);
	if (count ($dirs) == 1)
		$dirs = explode ('\\', __dir__); // Windows
	array_pop($dirs);
	array_pop($dirs);
	echo '<p>Ou mettez un fichier config_privee.php déjà configuré dans le répertoire '.implode ('/', $dirs).'</p>';
	exit;
}

