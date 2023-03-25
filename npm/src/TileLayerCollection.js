/**
 * This file implements various acces to tiles layers services
 */

// Openlayers
import 'ol/ol.css';
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


// Virtual class to replace invalid layer scope by a stub display
class LimitedTileLayer extends TileLayer {
	setMapInternal(map) { //HACK execute actions on Map init
		const altlayer = new StamenTileLayer({
			minResolution: this.getMaxResolution(),
		});

		//BEST fall back out of valid area
		map.addLayer(altlayer);
		altlayer.setOpacity(this.getOpacity());
		altlayer.setVisible(this.getVisible());

		this.on(['change:opacity', 'change:visible'], function() {
			altlayer.setOpacity(this.getOpacity());
			altlayer.setVisible(this.getVisible());
		});

		return super.setMapInternal(map);
	}
}

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
		else
			super({
				maxResolution: 0, // Layer not available for LayerSwitcher
			});
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
		else
			super({
				maxResolution: 0, // Layer not available for LayerSwitcher
			});
	}
}

/**
 * Swisstopo https://api.geo.admin.ch/
 * Don't need key nor referer
 */
export class SwissTopoTileLayer extends LimitedTileLayer {
	constructor(opt) {
		const options = {
				host: 'https://wmts2{0-4}.geo.admin.ch/1.0.0/',
				subLayer: 'ch.swisstopo.pixelkarte-farbe',
				maxResolution: 300, // Resolution limit above which we switch to a more global service
				...opt,
			},
			projectionExtent = getProjection('EPSG:3857').getExtent(),
			resolutions = [],
			matrixIds = [];

		for (let r = 0; r < 18; ++r) {
			resolutions[r] = getWidth(projectionExtent) / 256 / Math.pow(2, r);
			matrixIds[r] = r;
		}

		super({
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
		});
	}
}

/**
 * Spain
 */
export class SpainTileLayer extends TileLayer {
	constructor(opt) {
		const options = {
			host: '//www.ign.es/wmts/',
			server: 'mapa-raster',
			subLayer: 'MTN',
			...opt,
		};

		super({
			source: new XYZ({
				url: options.host + options.server + '?layer=' + options.subLayer +
					'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
					'&style=default&tilematrixset=GoogleMapsCompatible' +
					'&TileMatrix={z}&TileCol={x}&TileRow={y}',
				attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',
				...options,
			}),
			...options,
		});
	}
}

/**
 * Italy IGM
 */
export class IGMTileLayer extends LimitedTileLayer {
	constructor(options) {
		super({
			source: new TileWMS({
				url: 'https://chemineur.fr/assets/proxy/?s=minambiente.it', // Not available via https
				attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer/">IGM</a>',
				...options,
			}),
			maxResolution: 120,
			...options,
		});
	}

	setMapInternal(map) { //HACK execute actions on Map init
		const view = map.getView(),
			source = this.getSource();

		view.on('change:resolution', updateResolution);
		updateResolution();

		function updateResolution() {
			const mapResolution = view.getResolutionForZoom(view.getZoom()),
				layerResolution = mapResolution < 10 ? 25000 : mapResolution < 30 ? 100000 : 250000;

			source.updateParams({
				type: 'png',
				map: '/ms_ogc/WMS_v1.3/raster/IGM_' + layerResolution + '.map',
				layers: (layerResolution == 100000 ? 'MB.IGM' : 'CB.IGM') + layerResolution,
			});
		}

		return super.setMapInternal(map);
	}
}

/**
 * Ordnance Survey : Great Britain
 */
export class OSTileLayer extends LimitedTileLayer {
	constructor(opt) {
		const options = {
			subLayer: 'Outdoor_3857',
			// key: Get your own (free) key at https://osdatahub.os.uk/
			...opt,
		};

		if (options.key) // Don't display if no key
			super({
				extent: [-1198263, 6365000, 213000, 8702260],
				minResolution: 2,
				maxResolution: 1700,
				source: new XYZ({
					url: 'https://api.os.uk/maps/raster/v1/zxy/' + options.subLayer +
						'/{z}/{x}/{y}.png?key=' + options.key,
					attributions: '&copy <a href="https://explore.osmaps.com">UK Ordnancesurvey maps</a>',
					...options, // Include key
				}),
				...options,
			});
		else
			super({
				maxResolution: 0, // Layer not available for LayerSwitcher
			});
	}
}

