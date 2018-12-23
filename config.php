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

@define('TRACES_DOM', 'test');
@define('META_ROBOTS', 'noindex, nofollow');

$geo_keys = [
	'IGN' => 'd27mzh49fzoki1v3aorusg6y',
	'thunderforest' => 'a54d38a8b23f435fa08cfb1d0d0b266e',
	'bing' => 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
	'mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', // Calcul altitude
	'EPSG21781' => true, // Coordonnées suisses
];
