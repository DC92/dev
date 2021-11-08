<a href="index.php?logout" style="float:right">Déconnection</a>
<h3>Archives de Chavil'GYM</h3>

<?php
error_reporting(E_ALL);
ini_set('display_errors','on');

include 'liste.php';

$nomAnimateurs = $mailAnimateurs = [];
foreach ($animateurs AS $k=>$v) {
	$nomAnimateurs [str_replace (['é','è'], 'e', $v)] = $v;
	$mailAnimateurs [str_replace (['é','è'], 'e', $v)] = $k;
}

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
 * Identification
 */
$session_mail = @$_POST['session_mail'] ?: @$_COOKIE['session_mail'];
$session_id = @$_GET['session_id'] ?: @$_COOKIE['session_id'];

if (isset($_GET['logout']))
	$session_mail = null;

$prenom = @($bureau + $animateurs)[$session_mail];
if ($session_mail && !$prenom) {
	?><p style="color:red">Mail <b><?=$session_mail?></b> inconnu.<p><?
	$session_mail = null;
}
$est_bureau = isset ($bureau[$session_mail]);
$salt = $session_mail.$_SERVER['REMOTE_ADDR'].$_SERVER['HTTP_USER_AGENT'];
$md5 = md5($salt);

if (!$prenom) { ?>
	<p>Pour vous identifier, saisissez votre adresse mail :</p>
	<form action="index.php" method="POST">
		<p><input type="text" name="session_mail" size="50" /></p>
		<p><input type="submit" value="Soumettre" /></p>
	</form> <?
}

if ($prenom && $session_id != $md5) {
	if ($est_bureau) {
		$prenom = null;

		// Envoi d'un mail de validation
		$_POST['send_address'] = $session_mail;
		$_POST['send_subject'] = 'Validation de votre connexion à chavil.gym';
		$_POST['send_body'] = "Pour valider votre connexion à chavil.gym,
cliquez sur {$_SERVER['HTTP_ORIGIN']}{$_SERVER['SCRIPT_NAME']}?session_id=$md5";
		$_POST['send_confirm'] = 'Un mail de vérification de votre connexion vient de vous être envoyé.';
	}
	// Les animateurs n'ont pas besoin de valider
	else
		$session_id = $md5;
}

setcookie('session_mail', $session_mail, time() + (86400 * 365)); // Durée 1 an
setcookie('session_id', $session_id, time() + (86400 * 365));

$debug = [
	'COOKIE' => $_COOKIE,
	'POST' => $_POST,
	'salt' => $salt,
	'md5' => $md5,
	'session_id' => $session_id,
	'session_mail' => $session_mail,
	'prenom' => $prenom,
	'est_bureau' => $est_bureau,
];
//*DCMM*/echo"<pre style='background:white;color:black;font-size:16px'> = ".var_export($debug,true).'</pre>'.PHP_EOL;

/**
 * Envoi d'un mail
 */
if (isset ($_POST['send_address'])) {
	if (isset (($bureau + $animateurs)[$_POST['send_address']])) { // Seulement vers des mails connus
		include 'PHPMailer/PHPMailerAutoload.php'; //https://github.com/PHPMailer/PHPMailer
		$mailer = new PHPMailer;
		$mailer->CharSet = 'UTF-8';
		$mailer->SMTPDebug = 3; // Enable verbose debug output
		$mailer->FromName = 'Chavil\'GYM';
		$mailer->From = 'chavil.gym@cavailhez.fr';
		$mailer->addAddress ($_POST['send_address']);
		$mailer->addBCC('chavil.gym@cavailhez.fr', 'jfbonnin78140@gmail.com');
		$mailer->Subject = $_POST['send_subject'] ?: 'Chavil\'GYM';
		$mailer->Body = $_POST['send_body'];
		if (isset ($_POST['send_attachment']))
			$mailer->AddAttachment ($_POST['send_attachment']);

		if ($mailer->ErrorInfo)
			echo"<p style='color:red'>Erreur envoi mail : {$mailer->ErrorInfo}</p>";
		else {
			$mailer->Send();
			echo "<p style='color:red'>{$_POST['send_confirm']}</p>";
		}
	} else
		echo "<p style='color:red'>Mail <b><?=$send_address?></b> inconnu.<p>";
}

