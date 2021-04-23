<?php
$css = '';
$js = '';

$css .= get ('myol.css');
$css .= get ('layerSwitcher.css');

$js .= get ('misc.js');
$js .= get ('tileLayers.js');
$js .= get ('layerSwitcher.js');
$js .= get ('myol.js');

echo "<p>Write myol.css</p>";
file_put_contents ('myol.css', $css);
echo "<p>Write myol.js</p>";
file_put_contents ('myol.js', $js);

function get ($file) {
	echo "<p>Read src/$file</p>";
	$text = file_get_contents ("src/$file");
	$texts = explode ('/*--*/', $text);

	return isset ($texts[1]) ? $texts[1] : $text;
}