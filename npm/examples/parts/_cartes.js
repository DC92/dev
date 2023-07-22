/*DCMM*/{var _r=' ',_v=123456;if(typeof _v=='array'||typeof _v=='object'){for(let _i in _v)if(typeof _v[_i]!='function'&&_v[_i])_r+=_i+'='+typeof _v[_i]+' '+_v[_i]+' '+(_v[_i]&&_v[_i].CLASS_NAME?'('+_v[_i].CLASS_NAME+')':'')+"\n"}else _r+=_v;console.log(_r)}

//TODO spécifique WRI
 class Massifs extends myol.layer.VectorLayer {
	constructor() {
		super({
			host: '//www.refuges.info/',
			strategy: loadingstrategy.all,
			...options,

			query: () => ({
				_path: 'api/polygones',
				type_polygon: 1, // Massifs
			}),
			addProperties: properties => ({  
				label: properties.nom,
				couleur: properties.couleur,
				link: properties.lien,
			}),
			basicStylesOptions: areasStylesOptions_,
			hoverStylesOptions: hoverStylesOptions_,
		});

		function areasStylesOptions_(feature, layer) {
			const properties = feature.getProperties(),
				colors = properties.couleur
				.match(/([0-9a-f]{2})/ig)
				.map(c => parseInt(c, 16));

			return [{
				...stylesOptions.label(...arguments),

				wwstroke: new style.Stroke({
					color: /*//TODOhover ? properties.couleur :*/ 'transparent',
					width: 2,
				}),

				fill: new style.Fill({
					color: 'rgba(' + colors.join(',') + ',0.3)'
				}),
			}];
		}

		function hoverStylesOptions_(feature, layer) {
			const properties = feature.getProperties();

			feature.setProperties({
				overflow: true, // Display label even if not contained in polygon
				//
				label: properties.nom,
			}, true);

			return {
				...stylesOptions.label(feature, layer),

				stroke: new style.Stroke({
					color: properties.couleur,
					width: 2,
				}),
			};
		}
	}
}

// Les couches de fond des cartes de refuges.info
/*function wriMapBaseLayers(page) {
	return {
		'Refuges.info': layerMRI(),
		'OSM fr': layerOSM({
			url: '//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
		}),
		'OpenTopo': layerOpenTopo(),
		'Outdoors': layerThunderforest({
			subLayer: 'outdoors',
			key: mapKeys.thunderforest,
		}),
		'IGN TOP25': page == 'modif' ? null : layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS',
			key: mapKeys.ign,
		}),
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels', // La clé pour les couches publiques
			format: 'image/png',
		}),
		'SwissTopo': page == 'modif' ? null : layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Autriche': layerKompass(),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),
		'Photo ArcGIS': layerArcGIS('World_Imagery'),
		'Photo Google': page == 'modif' ? null : layerGoogle('s'),
	};
}

// Les controles des cartes de refuges.info
function wriMapControls(options) {
	return [
		// Haut gauche
		new ol.control.Zoom(),
		new ol.control.FullScreen(),
		controlGeocoder(),
		controlGPS(),
		options.page == 'point' ? controlButton() : controlLoadGPX(),
		options.page == 'nav' ? controlButton() : controlDownload(options.Download),
		options.page == 'modif' ? controlButton() : controlPrint(),

		// Haut droit
		controlLayerSwitcher({
			layers: wriMapBaseLayers(options.page),
		}),

		// Bas gauche
		controlMousePosition(),
		new ol.control.ScaleLine(),

		// Bas droit
		controlPermalink(options.Permalink),
		new ol.control.Attribution({
			collapsed: false,
		}),
	];
}*/