# Chavil.gym.WP
EN COURS DE DEVELOPPEMENT
Theme WordPress sur base twentytwentythree pour afficher les cours de la Gym Volontaire de Chaville

INSTALL
=======
Sous domaine - SSL Let's Encrypt
WP : install
Copier ces fichiers dans /wp-content/themes/gym
Supprimer toutes extension et thème autre que 23
LiteSpeed Cache
Installer "Block Editor Colors", ajouter le jaune #fff00
Installer "Leaflet Map"
Installer "Contact Form 7" (pour le formulaire de contact)
Extensions -> Contact Form 7 -> Réglages
Installer "Favicon by RealFaviconGenerator"
  Apparence -> Favicon (images/favicon.jpg)
Installer "WP Dark Mode"
  Settings -> Cocher tout
Installer "WooCommerce"
  Créer produits
    Produit simple / Virtuel
    150
    Inventaire : Vendre individuellement
Installer "WooCommerce Extended Coupon Features FREE Par Soft79
  Marketing -> Codes promo
    Retirer le menu de code promo hérité
    Restrictions d'usage -> min / max / Utilisation individuelle
    Divers -> Coupon automatique / Appliquer silencieusement
Installer "Woocommerce checkout manager (WooCommerce Commander directeur par QuadLayers)
  Définir date naissance et certificat médical (obligatoires)
  Désactiver Entreprise & Région

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