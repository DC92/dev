<?php
// General tuning
define('MYPHPBB_POST_EMPTY_TEXT', true);
define('MYPHPBB_POST_EMPTY_SUBJECT', true);
define('MYPHPBB_POSTING_WITHOUT_FID', true);
define('MYPHPBB_REDIRECT', true);
define('MYPHPBB_BBCODE_INCLUDE', true);
//define('MYPHPBB_BBCODE_INCLUDE_TRACE', true);
define('MYPHPBB_SHORTCUT', true);
define('MYPHPBB_LOG_EDIT', true);
define('MYPHPBB_CREATE_POST_BUTTON', true);
//define('MYPHPBB_DISABLE_VARNISH', true);
//define('MYPHPBB_DUMP_GLOBALS', '_SERVER');
//define('MYPHPBB_DUMP_TEMPLATE', true);

// Specific chemineur.fr
$mapKeys = [
	// Get your own (free) IGN key at http://professionnels.ign.fr/ign/contrats
	'ign' => 'hcxdz5f1p9emo4i1lch6ennl',
	// Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
	'thunderforest' => 'ee751f43b3af4614b01d1bce72785369',
	// Get your own (free) os key at https://osdatahub.os.uk/
	'os' => 'P8MjahLAlyDAHXEH2engwXJG6KDYsVzF',
	// Get your own (free) BING key at https://www.microsoft.com/en-us/maps/create-a-bing-maps-key
	'bing' => 'ArLngay7TxiroomF7HLEXCS7kTWexf1_1s1qiF7nbTYs2IkD3XLcUnvSlKbGRZxt',
	// Get your mapquest (free) key in : https://developer.mapquest.com/
	'mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', // Calcul altitude
	'keys-mapquest' => 'Fmjtd%7Cluur2968n1%2C70%3Do5-90rs04', //TODO DELETE
	// SwissTopo : You need to register your domain in
	// https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
];
