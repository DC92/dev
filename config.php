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

$geo_olkeys = "{
IGN: 'd27mzh49fzoki1v3aorusg6y',
thunderforest: 'a54d38a8b23f435fa08cfb1d0d0b266e',
bing: 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt'
}";

/*$post_shema = [
	// Equipements
	'geo_contention' => 'text',
	'geo_filets' => 'int(11)',
	'geo_postes' => 'int(11)',
	// Caractéristiques
	'geo_topographie' => 'text',
	'geo_superficie' => 'int(11)',
	'geo_quartiers' => 'text',
	'geo_vegetation' => 'text',
	'geo_ign' => 'varchar(50)',
	'geo_reseau' => 'text',
	'geo_commune' => 'varchar(50)',
	// Accès
	'geo_acces' => 'text',
	'geo_parcours' => 'text',
	'geo_ravitaillement' => 'text',
	// Mesures environnementales
	'geo_mae' => 'tinyint(1)',
	'geo_reserve' => 'varchar(50)',
	// Autres usagers
	'geo_usagers' => 'text',
	// Héliportage
	'geo_heliportage' => 'text',
	// Logement
	'geo_logement' => 'text',
	'geo_douche' => 'tinyint(1)',
	'geo_wc' => 'tinyint(1)',
	'geo_rangements' => 'text',
	'geo_pieces' => 'int(11)',
	'geo_surface' => 'int(11)',
	'geo_gaziniere' => 'tinyint(1)',
	'geo_gaz' => 'tinyint(1)',
	'geo_eau' => 'tinyint(1)',
	'geo_electricite' => 'text',
	'geo_ustensiles' => 'text',
	'geo_literie' => 'text',
	'geo_bois' => 'text',
	'geo_ravitaillement' => 'text',
	'geo_famille' => 'tinyint(1)',
];*/
