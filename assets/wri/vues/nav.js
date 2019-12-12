<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({ // Permet de garder le même réglage de carte
<?php if ($vue->polygone->id_polygone) { ?>
			init: false, // Ici, on urecadrera plutôt sur le massif
<?php } ?>
		}),
		new ol.control.Attribution({
			collapsible: false,
		}),
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

	// La couche "massifs"
	massifs = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?massif=<?=$vue->polygone->id_polygone?>',
		receiveProperties: function(properties) {
			properties.name = properties.nom;
			properties.type = null;
			properties.link = properties.lien;
		},
		styleOptions: {
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
			fill: new ol.style.Fill({
				color: 'rgba(0,0,0,0)', // Tranparent
			}),
		},
	}),
	
	points = layerRefugesInfo({
		selectorName: 'wri-features',
		baseUrlFunction: function(bbox, list) {
			const url = '<?=$config_wri["sous_dossier_installation"]?>api/bbox?nb_points=500&type_points=' +
				list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
			return url;
		},
	}),

	overlays = [
<?php if ($vue->polygone->id_polygone) { ?>
			massifs,
<?php } ?>
			points,
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
		];

	map = new ol.Map({
		target: 'carte-nav',
																	view: new ol.View({
																		center: ol.proj.fromLonLat([2, 47]), // Default
																		zoom: 6,
																	}),
		controls: controls,
		layers: overlays,
	});
