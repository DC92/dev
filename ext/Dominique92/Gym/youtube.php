<meta name="robots" content="noindex, nofollow">

<?php
file_put_contents ('../../../LOG/youtube.txt', var_export ([
	'date' => date(DATE_RFC2822),
	'query' => $_SERVER['QUERY_STRING'],
	'ip' => $_SERVER['REMOTE_ADDR'],
	'referer' => @$_SERVER['HTTP_REFERER'],
	'agent' => @$_SERVER['HTTP_USER_AGENT'],
], true), FILE_APPEND);

echo '<meta http-equiv="refresh" content="0;URL=https://youtu.be/'.$_GET['y'].'">';