/**
 * Acceuil
 */
if ($prenom)
	echo "<p>Bonjour $prenom</p>";
else
	exit;

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
	include 'PdfParser.php'; // https://gist.github.com/smalot/6183152
	if (isset ($_FILES['file']))
		foreach ($_FILES['file']['name'] AS $k=>$f) {
			$tmp = $_FILES['file']['tmp_name'][$k];
			$pdf = PdfParser::parseFile ($tmp);
			preg_match('/emploi : du ([0-9]+)\/([0-9]+)\/([0-9]+)/', $pdf, $date);
			preg_match('/Prénom-:-(.+)-Nom-:/', str_replace (' ', '-', $pdf), $prenom_compose);

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
 * Trésorier : liste des employés
 */
?><hr />
Liste des bulletins à envoyer à :<br />
<?
if ($est_bureau)
	foreach ($animateurs AS $mail => $prenom) {
		$prenom_flat = str_replace(['é','è',' '], ['e','e','-'], $prenom);
		echo "<a href='./?prenom=$prenom_flat'>$prenom</a><br />";
	}

/**
 * Liste des bulletins d'un employé
 */
// Envoi des bulletins par le trésorier
if ($est_bureau) {
	$prenom_liste = @$_GET['prenom'];
	$intro_liste = 'Pour envoyer un bulletin de paie à '.$prenom_liste.
		',<br/>modifiez le texte';
	$mail_liste = @$mailAnimateurs [$prenom_liste];
	$titre_liste = "Bulletin de paie de $prenom_liste pour octobre 2021";
	$texte_edit_liste = "Bonjour $prenom_liste.

Ci-joint ton bulletin de paie pour ".$mois[date('m')].date(' Y').".
La somme correspondante à la dernière ligne a été virée sur ton compte.

Cordialement.

Dominique

Rappel : tu retrouveras tes bulletins de paie et attestations sur http://chaville.gym.c92.fr/archives
Ces fichiers peuvent être lus et imprimés avec https://get.adobe.com/fr/reader/ (Télécharger Acrobat Reader)";
}
// Récupération d'un bulletin par un employé
else {
	$intro_liste = 'Pour obtenir une copie d\'un bulletin de paie';
	$prenom_liste = $prenom;
	$mail_liste = $session_mail;
	$titre_liste = 'Votre document Chavil\'GYM';
	$texte_liste = "Bonjour $prenom_liste.

Veuillez trouver ci-joint le document demandé.

Cordialement.

Chavil'GYM

NOTE: Vous recevez ce mail parce qu'une demande à été postée sur le site d'archives de Chavil'GYM.
Si cette demande ne provient pas de vous, supprimez ce mail.
Si ces envois persistent, signalez-le moi en répondant à ce mail.";
}

if ($prenom_liste) {
	$prenom_liste_flat = str_replace(['é','è'], 'e', $prenom_liste);
	$files = glob('pdf/*'.$prenom_liste_flat.'.pdf');
?>
	<hr />
	<form action="index.php" method="POST">
		<?=$intro_liste?>,<br />
		sélectionnez le dans la liste ci-dessous puis<br/>
		<input type="submit" style="cursor:pointer;display:inline-block"
			title="Cliquez pour recevoir le document par mail"
			value="envoyer à <?=$mail_liste?>" />
		<br /><br />

		<input type="hidden" name="send_address" value="<?=$mail_liste?>" />
		<input type="hidden" name="send_subject" value="<?=$titre_liste?>" />
		<input type="hidden" name="send_confirm" value="Votre document a été envoyé à <?=$mail_liste?>." />
		<? if (isset ($texte_liste)) { ?>
			<input type="hidden" name="send_body" value="<?=$texte_liste?>" />
		<? } else { ?>
			<textarea name="send_body" rows="15" cols="80"><?=$texte_edit_liste?></textarea><br/><br/>
		<? } ?>

		<? if ($files)
			foreach (array_reverse($files) AS $f) {
				$nf = explode ('-', str_replace ('/', '-', $f));
				?>
				<input type="radio" name="send_attachment" value="<?=$f?>">
				<?=ucfirst($mois[$nf[2]]).' '.$nf[1]?>
				<br><?
			}
		?>
	</form>
<? }

