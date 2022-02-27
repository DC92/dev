<?php
// Calculate relative paths between the requested url & the GPS package directory
if (!isset ($entry_url)) // Initial GPS url
	$entry_url = parse_url($_SERVER['HTTP_REFERER'], PHP_URL_PATH);

$url_dirs = explode ('/', pathinfo ($entry_url, PATHINFO_DIRNAME));
$script_dirs = explode ('/', str_replace ($_SERVER['DOCUMENT_ROOT'], '', __DIR__));

while (count ($url_dirs) && count ($script_dirs) && $url_dirs[0] == $script_dirs[0]) {
	array_shift ($url_dirs); // Remove common part of the paths
	array_shift ($script_dirs);
}
$url_dirs[] = ''; // Add last / if necessary
$script_dirs[] = ''; // Add last / if necessary
$url_path = str_repeat ('../', count ($script_dirs) - 1) .implode ('/', $url_dirs);
$script_path = str_repeat ('../', count ($url_dirs) - 1) .implode ('/', $script_dirs);

function read_replace ($file_name, $changes) {
	return str_replace (
		array_keys ($changes),
		$changes,
		file_get_contents ($file_name)
	);
}

//*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>url_path = ".var_export($url_path,true).'</pre>'.PHP_EOL;
//*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'>script_path = ".var_export($script_path,true).'</pre>'.PHP_EOL;
?>