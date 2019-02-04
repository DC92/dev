<?php
// phpBB 3.2.x auto-generated configuration file
// Do not change anything in this file!
$dbms = 'phpbb\\db\\driver\\mysqli';
$dbhost = 'localhost';
$dbport = '';
$dbname = 'geobbt';

if ($_SERVER['SERVER_NAME'] == 'astro')
	$dbname = 'astro';

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
//	'IGN' => 'd27mzh49fzoki1v3aorusg6y', // ASPIR Commande n° 207839 Contrat n° 0269018 Expire le 20/10/2019 .*chemineur.fr,.*dc9.fr,.*cavailhez.fr,localhost,.*.github.io,.*refuges.info / 82.165.82.82,90.91.128.17
//	'IGN' => 'jv1hl9ntrac8q5aycla6wc5f', // WRI Commande n° 118986 Contrat n° 0148807 Expire le 03/07/2019 https://www.refuges.info/ //TODO *.refuges.info
	'IGN' => 'hcxdz5f1p9emo4i1lch6ennl', // Tous DOM Commande n° 118826 Contrat n° 0148608 Expire le 02/07/2019 / *chemineur.fr,*.dc9.fr,*cavailhez.fr,localhost,*.github.io //TODO reprendre ressources 207839
	'thunderforest' => 'a54d38a8b23f435fa08cfb1d0d0b266e',
	'bing' => 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
	'mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', // Calcul altitude
	'EPSG21781' => true, // Coordonnées suisses
];

/*
Commande n° 207839 Contrat n° 0269018 Expire le 20/10/2019 aspir.dc9	d27mzh49fzoki1v3aorusg6y
.*chemineur.fr,.*dc9.fr,.*cavailhez.fr,localhost,.*.github.io,.*refuges.info
82.165.82.82,90.91.128.17
==> aspir.dc9.fr

Commande n° 118986 Contrat n° 0148807 Expire le 03/07/2019 jv1hl9ntrac8q5aycla6wc5f
https://www.refuges.info/	==>		*.refuges.info

Commande n° 118826 Contrat n° 0148608 Expire le 02/07/2019 hcxdz5f1p9emo4i1lch6ennl
*chemineur.fr,*.dc9.fr,*cavailhez.fr,localhost,*.github.io
82.165.82.82
==> *chemineur.fr,*dc9.fr,*cavailhez.fr,localhost,*.github.io

Commande n° 117170 Contrat n° 0146521 Expire le 14/06/2019 u4hpldmxue119tub15yh5mde
http://v3.chemineur.fr/

Commande n° 109779 Contrat n° 0136905 Expire le 29/03/2019 1nxqfnrnhph73nqh80izju6j
test.chemineur.fr

*/
