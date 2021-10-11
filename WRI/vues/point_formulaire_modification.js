// Utilitaire de saisie
function affiche_et_set( el , affiche, valeur ) {
    document.getElementById(el).style.visibility = affiche ;
    document.getElementById(el).value = valeur ;
    return false;
}

// Gestion des cartes
const coordinates = [<?=$vue->point->longitude?>, <?=$vue->point->latitude?>],

	baseLayers = {
		'Refuges.info': layerMRI(),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest('outdoors'),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS', 'jpeg', 'pratique'),
		'Photo Bing': layerBing('Aerial'),
	},

	controls = [
		controlLayerSwitcher(baseLayers),
		controlPermalink({ // Permet de garder le même réglage de carte en création
			visible: false, // Mais on ne visualise pas le lien du permalink
<?php if (!empty($point->id_point)) { ?>
			init: false, // Ici, on utilisera plutôt la position du point si on est en modification
<?php } ?>
		}),
		new ol.control.Attribution(), //TODO BUG devrait être collapsed
		new ol.control.ScaleLine(),
		controlMousePosition(),
		new ol.control.Zoom(),
		controlFullScreen(),
		controlGeocoder(),
		controlLoadGPX(),
		controlGPS(),
	],

	viseur = layerEditGeoJson({
		displayPointId: 'viseur',
		geoJsonId: 'geojson',
		dragPoint: true,
		singlePoint: true,
		styleOptions: {
			image: new ol.style.Icon({
				src: '<?=$config_wri["sous_dossier_installation"]?>images/viseur.png',
				imgSize: [30, 30], // I.E. compatibility
			}),
		},
		// Remove FeatureCollection packing of the point
		saveFeatures: function(coordinates, format) {
			return format.writeGeometry(
				new ol.geom.Point(coordinates.points[0]), {
					featureProjection: 'EPSG:3857',
					decimals: 5,
				}
			);
		},
	}),

	layerPoints = layerWri({
		host: '<?=$config_wri["nom_hote"]?>',
		distance: 50, // Clusterisation
		styleOptionsFunction: function(feature, properties) {
			return styleOptionsIcon(properties.icon); // Display only the icon
		},
	});

new ol.Map({
	target: 'carte-edit',
	view: new ol.View({
		center: ol.proj.fromLonLat(coordinates),
		zoom: 13,
	}),
	controls: controls,
	layers: [
		layerPoints,
		viseur,
	],
});
