<!DOCTYPE html>
<?php
	// Force https
	if ($_SERVER['REQUEST_SCHEME'] == 'http')
		header('Location: https://'.$_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI']);

	// Varnish will not be caching pages where you are setting a cookie
	setcookie('disable-varnish', microtime(true), time()+600, '/');
	header('Expires: '.gmdate('D, d M Y H:i:s \G\M\T', time() + 1)); // 1 second

	// Calculate relative paths between the requested url & the ZEN package directory
	$script_filename = pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_FILENAME);
	$dir = pathinfo ($_SERVER['SCRIPT_FILENAME'], PATHINFO_DIRNAME);
	$base_path = str_replace ($dir.'/', '', __DIR__.'/');

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

	<style>
		html, body {
			height : 100%;
			margin: 0;
			background: black;
			color: white;
		}
		#boot {
			position: absolute;
			z-index: 10;
			top: 0;
			left: 0;
			margin: 0;
			height : 100vh;
			width : 100vw;
			background: #432;
			text-align: center;
			font-size: 5vw;
			text-decoration: none;
			color: white;
			cursor: pointer;
		}
		#boot p:first-child {
			padding-top: calc(50vh - 7em);
			margin: 0;
		}
		img {
			width: 10%;
			height: 10%;
			position: absolute;
			top: 45%;
			left: 45%;
		}
	</style>

	<script>
		//********************
		// Définition des sons
		var sons = [],
			liaisons = [];
		<?php echo implode ("\n\t\t", $js)?>

		// Enlève les doublons
		for (let i in liaisons)
			liaisons[i] = Array.from(new Set(liaisons[i]));
	</script>
	<script defer src="<?=$base_path.$script_filename?>.js?<?=time()?>"></script>
</head>

<body>
	<a id="boot" onclick="init(this)">
		<p>Allongez-vous dans un endroit calme</p>
		<p>Mettez un casque</p>
		<p>Cliquez ou touchez l'écran</p>
		<p>Posez le mobile sur votre ventre</p>
	</a>

	<img id="icone" src="<?=$base_path?>zen.svg" onclick="location.reload()" />

	<div id="trace">trace</div>
</body>
</html>