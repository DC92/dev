<?php
$bureau = [
	'dominique.cavailhez@gmail.com' => 'Dominique',
//	'antoine.dael@wanadoo.fr' => '.*',
];

$animateurs = [
	'dominique@cavailhez.fr' => 'Marie-Thérèse',
/*
		'bullier.chaville@free.fr' => 'Martine',
		'mtduclos@yahoo.fr' => 'Marie-Thérèse',
		'nataly3d.prigent@gmail.com' => 'Nathalie',
		'eberpascale@gmail.com' => 'Pascale',
		'christine@lemarquand.fr' => 'Christine',
		'catherine.jegou@googlemail.com' => 'Catherine',
		'simon.rose@neuf.fr' => 'Rose',
		'corinne.lemaire@hotmail.fr' => 'Corinne',
		'florina.morin@free.fr' => 'Florina',
		'theo.canaple@wanadoo.fr' => 'Théo',
		'jieungenouville@yahoo.fr' => 'Ina-Jieun',
		'f.carcelli@gmail.com' => 'Florence',
	'mireille.simonnet@hotmail.fr' => 'Mireille',
	'spapin8@gmail.com' => 'Sandrine',
	'auroregauer@sfr.fr' => 'Aurore',
	'yogasanum@gmail.com' => 'Armelle',
	'filtre.kiara@gmail.com' => 'Martine-LT',
	'cheick-cisse@hotmail.com' => 'Cheick',
	'alyssa.dijoux@live.fr' => 'Alyssa',
	'asemain@yahoo.com' => 'Arnaud',
	'gabrielfauchart@gmail.com' => 'Gabriel',
	'lydialabadi@hotmail.com' => 'Lydia',
	'aurelie.alcindor@gmail.com' => 'Aurélie',
	'viennet.lydie@orange.fr' => 'Lydie',
	'realromano@live.fr' => 'Romain',
	*/
];

$mois = [
	'01' => 'janvier',
	'02' => 'février',
	'03' => 'mars',
	'04' => 'avril',
	'05' => 'mai',
	'06' => 'juin',
	'07' => 'juillet',
	'08' => 'aout',
	'09' => 'septembre',
	'10' => 'octobre',
	'11' => 'novembre',
	'12' => 'décembre',
];

/**
* Compute inputs
*/
$mail = isset($_GET['logout'])
	? null
	: urldecode(@$_POST['mail'] ?: @$_COOKIE['mail']);
$prenom = @($bureau + $animateurs)[$mail];
$est_bureau = @$bureau[$mail];
$sid = @$_GET['sid'] ?: @$_COOKIE['sid'];
$md5 = md5($_SERVER['REMOTE_ADDR'].$mail);

setcookie('mail', $mail);
setcookie('sid', $sid);

if (@$_GET['sid'] == $md5)
	echo '<p style="color:red">Vérification approuvée.</p>';

/**
* Identification
*/
echo '<p><b>Outil de paye de Chavil\'GYM</b></p>';

if ($mail && !$prenom)
	echo "<p style='color:red'>Mail <b>$mail</b> inconnu.<p>";


if ($prenom) { ?>
	<a href="index.php?logout" style="float:right">Déconnection</a>
	<p>Bonjour <?=$prenom?></p>
<? } else { ?>
	<p>Pour vous identifier, saisissez votre adresse mail :</p>
	<form action="index.php" method="POST">
		<p><input type="text" name="mail" size="50" /></p>
		<p><input type="submit" value="Soumettre" /></p>
	</form>
<?	exit;
}

/**
* Vérif pour membre du bureau
*/
if ($est_bureau && ($sid != $md5)) {
	require 'PHPMailer/PHPMailerAutoload.php';
	$mailer = new PHPMailer;
	$mailer->CharSet = 'UTF-8';
	$mailer->SMTPDebug = 3; // Enable verbose debug output
	$mailer->FromName = 'Chavil\'GYM';
	$mailer->From = 'chavil.gym@cavailhez.fr';
	$mailer->addAddress ('dominique.cavailhez@gmail.com');
	$mailer->Subject = 'Validation de votre connexion à chavil.gym/paie';
	$mailer->Body = 'Pour valider votre connexion à chavil.gym/paie, cliquez <a href="https://c92.fr/paie?sid='.$md5.'">ICI</a>';

	if ($mailer->ErrorInfo)
		echo $mailer->ErrorInfo;
	else
		$mailer->Send();

	echo '<p>Un mail de vérification vient de vous être envoyé.</p>';
	exit;
}

/**
* Upload files
*/
include ('PdfParser.php'); // https://gist.github.com/smalot/6183152

if ($est_bureau) { ?>
	<form method="post" enctype="multipart/form-data">
		Nouveau bulletin
		<input type="file" id="file" name="file">
		<button>Envoyer</button>
	</form>

	<? if (isset ($_FILES['file'])) {
		$pdf = PdfParser::parseFile ($_FILES['file']['tmp_name']);
		preg_match('/emploi : du ([0-9]+)\/([0-9]+)\/([0-9]+)/', $pdf, $date);
		preg_match('/Prénom : ([^ ]+)/', $pdf, $prenom_compose);

		if (count($date) < 4 || count($prenom_compose) < 2) return;

		$prenoms = explode('-',$prenom_compose[1]);
		foreach ($prenoms AS $k=>$v)
			$prenoms[$k] = ucfirst (str_replace (['é','è'], 'e', mb_strtolower ($v, 'UTF-8')));

		$local_file_name = '20'.$date[3].'-'.$date[2].'-'.implode('-', $prenoms).'.pdf';

		// Copy file
		$ok = move_uploaded_file($_FILES['file']['tmp_name'], 'pdf/'.$local_file_name);
		if ($ok)
			echo '<p style="color:red">Le fichier <b>'.$local_file_name.'</b> à été chargé</p>';
	}
}

/**
* Download files
*/
else {
	$files = glob('pdf/*'.str_replace(['é','è'], 'e', $prenom).'.pdf');
/*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'> = ".var_export($files,true).'</pre>'.PHP_EOL;
}
?>
