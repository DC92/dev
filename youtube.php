<?php
file_put_contents ('LOG/youtube.txt', var_export ([
	'DATE' => date('r'),
	'REMOTE_ADDR' => $_SERVER['REMOTE_ADDR'],
	'HTTP_USER_AGENT' => @$_SERVER['HTTP_USER_AGENT'],
	'HTTP_REFERER' => $_SERVER['HTTP_REFERER'],
	'UNIQUE_ID' => $_SERVER['UNIQUE_ID'],
], true), FILE_APPEND);

echo '<meta http-equiv="refresh" content="0;URL=https://youtu.be/'.$_GET['y'].'">';