/**
 * ArcGIS (Esri)
 */
export class ArcGisTileLayer extends TileLayer {
	constructor(opt) {
		const options = {
			host: 'https://server.arcgisonline.com/ArcGIS/rest/services/',
			subLayer: 'World_Imagery',
			...opt,
		};

		super({
			source: new XYZ({
				url: options.host + options.subLayer +
					'/MapServer/tile/{z}/{y}/{x}',
				maxZoom: 19,
				attributions: '&copy; <a href="https://www.arcgis.com/home/webmap/viewer.html">ArcGIS (Esri)</a>',
				...options,
			}),
			...options,
		});
	}
}

/**
 * Stamen http://maps.stamen.com
 */
export class StamenTileLayer extends TileLayer {
	constructor(options) {
		super({
			source: new Stamen({
				layer: 'terrain',
				...options,
			}),
			...options,
		});
	}
}

/**
 * Google
 */
export class GoogleTileLayer extends TileLayer {
	constructor(opt) {
		const options = {
			subLayers: 'm', // Roads
			...opt,
		};

		super({
			source: new XYZ({
				url: '//mt{0-3}.google.com/vt/lyrs=' + options.subLayers + '&hl=fr&x={x}&y={y}&z={z}',
				attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',
				...options,
			}),
			...options,
		});
	}
}

/**
 * Bing (Microsoft)
 * options.imagerySet: sublayer
 * options.key: Get your own (free) key at https://www.bingmapsportal.com
 * Doc at: https://docs.microsoft.com/en-us/bingmaps/getting-started/
 * attributions: defined by source/BingMaps
 */
export class BingTileLayer extends TileLayer {
	constructor(options) {
		// Hide in LayerSwitcher if no key provided
		if (!options.key)
			options.maxResolution = 0;

		super(options);
		const layer = this;

		//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is visible
		layer.on('change:visible', function(evt) {
			if (evt.target.getVisible() && // When the layer becomes visible
				!layer.getSource()) { // Only once
				layer.setSource(new BingMaps(options));
			}
		});
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

		'SwissTopo': new SwissTopoTileLayer(),
		'Autriche': new KompassMriTileLayer(), // No key
		'Angleterre': new OSTileLayer(options.os), // options include key
		'Italie': new IGMTileLayer(),

		'Espagne': new SpainTileLayer(),

		'Photo Google': new GoogleTileLayer({
			subLayers: 's',
		}),
		'Photo ArcGIS': new ArcGisTileLayer(),
		'Photo Bing': new BingTileLayer({
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

		'OS light': new OSTileLayer({
			...options.os, // Include key
			subLayer: 'Light_3857',
		}),
		'OS road': new OSTileLayer({
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

		'Bing': new BingTileLayer({
			...options.bing, // Include key
			imagerySet: 'Road',
		}),
		'Bing hybrid': new BingTileLayer({
			...options.bing, // Include key
			imagerySet: 'AerialWithLabels',
		}),

		'Photo Swiss': new SwissTopoTileLayer({
			subLayer: 'ch.swisstopo.swissimage',
		}),
		'Photo Espagne': new SpainTileLayer({
			server: 'pnoa-ma',
			subLayer: 'OI.OrthoimageCoverage',
		}),

		'Google road': new GoogleTileLayer(),
		'Google terrain': new GoogleTileLayer({
			subLayers: 'p',
		}),
		'Google hybrid': new GoogleTileLayer({
			subLayers: 's,h',
		}),
		'Stamen': new StamenTileLayer(),
		'Toner': new StamenTileLayer({
			layer: 'toner',
		}),
		'Watercolor': new StamenTileLayer({
			layer: 'watercolor',
		}),
		'Blank': new TileLayer(),
	};
}