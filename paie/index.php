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

include 'PHPMailer/PHPMailerAutoload.php'; //https://github.com/PHPMailer/PHPMailer
include 'PdfParser.php'; // https://gist.github.com/smalot/6183152

/**
* Compute inputs
*/
$gymmail = isset($_GET['logout'])
	? null
	: urldecode(@$_POST['gymmail'] ?: @$_COOKIE['gymmail']);
$prenom = @($bureau + $animateurs)[$gymmail];
$est_bureau = @$bureau[$gymmail];
$gymsid = @$_GET['gymsid'] ?: @$_COOKIE['gymsid'];
$md5 = md5($_SERVER['REMOTE_ADDR'].$gymmail);

setcookie('gymmail', $gymmail);
setcookie('gymsid', $gymsid);

if (@$_GET['gymsid'] == $md5 && @$_COOKIE['gymsid'] != $md5)
	echo '<p style="color:red">Vérification approuvée.</p>';

/**
* Identification
*/
echo '<p><b>Archives des bulletins de salaire de Chavil\'GYM</b></p>';

if ($gymmail && !$prenom)
	echo "<p style='color:red'>Mail <b>$gymmail</b> inconnu.<p>";

if ($prenom) { ?>
	<a href="index.php?logout" style="float:right">Déconnection</a>
	<p>Bonjour <?=$prenom?></p>
<? } else { ?>
	<p>Pour vous identifier, saisissez votre adresse mail :</p>
	<form action="index.php" method="POST">
		<p><input type="text" name="gymmail" size="50" /></p>
		<p><input type="submit" value="Soumettre" /></p>
	</form>
<?	exit;
}

/**
* Vérif pour membre du bureau
*/
if ($est_bureau && ($gymsid != $md5)) {
	$mailer = new PHPMailer;
	$mailer->CharSet = 'UTF-8';
	$mailer->SMTPDebug = 3; // Enable verbose debug output
	$mailer->FromName = 'Chavil\'GYM';
	$mailer->From = 'chavil.gym@cavailhez.fr';
	$mailer->addAddress ('dominique.cavailhez@gmail.com');
	$mailer->Subject = 'Validation de votre connexion à chavil.gym/paie';
	$mailer->Body = 'Pour valider votre connexion à chavil.gym/paie, cliquez <a href="https://c92.fr/paie?gymsid='.$md5.'">ICI</a>';

	if ($mailer->ErrorInfo)
		echo $mailer->ErrorInfo;
	else
		$mailer->Send();

	echo '<p>Un mail de vérification de votre connexion vient de vous être envoyé.</p>';
	exit;
}

/**
* Trésorier : upload files
*/
if ($est_bureau) { ?>
	<hr />
	<form method="post" enctype="multipart/form-data">
		Pour archiver des bulletins<br />(Ctrl+click pour multiple)<br />
		<input type="file" id="file" name="file[]" multiple ="true">
		<button>Envoyer</button>
	</form>

	<? 
	if (isset ($_FILES['file']))
		foreach ($_FILES['file']['name'] AS $k=>$f) {
			$tmp = $_FILES['file']['tmp_name'][$k];
			$pdf = PdfParser::parseFile ($tmp);
			preg_match('/emploi : du ([0-9]+)\/([0-9]+)\/([0-9]+)/', $pdf, $date);
			preg_match('/Prénom : ([^ ]+)/', $pdf, $prenom_compose);

			if (count($date) < 4 || count($prenom_compose) < 2) return;

			$prenoms = explode('-',$prenom_compose[1]);
			foreach ($prenoms AS $k=>$v)
				$prenoms[$k] = ucfirst (str_replace (['é','è'], 'e', mb_strtolower ($v, 'UTF-8')));

			$local_file_name = '20'.$date[3].'-'.$date[2].'-'.implode('-', $prenoms).'.pdf';

			// Copy file
			$mouvement = file_exists('pdf/'.$local_file_name) ? 'remplacé' : 'archivé';
			$ok = move_uploaded_file($tmp, 'pdf/'.$local_file_name);
			if ($ok)
				echo "<p style='color:red'>Le fichier <b>$local_file_name</b> à été $mouvement.</p>";
			else
				echo "<p style='color:red'>Erreur d'archivage du fichier <b>$local_file_name</b>.</p>";
		}
}

