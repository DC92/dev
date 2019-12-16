<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		controlPermalink({ // Permet de garder le même réglage de carte
<?php if ($vue->polygone->id_polygone) { ?>
			init: false, // Ici, on cadrera plutôt sur le massif
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
<?if (!$vue->polygone->nom_polygone ) { ?>
		controlDownload(),
<?php } ?>
		controlPrint(),
	],

	// La couche "zone"
	zone = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?type_polygon=1&intersection=<?=$vue->polygone->id_polygone?>',
		noMemSelection: true,
		receiveProperties: function(properties, feature, layer) {
			properties.name = properties.nom;
			properties.type = null;
			properties.link = properties.lien;
		},
		styleOptions: function(properties) {
			// Translates the color in RGBA to be transparent
			var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
			return {
				fill: new ol.style.Fill({
					color: 'rgba(' +
						parseInt(cs[1], 16) + ',' +
						parseInt(cs[2], 16) + ',' +
						parseInt(cs[3], 16) + ',0.5)',
				}),
				stroke: new ol.style.Stroke({
					color: 'black',
				}),
			};
		},
		hoverStyleOptions: function(properties) {
			return {
				fill: new ol.style.Fill({
					color: properties.couleur,
				}),
			};
		},
	}),

	// La couche "massifs"
	massifs = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?massif=<?=$vue->polygone->id_polygone?>',
		selectorName: 'couche-massif',
		noMemSelection: true,
		receiveProperties: function(properties, feature, layer) {
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
		noMemSelection: true,
		baseUrlFunction: function(bbox, list) {
			const el = document.getElementById('tous-massif');
			return '<?=$config_wri["sous_dossier_installation"]?>api/'+
				(el && el.checked ? 'massif?massif=<?=$vue->polygone->id_polygone?>&' : 'bbox?')+
				'nb_points=500&type_points=' +
				list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
		},
	}),

	overlays = [
<?php if ($vue->mode_affichage == 'zone') { ?>
			zone,
<?php } else if ($vue->polygone->id_polygone) { ?>
			massifs,
<?php } ?>
			points,
			layerOverpass({
				selectorName: 'couche-osm',
			}),
			layerPyreneesRefuges({
				selectorName: 'couche-prc',
			}),
			layerC2C({
				selectorName: 'couche-c2c',
			}),
			layerChemineur({
				selectorName: 'couche-chemineur',
				urlSuffix: '3,8,16,20,23', // Refuges, abris, inutilisables, points d'eau, sommets, cols, lacs, ...
			}),
			layerAlpages({
				selectorName: 'couche-alpages',
			}),
		];

	map = new ol.Map({
		target: 'carte-nav',
		controls: controls,
		layers: overlays,
	});
	
	<?if ($vue->polygone->id_polygone){?>
		map.getView().fit(ol.proj.transformExtent([
			<?=$vue->polygone->ouest?>,
			<?=$vue->polygone->sud?>,
			<?=$vue->polygone->est?>,
			<?=$vue->polygone->nord?>,
		], 'EPSG:4326', 'EPSG:3857'));
	<?}?>
