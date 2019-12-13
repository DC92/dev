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
		controlDownload(),
		controlPrint(),
	],

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
			const url = '<?=$config_wri["sous_dossier_installation"]?>api/'+
			(el && el.checked ? 'massif?massif=4&' : 'bbox?')+
			'nb_points=500&type_points=' +
				list.join(',') + '&bbox=' + bbox.join(','); // Default most common url format
				
				
				
/*DCMM*/{var _r=' ',_v=url;if(typeof _v=='array'||typeof _v=='object'){for(_i in _v)if(typeof _v[_i]!='function'&&_v[_i])_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r)}
				
/*DCMM*/{var _r=' ',_v=el.checked;if(typeof _v=='array'||typeof _v=='object'){for(_i in _v)if(typeof _v[_i]!='function'&&_v[_i])_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r)}

			return url;
		},
	}),

	overlays = [
<?php if ($vue->polygone->id_polygone) { ?>
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
		<?if ($vue->polygone->id_polygone){?>
			view: new ol.View({
				center: ol.proj.fromLonLat([2, 47]), // Default
				zoom: 6,
			}),
		<?}?>
		controls: controls,
		layers: overlays,
	});

	<?if ($vue->polygone->id_polygone){?>
		massifs.once('postrender',function(){
			map.getView().fit(massifs.getSource().getExtent());
		});
	<?}?>
