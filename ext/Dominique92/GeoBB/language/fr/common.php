<?php
/**
*
* This file is part of the french language pack for the GeoBB Forum Software package.
*
* @copyright (c) 2015 Dominique Cavailhez
* @license GNU General Public License, version 2 (GPL-2.0)
*
*/

/**
* DO NOT CHANGE
*/
if (!defined('IN_PHPBB'))
{
	exit;
}

if (empty($lang) || !is_array($lang))
{
	$lang = array();
}

// DEVELOPERS PLEASE NOTE
//
// All language files should use UTF-8 as their encoding and the files must not contain a BOM.
//
// Placeholders can now contain order information, e.g. instead of
// 'Page %s of %s' you can (and should) write 'Page %1$s of %2$s', this allows
// translators to re-order the output of data while ensuring it remains correct
//
// You do not need this where single placeholders are used, e.g. 'Message %d' is fine
// equally where a string contains only two placeholders which are used to wrap text
// in a url you again do not need to specify an order e.g., 'Click %sHERE%s' is fine
//
// Some characters you may want to copy&paste:
// ’ « » “ ” …
//

$lang = array_merge($lang, array(
	// Fil d'ariane
	'FORUM_INDEX' => 'Accueil',
	'RETURN_TO_INDEX' => 'Accueil',
	'ACP_SHORT' => 'Administration',
	'MCP_SHORT' => 'Modération',

	// News
	'CREATION' => 'Création de',
	'COMMENT' => 'Commentaire sur',

	// Posting
	'SUBJECT' => 'Nom',

	// Footer
	'FINAL_INTEGRATION_BY' => 'Copyright &copy; <a href="https://github.com/Dominique92">Dominique Cavailhez</a> 2016. Sur la base de PhpBB',
));

