<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const refugesInfo = layerRefugesInfo({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>',
		// Couche non cliquable
		href: null,
		label: function(properties) {
			return properties.nom;
		},
	}),

	marker = layerMarker({
		imageUrl: '<?=$config_wri["sous_dossier_installation"]?>images/viseur.png',
		idDisplay: 'viseur',
		centerOnMap: true,
		draggable: true,
	}),

	controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({ // Permet de garder le même réglage de carte d'une page à l'autre
			visible: false, // Mais on ne visualise pas le lien du permalink
			init: '<?=$point->id_point?>' == '', // Ici, on utilisera plutôt la position du point si on est en modification
		}),
		new ol.control.Attribution(),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '', //HACK Bad presentation on IE & FF
			tipLabel: 'Plein écran',
		}),
		controlGeocoder(),
		controlLoadGPX(),
		controlGPS(),
	],

	map = new ol.Map({
		target: 'carte-edit',
		//TODO ne faire que si modif de point
		wview: new ol.View({ // Position initiale forcée aux coordonnées de la cabane
			center: ol.proj.fromLonLat([<?=$vue->point->longitude?>, <?=$vue->point->latitude?>]),
			zoom: 13,
		}),
		controls: controls,
		layers: [refugesInfo, marker],
	});