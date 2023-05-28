var mapKeys = {
	"ign": "iejxbx4obzhco6c8klxrfbto",
	"thunderforest": "23e2a2c890144e418ea89a5cc0555afe"
};

// /vues/_cartes.js
function wriMapBaseLayers(page) {
	return {
		'Refuges.info': new myol.layer.MriTile(),
		'OSM fr': new myol.layer.OsmTile(),
		'OpenTopo': new myol.layer.TopoTile(),
		'OSM outdoors': new myol.layer.ThunderforestTile({
			key: mapKeys.thunderforest,
		}),
		'IGN TOP25': new myol.layer.IgnTile({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: page == 'modif' ? null : mapKeys.ign,
		}),
		'IGN V2': new myol.layer.IgnTile({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // La clé pour les couches publiques
			format: 'image/png',
		}),
		'SwissTopo': page == 'modif' ? null : new myol.layer.SwissTopoTile(),
		'Autriche': new myol.layer.KompassMriTile(),
		'Espagne': new myol.layer.SpainTile(),
		'Photo IGN': new myol.layer.IgnTile({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': new myol.layer.ArcGisTile(),
		'Photo Google': page == 'modif' ? null : new myol.layer.GoogleTile({
			subLayers: 's',
		}),
	};
}

function wriMapControls(options) {
	return [
		// Haut gauche
		new myol.control.Zoom(),
		new myol.control.FullScreen(),
		//myol.control.Geocoder(),
		myol.control.GPS(),
		options.page == 'point' ? myol.control.Button() : myol.control.LoadGPX(),
		options.page == 'nav' ? myol.control.Button() : myol.control.Download(options.Download),
		options.page == 'modif' ? myol.control.Button() : myol.control.Print(),

		// Haut droit
		myol.control.LayerSwitcher({
			layers: wriMapBaseLayers(options.page),
		}),

		// Bas gauche
		myol.control.MousePosition(),
		new myol.control.ScaleLine(),

		// Bas droit
		myol.control.Permalink(options.Permalink),
		new myol.control.Attribution({
			collapsed: false,
		}),
	];
}


// /vues/index.js
new myol.Map({
	target: 'carte-accueil',
	view: new myol.View({
		enableRotation: false,
		constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
	}),
	layers: [
		new myol.layer.MriTile(), // Fond de carte WRI
		/*
				layerWriAreas({ // La couche "massifs"
					host: '<?=$config_wri["sous_dossier_installation"]?>', // Appeler la couche de ce serveur
				}),
		*/
	],
	controls: [
		new myol.control.Attribution({
			collapsed: false,
		}),
	],
	// Centre la carte sur la zone souhaitée
}).getView().fit(myol.proj.transformExtent([-5, 42, 8, 51], 'EPSG:4326', 'EPSG:3857'));


// /vues/point.js
new myol.Map({
	target: 'carte-point',
	view: new myol.View({
		center: myol.proj.fromLonLat([5.50669, 44.98445]),
		zoom: 13,
		enableRotation: false,
		constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
	}),
	controls: wriMapControls({
		page: 'point',
		Permalink: { // Permet de garder le même réglage de carte d'une page à l'autre
			visible: false, // Mais on ne visualise pas le lien du permalink
			init: false, // Ici, on utilisera plutôt la position du point
		},
	}),
	layers: [
		new myol.layer.Wri({
			selectName: 'select-refuges',
			statusId: 'status-refuges',
			attribution: null,
			stylesOptions: feature => [
				myol.styleOptions.label(feature),
			],
		}),
		/*
				layerClusterWri({
					host: '<?=$config_wri["sous_dossier_installation"]?>',
					// Display a single label above each icon
					styleOptionsDisplay: function(feature, properties, layer, resolution) {
						if (!properties.cluster || resolution < layer.options.maxResolutionDegroup)
							return styleOptionsLabel(feature, properties.nom || properties.name); // Points || clusters
					},
					// Don't display attribution on labels
					convertProperties: {
						attribution: null,
					},
				}),
		*/
		// Le cadre
		myol.layer.Marker({
			prefix: 'cadre', // S'interface avec les <TAG id="cadre-xxx"...
			src: 'images/cadre.svg',
			focus: 15, // Centrer 
		}),
	],
});


// /vues/nav.js
const layers = [
		new myol.layer.Wri({
			//selectName: 'select-refuges',
			//statusId: 'status-refuges',
			attribution: null,
			stylesOptions: feature => [
				myol.styleOptions.label(feature),
			],
		}),
		/*
				layerClusterWri({
					host: '<?=$config_wri["sous_dossier_installation"]?>',
					selectName: 'selecteur-wri,selecteur-massif', // 2 selecteurs pour une même couche
					// Display a single label above each icon
					styleOptionsDisplay: function(feature, properties, layer, resolution) {
						if (!properties.cluster || resolution < layer.options.maxResolutionDegroup)
							return styleOptionsLabel(feature, properties.nom || properties.name); // Points || clusters
					},
					// Don't display attribution on labels
					convertProperties: {
						attribution: null,
					},
				}),

				// Contour d'un massif ou d'une zone
				layerVector({
					url: '<?=$config_wri["sous_dossier_installation"]?>' +
						'api/polygones?massif=<?=$vue->polygone->id_polygone?>',
					zIndex: 3, // Au dessus des massifs mais en dessous de son hover
					<?php if ( !$vue->contenu ) { ?>
						selectName: 'selecteur-massif',
					<?php } ?>
					styleOptionsDisplay: {
						stroke: new ol.style.Stroke({
							color: 'blue',
							width: 2,
						}),
					},
				}),

				// Les massifs
				layerWriAreas({
					host: '<?=$config_wri["sous_dossier_installation"]?>',
					selectName: '<?=$vue->contenu?"":"selecteur-massifs"?>',
				}),

				// Overpass
				layerOverpass({
					selectName: 'selecteur-osm',
					maxResolution: 100,
				}),

				// Pyrenees-refuges.com
				layerPrc({
					selectName: 'selecteur-prc',
				}),

				// CampToCamp
				layerC2C({
					selectName: 'selecteur-c2c',
				}),

				// Chemineur
				layerChemineur({
					selectName: 'selecteur-chemineur',
				}),

				// Alpages.info
				layerAlpages({
					selectName: 'selecteur-alpages',
				}),
		*/
	],

	map = new myol.Map({
		target: 'carte-nav',
		view: new myol.View({
			enableRotation: false,
			constrainResolution: true, // Force le zoom sur la définition des dalles disponibles
		}),
		controls: wriMapControls({
			page: 'nav',
			Permalink: { // Permet de garder le même réglage de carte
				display: true,
				init: 'true', // On cadre le massif
			},
		}),
		layers: layers,
	});

// /vues/edit.js
/*
// Affiche la limite de tous les massifs
const coucheContours = layerVector({
		url: '<?=$config_wri["sous_dossier_installation"]?>api/polygones?type_polygon=1',
		noHover: true,
		style: new ol.style.Style({
			stroke: new ol.style.Stroke({
				color: 'blue',
			}),
		}),
	}),

	controleEditeur = layerEditGeoJson({
		geoJsonId: 'edit-json',
		snapLayers: [coucheContours],
		help: [
			(document.getElementById('myol-help-edit-modify') || {}).innerHTML,
			null, // Pas d'édition de ligne
			(document.getElementById('myol-help-edit-poly') || {}).innerHTML,
		],
		saveFeatures: function(coordinates, format) {
			return format.writeGeometry(
				new ol.geom.MultiPolygon(coordinates.polys),
				{
					featureProjection: 'EPSG:3857',
					decimals: 5,
				});
		},
	});
*/

const mapEdit = new myol.Map({
	target: 'carte-edit',
	view: new myol.View({
		enableRotation: false,
	}),
	controls: wriMapControls({
		page: 'modif',
		Download: {
			//savedLayer: controleEditeur.layer, // Obtenir uniquement le massif en cours d'édition
		},
		Permalink: { // Permet de garder le même réglage de carte
		},
	}),
	layers: [
		//coucheContours,
	],
});

//mapEdit.addControl(controleEditeur);