/**
* Trésorier : envoi des fichiers par mail
*/
?><hr />
<p>Envoi des bulletins du mois</p>
<?
$grep = 'pdf/'.date('Y-m', time() - 15 * 24 * 3600).'-*.pdf';
$files = glob ($grep);
foreach ($files AS $f) { ?>
	<input type="radio" name="doc" value="<?=str_replace(['pdf/', '.pdf'], '', $f)?>">
	<?=str_replace('pdf/', '', $f)?>
	<br>
<? } ?>
<p>&lt;PRENOM&gt; sera remplacé par le prénom du destinataire.</p>
<textarea name="texte-mail" rows="15" cols="80">Bonjour <PRENOM>.

Ci-joint ton bulletin de paie pour <?=$mois[date('m')].date(' Y')?>.
La somme correspondante à la dernière ligne a été virée sur ton compte.

Cordialement.

Dominique

Rappel : tu retrouveras tes bulletins de paie et attestations sur http://chaville.gym.free.fr/archives
Ces fichiers peuvent être lus et imprimés avec https://get.adobe.com/fr/reader/ (Télécharger Acrobat Reader)
</textarea>
<br />

<p>
				Puis <input type="submit" title="Cliquez pour recevoir le document sélectionné par mail" value="Envoyer par mail à : jieungenouville@yahoo.fr">
			</p>
			

<?

/**
* Envoi d'un bulletin
*/
if (isset ($_POST['doc']))
	envoi ($_POST['doc'],
"Bonjour $prenom

Veuillez trouver ci-joint le document demandé.

Cordialement.

Dominique

NOTE: Vous recevez ce mail parce qu'une demande à été postée sur le site d'archives de Chavil'GYM.
Si cette demande ne provient pas de vous, supprimez ce mail.
Si ces envois persistent, signalez-le moi en répondant à ce mail.
");

/**
* Liste des bulletins d'un employé
*/
if (!$est_bureau) { ?>
	<hr />
	<form action="index.php" method="POST">
		<p>Sélectionnez le bulletin de salaire désiré dans la liste ci-dessous puis<br />
			<input type="submit" style="cursor:pointer"
				title="Cliquez pour recevoir le document par mail"
				value="Envoyer par mail à : <?=$_REQUEST['gymmail']?>" />
		</p>

		<? $files = glob('pdf/*'.str_replace(['é','è'], 'e', $prenom).'.pdf');
		foreach (array_reverse($files) AS $f) {
			$nf = explode ('-', str_replace ('/', '-', $f));
		?>
			<input type="radio" name="doc" value="<?=str_replace(['pdf/', '.pdf'], '', $f)?>">
			<?=ucfirst($mois[$nf[2]]).' '.$nf[1]?>
			<br>
		<? } ?>
	</form>
<? }

/**
* Envoi d'un fichier
*/
function envoi ($nom_fichier, $texte_mail) {
	global $mois, $prenom;

	$docs = explode ('-', $nom_fichier);
	$mailer = new PHPMailer;
	$mailer->CharSet = 'UTF-8';
	$mailer->SMTPDebug = 3; // Enable verbose debug output
	$mailer->FromName = 'Chavil\'GYM';
	$mailer->From = 'chavil.gym@cavailhez.fr';
	$mailer->addAddress ($_REQUEST['gymmail']);
//	$mailer->addBCC('chavil.gym@cavailhez.fr', 'jfbonnin78140@gmail.com');
	$mailer->Subject = "Bulletin de salaire de $prenom pour {$mois[$docs[1]]} {$docs[0]}";
	$mailer->Body = $texte_mail;
	$mailer->AddAttachment (__DIR__.'/'.utf8_decode('pdf/'.$_POST['doc'].'.pdf'), $_POST['doc']);

	if ($mailer->ErrorInfo)
		echo $mailer->ErrorInfo;
	else
		$mailer->Send();

	echo '<p style="color:red">Le document a été envoyé.</p>';
}
?>