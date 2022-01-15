<?php
$servers = [
	'ecmaps.de' => 'http://ec1.cdn.ecmaps.de/WmsGateway.ashx.jpg',
];

$type = @$_GET['type'];
if ($type)
	unset ($_GET['type']);

$s = @$_GET['s'];
if ($s)
	unset ($_GET['s']);
$url = @$servers[$s];

if ($url && $type) {
	$img = file_get_contents ($url.'?'.http_build_query ($_GET));
	header('Content-Type: image/'.$type);
	header('Cache-Control: max-age='.(31*24*3600));
	echo $img;
} else {
	/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>server = ".var_export($s,true).'</pre>'.PHP_EOL;
	/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>url = ".var_export($url,true).'</pre>'.PHP_EOL;
	/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>type = ".var_export($type,true).'</pre>'.PHP_EOL;
	/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>args = ".var_export($_GET,true).'</pre>'.PHP_EOL;
	/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>img = ".var_export($img,true).'</pre>'.PHP_EOL;
}

/*
https://chemineur.fr/assets/proxy/?s=ecmaps.de&type=x-icon&Experience=ecmaps&MapStyle=KOMPASS%20Touristik&TileX=545&TileY=357&ZoomLevel=10
*/