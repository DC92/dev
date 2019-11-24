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
	geoJsonId: 'geojson',
	snapLayers: [layerMassifs],
	title: 'Modification d‘une ligne, d‘un polygone:\n' +
		'Activer ce bouton (couleur jaune) puis\n' +
		'Cliquer et déplacer un sommet pour modifier un polygone\n' +
		'Cliquer sur un segment puis déplacer pour créer un sommet\n' +
		'Coller un même côté (entre 2 sommets consécutifs) de 2 polygones puis alt+cliquer sur ce côté pour fusionner les polygones\n' +
		'Joindre 2 sommets d‘un même polygone puis alt+cliquer dessus pour séparer les 2 moitiés\n' +
		'Ctrl+Alt+cliquer sur un côté d‘un polygone pour le supprimer',
	editPolygon: 'Création d‘un polygone:\n' +
		'Activer ce bouton (couleur jaune) puis\n' +
		'Cliquer sur la carte et sur chaque point désiré pour dessiner un polygone,\n' +
		'double cliquer pour terminer.\n' +
		'Si le nouveau polygone est entièrement compris dans un autre, il crée un "trou".',
	saveFeatures: function(coordinates, format) {
		return format.writeGeometry(
			new ol.geom.MultiPolygon(coordinates.polys), {
				featureProjection: 'EPSG:3857',
				decimals: 5,
			});
	},
}));