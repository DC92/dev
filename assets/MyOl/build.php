<title>Build distribution files</title>
<a style="float:right;margin-right:15px" href=".">HOME</a>
<h1>Build distribution files</h1>

<?php
$js = $css = ["/** OPENLAYERS ADAPTATION
 * © Dominique Cavailhez 2017
 * https://github.com/Dominique92/MyOl
 * Based on https://openlayers.org
 *
 * This file has been generated by build.php from the src/... sources
 * Please don't modify it : modify src/... & rebuild it !
 */"];
echo "<p>";

$css[] = get ('controls.css');
$css[] = get ('layerSwitcher.css');
$css[] = get ('marker.css');
$css[] = get ('editor.css');
file_put_contents ('myol.css', implode ('

', $css));
echo "TO myol.css</p>\n<p>";

$js[] = get ('header.js');
$js[] = get ('layerTileCollection.js');
$js[] = get ('layerVector.js');
$js[] = get ('layerVectorCollection.js');
$js[] = get ('controls.js');
$js[] = get ('layerSwitcher.js');
$js[] = get ('files.js');
$js[] = get ('gps.js');
$js[] = get ('marker.js');
$js[] = get ('editor.js');
file_put_contents ('myol.js', implode ("\n\n", $js));
echo 'TO myol.js</p>';

function get ($file) {
	echo "$file, ";
	return preg_replace (
		"/\n?[ \t]*\/\/([A-Z]|jshint)[^\n]*/", "",
		"/* FILE src/$file */\n" .file_get_contents ("src/$file")
	);
}
?>

<p><a href="build.php">REBUILD</a></p>