//TODO ASPIR prendre dans un forum
// Privacy policy and T&C
$lang = array_merge($lang, array(
	'TERMS_OF_USE_CONTENT'	=> 'AAAA - En accédant à « %1$s » (désigné ci-après par « nous », « notre », « nos », « %1$s », « %2$s »), vous acceptez d’être légalement responsable des conditions suivantes. Si vous n’acceptez pas d’être légalement responsable de toutes les conditions suivantes, alors n’accédez pas et/ou n’utilisez pas « %1$s ». Nous pouvons modifier celles-ci à n’importe quel moment et nous ferons tout pour que vous en soyez informé, bien qu’il soit prudent de vérifier régulièrement celles-ci par vous-même. Si vous continuez d’utiliser « %1$s » alors que des changements ont été effectués, vous acceptez d’être légalement responsable des conditions découlant des mises à jour et/ou modifications.<br>
	<br>
	Nos forums sont développés par phpBB (désigné ci-après par « ils », « eux », « leur », « logiciel phpBB », « www.phpbb.com », « phpBB Limited », « Équipes phpBB ») qui est un script libre de forum, déclaré sous la licence « <a href="http://opensource.org/licenses/gpl-2.0.php">GNU General Public License v2</a> » (désigné ci-après par « GPL ») et qui peut être téléchargé depuis <a href="https://www.phpbb.com/">www.phpbb.com</a>. Le logiciel phpBB facilite seulement les discussions sur Internet. phpBB Limited n’est pas responsable de ce que nous acceptons ou n’acceptons pas comme contenu ou conduite permis. Pour de plus amples informations au sujet de phpBB, veuillez consulter : <a href="https://www.phpbb.com/">https://www.phpbb.com/</a>.<br>
	<br>
	Vous acceptez de ne pas publier de contenu abusif, obscène, vulgaire, diffamatoire, choquant, menaçant, à caractère sexuel ou tout autre contenu qui peut transgresser les lois de votre pays, du pays où « %1$s » est hébergé ou les lois internationales. Le faire peut vous mener à un bannissement immédiat et permanent, avec une notification à votre fournisseur d’accès à Internet si nous le jugeons nécessaire. Les adresses IP de tous les messages sont enregistrées pour aider au renforcement de ces conditions. Vous acceptez que « %1$s » supprime, modifie, déplace ou verrouille n’importe quel sujet lorsque nous estimons que cela est nécessaire. En tant que membre, vous acceptez que toutes les informations que vous avez saisies soient stockées dans notre base de données. Bien que ces informations ne soient pas diffusées à une tierce partie sans votre consentement, ni « %1$s », ni phpBB ne pourront être tenus comme responsables en cas de tentative de piratage visant à compromettre les données.
	',

	'PRIVACY_POLICY'		=> 'BBBB - Cette politique explique en détail comment « %1$s » et ses sociétés affiliées (désignés ci-après par « nous », « notre », « nos », « %1$s », « %2$s ») et phpBB (désigné ci-après par « ils », « eux », « leur », « logiciel phpBB », « www.phpbb.com », « phpBB Limited », « Équipes phpBB ») utilisent n’importe quelle information collectée pendant n’importe quelle session d’utilisation de votre part (désignée ci-après par « vos informations »).<br>
	<br>
	Vos informations sont collectées de deux manières. Premièrement, en naviguant sur « %1$s », le logiciel phpBB créera un certain nombre de cookies, qui sont des petits fichiers textes téléchargés dans les fichiers temporaires du navigateur Internet de votre ordinateur. Les deux premiers cookies ne contiennent qu’un identifiant utilisateur (désigné ci-après par « user-id ») et un identifiant de session invité (désigné ci-après par « session-id »), qui vous sont automatiquement assignés par le logiciel phpBB. Un troisième cookie sera créé une fois que vous naviguerez sur les sujets de « %1$s » et est utilisé pour stocker les informations sur les sujets que vous avez lus, ce qui améliore votre navigation sur le forum.<br>
	<br>
	Nous pouvons également créer des cookies externes au logiciel phpBB tout en naviguant sur « %1$s », bien que ceux-ci soient hors de portée du document qui est prévu pour couvrir seulement les pages créées par le logiciel phpBB. La seconde manière est de récupérer l’information que vous nous envoyez et que nous collectons. Ceci peut être, et n’est pas limité à : la publication de message en tant qu’utilisateur invité (désignée ci-après  par « messages invités »), l’enregistrement sur « %1$s » (désignée ici par « votre compte ») et les messages que vous envoyez après l’enregistrement et lors d’une connexion (désignés ici par « vos messages »).<br>
	<br>
	Votre compte contiendra au minimum un identifiant unique (désigné ci-après par « votre nom d’utilisateur »), un mot de passe personnel utilisé pour la connexion à votre compte (désigné ci-après par « votre mot de passe »), et une adresse courriel personnelle valide (désignée ci-après par « votre courriel »). Vos informations pour votre compte sur « %1$s » sont protégées par les lois de protection des données applicables dans le pays qui nous héberge. Toute information en-dehors de votre nom d’utilisateur, de votre mot de passe et de votre adresse courriel requise par « %1$s » durant la procédure d’enregistrement, qu’elle soit obligatoire ou non, reste à la discrétion de « %1$s ». Dans tous les cas, vous pouvez choisir quelle information de votre compte sera affichée publiquement. De plus, dans votre profil, vous pouvez souscrire ou non à l’envoi automatique de courriel par le logiciel phpBB.<br>
	<br>
	Votre mot de passe est crypté (hashage à sens unique) afin qu’il soit sécurisé. Cependant, il est recommandé de ne pas utiliser le même mot de passe sur plusieurs sites Internet différents. Votre mot de passe est le moyen d’accès à votre compte sur « %1$s », conservez-le soigneusement et en aucun cas une personne affiliée de « %1$s », de phpBB ou une d’une tierce partie ne peut vous demander légitimement votre mot de passe. Si vous oubliez votre mot de passe, vous pouvez utiliser la fonction « J’ai oublié mon mot de passe » fournie par le logiciel phpBB. Ce processus vous demandera de fournir votre nom d’utilisateur et votre courriel, alors le logiciel phpBB générera un nouveau mot de passe qui vous permettra de vous reconnecter.<br>
	',
));