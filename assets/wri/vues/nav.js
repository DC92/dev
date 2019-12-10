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
			}),
			layerOverpass(),
			layerPyreneesRefuges(),
			layerC2C(),
			layerChemineur(),
			layerAlpages(),
		],
	});
