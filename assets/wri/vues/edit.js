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

	/**
	 * www.refuges.info areas layer
	 * Requires layerVectorURL
	 */
	layerMassifs = layerVectorURL({
		baseUrl: '<?=$config_wri['sous_dossier_installation']?>api/polygones?type_polygon=1',
		styleOptions: function(properties) {
			// Translates the color in RGBA to be transparent
			var cs = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(properties.couleur);
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
		controls: [
			controlModify,
			controlDrawPolygon,
		],
		snapLayers: [layerMassifs],
		styleOptions: {
			stroke: new ol.style.Stroke({
				color: 'blue',
				width: 2,
			}),
		},
		editStyleOptions: { // Hover / modify / create
			image: new ol.style.Circle({
				radius: 5,
				fill: new ol.style.Fill({
					color: 'red',
				}),
			}),
			stroke: new ol.style.Stroke({
				color: 'red',
				width: 2,
			}),
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
			editeur,
		],
		controls: controlsCollection({
			baseLayers: baseLayers,
		}),
	});

map.getView().fit(
	editeur.getSource().getExtent()
);