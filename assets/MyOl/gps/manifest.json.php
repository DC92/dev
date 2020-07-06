<?php
$manifest = file_get_contents ('manifest.json');

if (isset ($_GET['src']))
	$manifest = str_replace ('index.html', $_GET['src'], $manifest);

echo $manifest;