<?php
// phpBB 3.2.x auto-generated configuration file
// Do not change anything in this file!
$dbms = 'phpbb\\db\\driver\\mysqli';
$dbhost = 'localhost';
$dbport = '';
$dbname = 'geobb32';
$dbuser = 'root';
$dbpasswd = '';
$table_prefix = 'phpbb_';
$phpbb_adm_relative_path = 'adm/';
$acm_type = 'phpbb\\cache\\driver\\file';

@define('PHPBB_INSTALLED', true);
// @define('PHPBB_DISPLAY_LOAD_TIME', true);
@define('PHPBB_ENVIRONMENT', 'production');
// @define('DEBUG_CONTAINER', true);

error_reporting(E_ALL & ~E_NOTICE);
ini_set('display_errors', 'on');

define('TRACES_DOM', 'test');
define('META_ROBOTS', 'noindex, nofollow');

$geo_keys = [ 
	'ign' => 'hcxdz5f1p9emo4i1lch6ennl', // Tous DOM Commande n° 233882 Contrat n° 0303063 Expire le 03/07/2020 / .*chemineur.fr,.*dc9.fr,.*c92.fr,.*cavailhez.fr,.*github.io,localhost ou 90.127.71.109
//	'IGN' => '80yf96egxfs7idpzh84se3cz', // WRI Commande n° 232251 Contrat n° 0300951 Expire le 15/06/2020 / .*refuges.info
//	'IGN' => 'd27mzh49fzoki1v3aorusg6y', // Alpages Commande n° 207839 Contrat n° 0269018 Expire le 20/10/2019 / alpages.info
	'thunderforest' => 'ee751f43b3af4614b01d1bce72785369', // localhost, github.io
	'bing' => 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
//	'mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', // Calcul altitude
//	'EPSG21781' => true, // Coordonnées suisses
	'initialFit' => '7/5/45',
];
