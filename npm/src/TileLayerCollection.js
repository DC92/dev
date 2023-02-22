import TileLayer from '../node_modules/ol/layer/Tile.js';

// OpenStreetMap & co
export class OsmTileLayer extends TileLayer {
	constructor(options) {
		super({
			source: new ol.source.XYZ({
				url: '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				maxZoom: 21,
				attributions: ol.source.OSM.ATTRIBUTION,
				...options,
			}),
			...options,
		});
	}
}

export class TopoTileLayer extends OsmTileLayer {
	constructor(options) {
		super({
			url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			attributions: '<a href="https://opentopomap.org">OpenTopoMap</a> ' +
				'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
			maxZoom: 17,
			...options,
		});
	}
}

export class MriTileLayer extends OsmTileLayer {
	constructor(options) {
		super({
			url: '//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			attributions: '<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">Refuges.info</a>',
			...options,
		});
	}
}

export class KompassMriTileLayer extends layerOSM { // Austria
	constructor(opt) {
		const options = {
			subLayer: 'KOMPASS Touristik',
			attributions: '<a href="http://www.kompass.de/livemap/">KOMPASS</a>',
			...opt,
			url: 'https://map{1-5}.tourinfra.com/tiles/kompass_osm/{z}/{x}/{y}.png',
		};

		if (options.key)
			options.subLayer = 'https://map{1-4}.kompass.de/{z}/{x}/{y}/' + options.subLayer + '?key=' + options.key;

		super(options);
	}
}

// Tile layers examples
export function collectionTileLayer(options) {
	options = options || {};

	return {
		'OSM fr': layerOSM(),
		'OpenTopo': layerOpenTopo(),
		'OSM outdoors': layerThunderforest(options.thunderforest), // options include key
		'OSM transports': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'transport',
		}),
		'OSM cyclo': layerOSM({
			url: '//{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		}),
		'Refuges.info': layerMRI(),

		'IGN TOP25': layerIGN(options.ign), // options include key
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels',
			format: 'image/png',
		}),
		'IGN cartes 1950': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950',
			key: 'cartes/geoportail',
		}),

		'SwissTopo': layerSwissTopo(),
		'Autriche': new myol.KompassMriTileLayer(), // No key
		'Angleterre': layerOS(options.os), // options include key
		'Italie': layerIGM(),
		'Espagne': layerSpain(),

		'Photo Google': layerGoogle('s'),
		'Photo ArcGIS': layerArcGIS(),
		'Photo Bing': layerBing({
			...options.bing, // Include key
			imagerySet: 'Aerial',
		}),
		'Photo IGN': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),

		'Photo IGN 1950-65': layerIGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965',
			key: 'orthohisto/geoportail',
			style: 'BDORTHOHISTORIQUE',
			format: 'image/png',
		}),

		'IGN E.M. 1820-66': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40',
			key: 'cartes/geoportail',
		}),
		'Cadastre': layerIGN({
			layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
			key: 'essentiels',
			format: 'image/png',
		}),
		/*'IGN Cassini': layerIGN({ //BEST BUG what key for Cassini ?
			...options.ign,
					layer: 'GEOGRAPHICALGRIDSYSTEMS.CASSINI',
				}),*/
	};
}

export function demoTileLayer(options) {
	return {
		...collectionTileLayer(options),

		'OSM': new OsmTileLayer(),

		'ThF cycle': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'cycle',
		}),
		'ThF trains': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'pioneer',
		}),
		'ThF villes': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'neighbourhood',
		}),
		'ThF landscape': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'landscape',
		}),
		'ThF contraste': layerThunderforest({
			...options.thunderforest, // Include key
			subLayer: 'mobile-atlas',
		}),

		'OS light': layerOS({
			...options.os, // Include key
			subLayer: 'Light_3857',
		}),
		'OS road': layerOS({
			...options.os, // Include key
			subLayer: 'Road_3857',
		}),
		'Kompas topo': new myol.KompassMriTileLayer({
			...options.kompass, // Include key
			subLayer: 'kompass_topo',
		}),
		'Kompas winter': new myol.KompassMriTileLayer({
			...options.kompass, // Include key
			subLayer: 'kompass_winter',
		}),

		'Bing': layerBing({
			...options.bing, // Include key
			imagerySet: 'Road',
		}),
		'Bing hybrid': layerBing({
			...options.bing, // Include key
			imagerySet: 'AerialWithLabels',
		}),

		'Photo Swiss': layerSwissTopo({
			subLayer: 'ch.swisstopo.swissimage',
		}),
		'Photo Espagne': layerSpain({
			server: 'pnoa-ma',
			subLayer: 'OI.OrthoimageCoverage',
		}),

		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google hybrid': layerGoogle('s,h'),
		'Stamen': layerStamen('terrain'),
		'Toner': layerStamen('toner'),
		'Watercolor': layerStamen('watercolor'),
		'Blank': new ol.layer.Tile(),
	};
}