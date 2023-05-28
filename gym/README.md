# Chavil.gym.WP
EN COURS DE DEVELOPPEMENT
Theme WordPress sur base twentytwentythree pour afficher les cours de la Gym Volontaire de Chaville

INSTALL
=======
Sous domaine - SSL Let's Encrypt
WP : install
Copier ces fichiers dans /wp-content/themes/gym
Supprimer toutes extension et thème autre que 23
Installer "Block Editor Colors", ajouter le jaune #fff00
Installer "Contact Form 7" (pour le formulaire de contact)
Extensions -> Contact Form 7 -> Réglages
Installer "Favicon by RealFaviconGenerator"
  Apparence -> Favicon (images/favicon.jpg)
Installer "Leaflet Map"
LiteSpeed Cache
WP Dark Mode
  Settings -> Cocher tout
WooCommerce : créer produits et codes promo
Woocommerce checkout manager (WooCommerce Commander directeur par QuadLayers)
  Définir date naissance et certificat médical (obligatoires)
  Désactiver Entreprise & Région
  Produit simple / Virtuel
  Inventaire : Vendre individuellement
WooCommerce Extended Coupon Features FREE Par Soft79
  Marketing -> Codes promo
  Restrictions d'usage -> min / max / Utilisation individuelle
  Divers -> Coupon automatique / Appliquer silencieusement

Toutes extensions : activer, activer les mises à jour

TODO / BUGS
===========
Refermer le sous-menu si on tappe ailleurs
Editeur : Style blocs liste en mode tablette ou mobile

TAGS DANS LES PAGES
===================
<meta http-equiv="refresh" content="0;https">
[leaflet-map lng="2.19712" lat="48.81788"][leaflet-marker]

MISE EN SERVICE
===============
Changer url
SQL : wpgym_ -> wp_   2023.gym -> chaville.gym