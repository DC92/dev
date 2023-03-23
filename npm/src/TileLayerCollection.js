/**
 * This file implements various acces to tiles layers services
 */
import BingMaps from 'ol/source/BingMaps.js';
import OSM from 'ol/source/OSM.js';
import Stamen from 'ol/source/Stamen.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import TileLayer from 'ol/layer/Tile.js';
import TileWMS from 'ol/source/TileWMS.js';
import WMTS from 'ol/source/WMTS.js';
import XYZ from 'ol/source/XYZ.js';
import {
	getWidth,
	getTopLeft,
} from 'ol/extent.js';
import {
	get as getProjection,
} from 'ol/proj.js';


// OpenStreetMap & co
export class OsmTileLayer extends TileLayer {
	constructor(options) {
		super({
			source: new XYZ({
				url: '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
				maxZoom: 21,
				attributions: OSM.ATTRIBUTION,
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

export class KompassMriTileLayer extends OsmTileLayer { // Austria
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

export class ThunderforestTileLayer extends OsmTileLayer {
	constructor(opt) {
		const options = {
			subLayer: 'outdoors',
			//key: Get a key at https://manage.thunderforest.com/dashboard
			...opt,
		};

		if (options.key) // Don't display if no key
			super({
				url: '//{a-c}.tile.thunderforest.com/' + options.subLayer + '/{z}/{x}/{y}.png?apikey=' + options.key,
				attributions: '<a href="http://www.thunderforest.com">Thunderforest</a>',
				...options, // Include key
			});
			else super(); //TODO ???
	}
}

/**
 * IGN France
 * var options.key = Get your own (free)IGN key at https://geoservices.ign.fr/
 * doc : https://geoservices.ign.fr/services-web
 */
export class IgnTileLayer extends TileLayer {
	constructor(options) {
		let IGNresolutions = [],
			IGNmatrixIds = [];

		for (let i = 0; i < 18; i++) {
			IGNresolutions[i] = getWidth(getProjection('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
			IGNmatrixIds[i] = i.toString();
		}

		if (options && options.key) // Don't display if no key provided
			super({
				source: new WMTS({
					url: 'https://wxs.ign.fr/' + options.key + '/wmts',
					layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS', // Top 25
					style: 'normal',
					matrixSet: 'PM',
					format: 'image/jpeg',
					attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>',
					tileGrid: new WMTSTileGrid({
						origin: [-20037508, 20037508],
						resolutions: IGNresolutions,
						matrixIds: IGNmatrixIds,
					}),
					...options, // Include key & layer
				}),
				...options,
			});
			else super(); //TODO ???
	}
}

/**
 * Swisstopo https://api.geo.admin.ch/
 */
//BEST fall back out of valid area
function layerSwissTopo(opt) {
	const options = {
			host: 'https://wmts2{0-4}.geo.admin.ch/1.0.0/',
			subLayer: 'ch.swisstopo.pixelkarte-farbe',
			...opt,
		},
		projectionExtent = getProjection('EPSG:3857').getExtent(),
		resolutions = [],
		matrixIds = [];

	for (let r = 0; r < 18; ++r) {
		resolutions[r] = getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}

	return [
		layerStamen('terrain', 300), //BEST declare another layer internaly
		new TileLayer({
			maxResolution: 300,
			source: new WMTS(({
				crossOrigin: 'anonymous',
				url: options.host + options.subLayer +
					'/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: new WMTSTileGrid({
					origin: getTopLeft(projectionExtent),
					resolutions: resolutions,
					matrixIds: matrixIds,
				}),
				requestEncoding: 'REST',
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>',
			})),
			...options,
		}),
	];
}

/**
 * Spain
 */
function layerSpain(opt) {
	const options = {
		host: '//www.ign.es/wmts/',
		server: 'mapa-raster',
		subLayer: 'MTN',
		...opt,
	};

	return new TileLayer({
		source: new XYZ({
			url: options.host + options.server + '?layer=' + options.subLayer +
				'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
				'&style=default&tilematrixset=GoogleMapsCompatible' +
				'&TileMatrix={z}&TileCol={x}&TileRow={y}',
			attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',
			...options,
		}),
	});
}

/**
 * Italy IGM
 */
function layerIGM() {
	return [
		subLayerIGM('IGM_25000', 'CB.IGM25000', 5, 10),
		subLayerIGM('IGM_100000', 'MB.IGM100000', 10, 20),
		subLayerIGM('IGM_250000', 'CB.IGM250000', 20, 120),
		layerStamen('terrain', 120),
	];

	function subLayerIGM(url, layer, minResolution, maxResolution) {
		return new TileLayer({
			minResolution: minResolution,
			maxResolution: maxResolution,
			source: new TileWMS({
				url: 'https://chemineur.fr/assets/proxy/?s=minambiente.it&type=png' + // Not available via https
					'&map=/ms_ogc/WMS_v1.3/raster/' + url + '.map',
				params: {
					layers: layer,
				},
				attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer/">IGM</a>',
			}),
		});
	}
}

/**
 * Ordnance Survey : Great Britain
 */
function layerOS(opt) {
	const options = {
		subLayer: 'Outdoor_3857',
		// key: Get your own (free) key at https://osdatahub.os.uk/
		...opt,
	};

	if (options.key)
		return [
			layerStamen('terrain', 1700),
			new TileLayer({
				extent: [-1198263, 6365000, 213000, 8702260],
				minResolution: 2,
				maxResolution: 1700,
				source: new XYZ({
					url: 'https://api.os.uk/maps/raster/v1/zxy/' + options.subLayer +
						'/{z}/{x}/{y}.png?key=' + options.key,
					attributions: '&copy <a href="https://explore.osmaps.com">UK Ordnancesurvey maps</a>',
					...options, // Include key
				}),
			}),
		];
}

/**
 * ArcGIS (Esri)
 */
function layerArcGIS(opt) {
	const options = {
		host: 'https://server.arcgisonline.com/ArcGIS/rest/services/',
		subLayer: 'World_Imagery',
		...opt,
	};

	return new TileLayer({
		source: new XYZ({
			url: options.host + options.subLayer +
				'/MapServer/tile/{z}/{y}/{x}',
			maxZoom: 19,
			attributions: '&copy; <a href="https://www.arcgis.com/home/webmap/viewer.html">ArcGIS (Esri)</a>',
		}),
	});
}

/**
 * Stamen http://maps.stamen.com
 */
function layerStamen(subLayer, minResolution) {
	return new TileLayer({
		source: new Stamen({
			layer: subLayer,
		}),
		minResolution: minResolution || 0,
	});
}

/**
 * Google
 */
function layerGoogle(subLayer) {
	return new TileLayer({
		source: new XYZ({
			url: '//mt{0-3}.google.com/vt/lyrs=' + subLayer + '&hl=fr&x={x}&y={y}&z={z}',
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',
		}),
	});
}

/**
 * Bing (Microsoft)
 * options.imagerySet: sublayer
 * options.key: Get your own (free) key at https://www.bingmapsportal.com
 * Doc at: https://docs.microsoft.com/en-us/bingmaps/getting-started/
 * attributions: defined by source/BingMaps
 */
function layerBing(options) {
	if (options && options.key) { // Don't display if no key provided
		const layer = new TileLayer();

		//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is visible
		layer.on('change:visible', function(evt) {
			if (evt.target.getVisible() && // When the layer becomes visible
				!layer.getSource()) { // Only once
				layer.setSource(new BingMaps(options));
			}
		});

		return layer;
	}
}

// Tile layers examples
export function collectionTileLayer(options) {
	options = options || {};

	return {
		'OSM fr': new OsmTileLayer(),
		'OpenTopo': new TopoTileLayer(),
		'OSM outdoors': new ThunderforestTileLayer(options.thunderforest), // options include key
		'OSM transports': new ThunderforestTileLayer({
			...options.thunderforest, // Include key
			subLayer: 'transport',
		}),
		'OSM cyclo': new OsmTileLayer({
			url: '//{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		}),
		'Refuges.info': new MriTileLayer(),

		'IGN TOP25': new IgnTileLayer(options.ign), // options include key
		'IGN V2': new IgnTileLayer({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels',
			format: 'image/png',
		}),
		'IGN cartes 1950': new IgnTileLayer({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950',
			key: 'cartes/geoportail',
		}),

		'SwissTopo': layerSwissTopo(),
		'Autriche': new KompassMriTileLayer(), // No key
		'Angleterre': layerOS(options.os), // options include key
		'Italie': layerIGM(),
		'Espagne': layerSpain(),

		'Photo Google': layerGoogle('s'),
		'Photo ArcGIS': layerArcGIS(),
		'Photo Bing': layerBing({
			...options.bing, // Include key
			imagerySet: 'Aerial',
		}),
		'Photo IGN': new IgnTileLayer({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),

		'Photo IGN 1950-65': new IgnTileLayer({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965',
			key: 'orthohisto/geoportail',
			style: 'BDORTHOHISTORIQUE',
			format: 'image/png',
		}),

		'IGN E.M. 1820-66': new IgnTileLayer({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40',
			key: 'cartes/geoportail',
		}),
		'Cadastre': new IgnTileLayer({
			layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
			key: 'essentiels',
			format: 'image/png',
		}),
		/*'IGN Cassini': new IgnTileLayer({ //BEST BUG what key for Cassini ?
			...options.ign,
					layer: 'GEOGRAPHICALGRIDSYSTEMS.CASSINI',
				}),*/
	};
}

export function demoTileLayer(options) {
	return {
		...collectionTileLayer(options),

		'OSM': new OsmTileLayer(),

		'ThF cycle': new ThunderforestTileLayer({
			...options.thunderforest, // Include key
			subLayer: 'cycle',
		}),
		'ThF trains': new ThunderforestTileLayer({
			...options.thunderforest, // Include key
			subLayer: 'pioneer',
		}),
		'ThF villes': new ThunderforestTileLayer({
			...options.thunderforest, // Include key
			subLayer: 'neighbourhood',
		}),
		'ThF landscape': new ThunderforestTileLayer({
			...options.thunderforest, // Include key
			subLayer: 'landscape',
		}),
		'ThF contraste': new ThunderforestTileLayer({
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
		'Kompas topo': new KompassMriTileLayer({
			...options.kompass, // Include key
			subLayer: 'kompass_topo',
		}),
		'Kompas winter': new KompassMriTileLayer({
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
		'Blank': new TileLayer(),
	};
}