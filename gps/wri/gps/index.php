<?php
$overlay = "layerRefugesInfo({baseUrl:'//{$_SERVER['SERVER_NAME']}/'})";

include ('../config_privee.php');
$ign_key = $config_wri['ign_key'];
$thunderforest_key = $config_wri['thunderforest_key'];
$bing_key = $config_wri['bing_key'];

include ('../MyOl/gps/index.php');