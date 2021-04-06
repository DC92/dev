<?php
$_GET['format'] = 'gml';

if (@$_GET['poi'][0] == 'e')
	$_GET['cat'] = '3,8'; // Refuges & abris
else
	$_GET['type'] = '21'; // Points d'eau

define ('PHPBB_ROOT_PATH', '../');
include ('../ext/Dominique92/GeoBB/gis.php');
