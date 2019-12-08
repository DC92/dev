<?php
	include ($config_wri['racine_projet'].'vues/includes/cartes.js');
?>

const controls = [
		controlLayersSwitcher({
			baseLayers: baseLayers,
		}),
		//controlPermalink(options.controlPermalink),
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
	],

	layerMassifs = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?type_polygon=1',
		receiveProperties: function(properties) {
			properties.type = null;
		},
		styleOptions: function(properties) {
			return {
				fill: new ol.style.Fill({
					color: 'rgba(0,0,0,0)',
				}),
				stroke: new ol.style.Stroke({
					color: 'black',
				})
			};
		},
	}),

	editeur = layerEdit({
		geoJsonId: 'edit-json',
		snapLayers: [layerMassifs],
		titleModify: 'Modification d‘un polygone:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Déplacer un sommet: Cliquer dessus puis le déplacer\n' +
			'Ajouter un sommet: Cliquer sur un côté puis le déplacer\n' +
			'Supprimer un sommet: Alt+cliquer dessus\n' +
			'Scinder un polygone: Joindre 2 sommets d‘un même polygone puis alt+cliquer dessus\n' +
			'Fusionner 2 polygones: Coller un côté identique (entre 2 sommets consécutifs) de chaque polygone puis alt+cliquer dessus\n' +
			'Supprimer un polygone: Ctrl+Alt+cliquer sur un côté',
		titlePolygon: 'Création d‘un polygone:\n' +
			'Activer ce bouton (couleur jaune) puis\n' +
			'Cliquer sur la carte et sur chaque point désiré pour dessiner un polygone,\n' +
			'double cliquer pour terminer.\n' +
			'Un polygone entièrement compris dans un autre crée un "trou".',
		saveFeatures: function(coordinates, format) {
			return format.writeGeometry(
				new ol.geom.MultiPolygon(coordinates.polys), {
					featureProjection: 'EPSG:3857',
					decimals: 5,
				});
		},
	}),

	map = new ol.Map({
		target: 'carte-nav',
		view: new ol.View({
			center: ol.proj.fromLonLat([2, 47]), // Default
			zoom: 13,
		}),
		controls: controls,
		layers: [
			layerMassifs,
			editeur,
		],
	});