// Script lié à la page d'acceuil

// Le fond de carte
const layer = layerOsm(
		'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		'<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
	),

	// La couche "massifs"
	massifs = layerVectorURL({
		baseUrl: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?type_polygon=1',
		receiveProperties: function(properties) {
			properties.name = properties.nom;
			properties.type = null;
			properties.link = properties.lien;
			properties.copy = '';
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

	map = new ol.Map({
		target: 'carte-accueil',
		controls: [
			new ol.control.Attribution({
				collapsible: false, // Attribution always open
			}),
			controlPermalink({ // Permet de garder le même réglage de carte
				init: false, // Ici, on initialisera plutôt la zone principale
				visible: false,
			}),
		],
		layers: [
			layer,
			massifs,
		]
	});

// Centre la carte sur la zone souhaitée
map.getView().fit(ol.proj.transformExtent([<?=$vue->bbox?>], 'EPSG:4326', 'EPSG:3857'));