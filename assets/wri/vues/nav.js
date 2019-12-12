<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink(),
		new ol.control.Attribution(),
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		new ol.control.FullScreen({
			label: '', //HACK Bad presentation on IE & FF
			tipLabel: 'Plein écran',
		}),
		controlGeocoder(),
		controlGPS(),
		controlLoadGPX(),
		controlDownload(),
		controlPrint(),
	],

	map = new ol.Map({
		target: 'carte-nav',
		view: new ol.View({
			center: ol.proj.fromLonLat([2, 47]), // Default
			zoom: 13,
		}),
		controls: controls,
		layers: [
			layerRefugesInfo({
				baseUrl: '<?=$config_wri["sous_dossier_installation"]?>',
				selectorName: 'wri-features',
			}),
			layerOverpass({
				selectorName: 'osm-features',
			}),
			layerPyreneesRefuges({
				selectorName: 'prc-features',
			}),
			layerC2C({
				selectorName: 'c2c-features',
			}),
			layerChemineur({
				selectorName: 'chm-features',
				urlSuffix: '3,8,16,20,23', // Refuges, abris, inutilisables, points d'eau, sommets, cols, lacs, ...
			}),
			layerAlpages({
				selectorName: 'alp-features',
			}),
		],
	});
