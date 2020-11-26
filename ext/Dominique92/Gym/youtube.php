<meta name="robots" content="noindex, nofollow">

<?php
file_put_contents ('../../../LOG/youtube.txt', var_export ([
file_put_contents ('LOG/visio.LOG', var_export([
	'date' => date(DATE_RFC2822),
	'query' => $this->server['QUERY_STRING'],
	'ip' => $this->server['REMOTE_ADDR'],
	'referer' => @$this->server['HTTP_REFERER'],
	'agent' => @$this->server['HTTP_USER_AGENT'],
], true), FILE_APPEND);

echo '<meta http-equiv="refresh" content="0;URL=https://youtu.be/'.$_GET['y'].'">';