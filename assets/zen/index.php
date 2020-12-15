<!DOCTYPE html>
<?php
	// Force https
	if ($_SERVER['REQUEST_SCHEME'] == 'http')
		header('Location: https://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']);

	// Varnish will not be caching pages where you are setting a cookie
	setcookie('disable-varnish', microtime(true), time()+600, '/');
	header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 1)); // 1 second

	// Calculate relative paths between the requested url & the ZEN package directory
	$dir = pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_DIRNAME);
	$base_path = str_replace ($dir.'/', '', __DIR__.'/');
	$script = $base_path .pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_FILENAME);

	$js = [];
	foreach (glob ($base_path.'*', GLOB_ONLYDIR ) AS $filename) {
		preg_match('/([a-z]+)$/', $filename, $m);
		if ($m) {
			$js[] = "sons.{$m[1]} = [];";
			$js[] = "liaisons.{$m[1]} = [];";
		}
	}
	foreach (glob ($base_path.'*/*.mp3') AS $filename) {
		preg_match('/([a-z]+)\/([a-z ]+\.mp3)/', $filename, $m);
		if ($m)
			$js[] = "sons.{$m[1]}.push('$filename');";
	}
	foreach (glob($base_path.'*/*.txt') as $filename) {
		preg_match('/([a-z ]+)\/[a-z ]+\.txt/', $filename, $rep);
		preg_match_all('/([a-z]+)[ |\.]/', $filename, $files);

		if ($files && $rep)
			foreach ($files[1] AS $f) {
				if (!is_dir($base_path.$f))
					echo "<p>Répertoire <u>$f</u> inexistant dans $filename</p>";
				if (!is_dir($base_path.$rep[1]))
					echo "<p>Répertoire <u>{$rep[1]}</u> inexistant dans $filename</p>";
				$js[] = "liaisons.{$rep[1]}.push('$f');";
				$js[] = "liaisons.$f.push('{$rep[1]}');";
			}
	}
?>

<html dir="ltr" lang="fr">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width, initial-scale=1" />

	<title>ZEN</title>
	<link href="<?=$base_path?>zen.svg" rel="shortcut icon" />

	<link href="<?=$script?>.css?<?=filesize($script.'.css')?>" rel="stylesheet">
	<script src="<?=$script?>.js?<?=filesize($script.'.js')?>" defer></script>
	<script>
		// Définition des sons
		var sons = [],
			liaisons = [];
		<?php echo implode ("\n\t\t", $js).PHP_EOL?>
	</script>
</head>

<body>
	<a id="boot" onclick="init(this)">
		<p>Allongez-vous dans un endroit calme</p>
		<p>Mettez un casque</p>
		<p>Cliquez ou touchez l'écran</p>
		<p>Posez le mobile sur votre ventre</p>
	</a>

	<div id="icone" onclick="location.reload()">
		<img src="<?=$base_path?>zen.svg" />
	<div>

	<div id="trace"></div>
</body>
</html>