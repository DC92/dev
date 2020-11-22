<!DOCTYPE html>
<?php
// Trace
$_COOKIE['REFERER'] = @$_SERVER['HTTP_REFERER'];
$_COOKIE['IP'] = $_SERVER['REMOTE_ADDR'];
$_COOKIE['AGENT'] = $_SERVER['HTTP_USER_AGENT'];
$_COOKIE['TIME'] = date(DATE_RFC2822);
file_put_contents ('../../../LOG/visio.LOG', var_export($_COOKIE,true), FILE_APPEND);

// Enregistre le code
if (@$_POST['code']) {
	setcookie ('code', $_POST['code'], time() + 31*24*3600);
	$_COOKIE['code'] = $_POST['code'];
}

// Vérification et routage
include ('../../../config.php');
if (strpos (@$_COOKIE['code'], $myphp_template['code_visio']) !== false && isset($_GET['anim']))
	exit ('<meta http-equiv="refresh" content="0;URL=https://meet.jit.si/'.$myphp_template['code_visio'].'-'.$_GET['anim'].'">');
?>

<html dir="ltr" lang="fr">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<link rel="icon" type="image/jpg" href="styles/prosilver/theme/images/icon.jpg" />
	<title>Accés visioconférence</title>
	<link href="styles/prosilver/theme/stylesheet.css" rel="stylesheet" />
</head>

<body class="gym gym-index">
	<div class="banniere">
		<h1>
			<a title="Retour à l'accueil" href=".">
				Chavil' Gym<span> Volontaire</span>
			</a>
		</h1>
	</div>

	<p>Les séances par visioconférence étant réservées aux adhérents,
	veuillez saisir le code qui vous a été donné par votre association.</p>

	<?php if (!isset($_GET['anim'])) { ?>
		<p style="color:red;font-weight:bold">Pas d'animateur spécifié</p>
	<?php } else{ ?>
		<form action="<?=$_SERVER['REQUEST_URI']?>" method="post">
			<input name="code" type="text" style="width:200px">
			<button type="submit">Envoyer</button>
		</form>

	<?php if (@$_POST['code']) { ?>
		<p style="color:red;font-weight:bold">Le code fourni n'est pas (ou plus) valable</p>
	<?php }} ?>

	<p>Si vous rencontrez des problèmes,
		<a href="../../../memberlist.php?mode=contactadmin">
			vous pouvez nous contacter ICI
		</a>
	</p>
</body>
</html>
