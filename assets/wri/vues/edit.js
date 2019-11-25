// Edition des massifs
const baseLayers = {
		'Refuges.info': layerOSM(
			'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			'<a href="http://wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
		),
		'OSM fr': layerOSM('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'OpenTopoMap': layerOSM(
			'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			'<a href="https://opentopomap.org">OpenTopoMap</a> ' +
			'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'
		),
		'IGN': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN Express': layerIGN('<?=$config_wri['ign_key']?>', 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo Bing': layerBing('<?=$config_wri['bing_key']?>', 'Aerial'),
		'Photo IGN': layerIGN('<?=$config_wri['ign_key']?>', 'ORTHOIMAGERY.ORTHOPHOTOS'),
	},

	controls = [
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
		controlDownloadGPX(),
	],

	layerMassifs = layerVectorURL({
		baseUrl: '<?=$config_wri['sous_dossier_installation']?>api/polygones?type_polygon=1',
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

	map = new ol.Map({
		target: 'carte-nav',
		view: new ol.View({
			center: ol.proj.fromLonLat([2, 47]), // Default
			zoom: 13,
		}),
		layers: [
			layerMassifs,
//			editeur,
		],
		controls: controls,
	});

if(0)
map.getView().fit(
	editeur.getSource().getExtent()
);

map.addControl(controlEdit({
	geoJsonId: 'edit-json',
	snapLayers: [layerMassifs],
	title: 'Modification d‘un polygone:\n' +
		'Activer ce bouton (couleur jaune) puis\n' +
		'Déplacer un sommet: Cliquer dessus puis le déplacer\n' +
		'Ajouter un sommet: Cliquer sur un côté puis le déplacer\n' +
		'Supprimer un sommet: Alt+cliquer dessus\n' +
		'Scinder un polygone: Joindre 2 sommets d‘un même polygone puis alt+cliquer dessus\n' +
		'Fusionner 2 polygones: Coller un côté identique (entre 2 sommets consécutifs) de chaque polygone puis alt+cliquer dessus\n' +
		'Supprimer un polygone: Ctrl+Alt+cliquer sur un côté',
	editPolygon: 'Création d‘un polygone:\n' +
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
}));