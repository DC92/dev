/**
 * TileLayerCollection.js
 * Acces to various tiles layers services
 */

import ol from '../../src/ol';

// Virtual class to replace invalid layer scope by a stub display
class LimitedTileLayer extends ol.layer.Tile {
	setMapInternal(map) { //HACK execute actions on Map init
		super.setMapInternal(map);

		const altlayer = new Stamen({
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
	}
}

// OpenStreetMap & co
export class OpenStreetMap extends ol.layer.Tile {
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

export class OpenTopo extends OpenStreetMap {
	constructor(options) {
		super({
			url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
			maxZoom: 17,
			attributions: '<a href="https://opentopomap.org">OpenTopoMap</a> ' +
				'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',

			...options,
		});
	}
}

export class MRI extends OpenStreetMap {
	constructor(options) {
		super({
			url: '//maps.refuges.info/hiking/{z}/{x}/{y}.png',
			attributions: '<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">Refuges.info</a>',

			...options,
		});
	}
}

export class Kompass extends OpenStreetMap { // Austria
	constructor(options) {
		super({
			url: options.key ?
				'https://map{1-4}.kompass.de/{z}/{x}/{y}/kompass_' + options.subLayer + '?key=' + options.key : // Specific
				'https://map{1-5}.tourinfra.com/tiles/kompass_' + options.subLayer + '/{z}/{x}/{y}.png', // No key
			attributions: '<a href="http://www.kompass.de/livemap/">KOMPASS</a>',

			...options,
		});
	}
}

export class Thunderforest extends OpenStreetMap {
	constructor(options) {
		super({
			url: '//{a-c}.tile.thunderforest.com/' + options.subLayer + '/{z}/{x}/{y}.png?apikey=' + options.key,
			// subLayer: 'outdoors', ...
			// key: Get a key at https://manage.thunderforest.com/dashboard
			hidden: !options.key, // For LayerSwitcher
			attributions: '<a href="http://www.thunderforest.com">Thunderforest</a>',

			...options, // Include key
		});
	}
}

/**
 * IGN France
 * doc : https://geoservices.ign.fr/services-web
 */
export class IGN extends ol.layer.Tile {
	constructor(options) {
		let IGNresolutions = [],
			IGNmatrixIds = [];

		for (let i = 0; i < 18; i++) {
			IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
			IGNmatrixIds[i] = i.toString();
		}

		options ||= {};

		super({
			hidden: !options.key, // For LayerSwitcher
			source: new ol.source.WMTS({
				// WMTS options
				url: 'https://wxs.ign.fr/' + options.key + '/wmts',
				layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS', // Top 25
				style: 'normal',
				matrixSet: 'PM',
				format: 'image/jpeg',
				attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>',
				tileGrid: new ol.tilegrid.WMTS({
					origin: [-20037508, 20037508],
					resolutions: IGNresolutions,
					matrixIds: IGNmatrixIds,
				}),

				// IGN options
				// key, Get your own (free) IGN key at https://geoservices.ign.fr/

				...options, // Include key & layer
			}),

			...options,
		});
	}
}

/**
 * Swisstopo https://api.geo.admin.ch/
 * Don't need key nor referer
 */
export class SwissTopo extends LimitedTileLayer {
	constructor(opt) {
		const options = {
				host: 'https://wmts2{0-4}.geo.admin.ch/1.0.0/',
				subLayer: 'ch.swisstopo.pixelkarte-farbe',
				maxResolution: 300, // Resolution limit above which we switch to a more global service
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>',

				...opt,
			},
			projectionExtent = ol.proj.get('EPSG:3857').getExtent(),
			resolutions = [],
			matrixIds = [];

		for (let r = 0; r < 18; ++r) {
			resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
			matrixIds[r] = r;
		}

		super({
			source: new ol.source.WMTS(({
				url: options.host + options.subLayer +
					'/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: new ol.tilegrid.WMTS({
					origin: ol.extent.getTopLeft(projectionExtent),
					resolutions: resolutions,
					matrixIds: matrixIds,
				}),
				requestEncoding: 'REST',
				crossOrigin: 'anonymous',

				...options,
			})),

			...options,
		});
	}
}

/**
 * Spain
 */
export class IgnES extends ol.layer.Tile {
	constructor(opt) {
		const options = {
			host: '//www.ign.es/wmts/',
			server: 'mapa-raster',
			subLayer: 'MTN',
			attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',

			...opt,
		};

		super({
			source: new ol.source.XYZ({
				url: options.host + options.server + '?layer=' + options.subLayer +
					'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
					'&style=default&tilematrixset=GoogleMapsCompatible' +
					'&TileMatrix={z}&TileCol={x}&TileRow={y}',

				...options,
			}),

			...options,
		});
	}
}

/**
 * Italy IGM
 */
export class IGM extends LimitedTileLayer {
	constructor(options) {
		super({
			source: new ol.source.TileWMS({
				url: 'https://chemineur.fr/assets/proxy/?s=minambiente.it', // Not available via https
				attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer/">IGM</a>',

				...options,
			}),
			maxResolution: 120,

			...options,
		});
	}

	setMapInternal(map) { //HACK execute actions on Map init
		super.setMapInternal(map);

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
	}
}

/**
 * Ordnance Survey : Great Britain
 */
//BEST Replacement layer out of bounds
export class OS extends LimitedTileLayer {
	constructor(opt) {
		const options = {
			subLayer: 'Outdoor_3857',
			// key: Get your own (free) key at https://osdatahub.os.uk/
			extent: [-1198263, 6365000, 213000, 8702260],
			minResolution: 2,
			maxResolution: 1700,
			attributions: '&copy <a href="https://explore.osmaps.com">UK Ordnancesurvey maps</a>',

			...opt,
		};

		super({
			hidden: !options.key, // For LayerSwitcher
			source: new ol.source.XYZ({
				url: 'https://api.os.uk/maps/raster/v1/zxy/' + options.subLayer +
					'/{z}/{x}/{y}.png?key=' + options.key,

				...options, // Include key
			}),

			...options,
		});
	}
}

/**
 * ArcGIS (Esri)
 */
export class ArcGIS extends ol.layer.Tile {
	constructor(opt) {
		const options = {
			host: 'https://server.arcgisonline.com/ArcGIS/rest/services/',
			subLayer: 'World_Imagery',
			maxZoom: 19,
			attributions: '&copy; <a href="https://www.arcgis.com/home/webmap/viewer.html">ArcGIS (Esri)</a>',

			...opt,
		};

		super({
			source: new ol.source.XYZ({
				url: options.host + options.subLayer +
					'/MapServer/tile/{z}/{y}/{x}',

				...options,
			}),

			...options,
		});
	}
}

/**
 * Stamen http://maps.stamen.com
 */
export class Stamen extends ol.layer.Tile {
	constructor(options) {
		super({
			source: new ol.source.Stamen({
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
export class Google extends ol.layer.Tile {
	constructor(opt) {
		const options = {
			subLayers: 'm', // Roads
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',

			...opt,
		};

		super({
			source: new ol.source.XYZ({
				url: '//mt{0-3}.google.com/vt/lyrs=' + options.subLayers + '&hl=fr&x={x}&y={y}&z={z}',

				...options,
			}),

			...options,
		});
	}
}

/**
 * Bing (Microsoft)
 * Doc: https://docs.microsoft.com/en-us/bingmaps/getting-started/
 */
export class Bing extends ol.layer.Tile {
	constructor(options) {
		super({
			// imagerySet: 'Road',
			// key, Get your own (free) key at https://www.bingmapsportal.com
			hidden: !options.key, // For LayerSwitcher
			// attributions, defined by ol.source.BingMaps

			...options,
		});

		//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is visible
		this.on('change:visible', evt => {
			if (evt.target.getVisible() && // When the layer becomes visible
				!this.getSource()) // Only once
				this.setSource(new ol.source.BingMaps(options));
		});
	}
}

// Tile layers examples
export function collection(options) {
	options ||= {};

	return {
		'OSM fr': new OpenStreetMap(),
		'OpenTopo': new OpenTopo(),
		'OSM outdoors': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'outdoors',
		}),
		'OSM transports': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'transport',
		}),
		'OSM cyclo': new OpenStreetMap({
			url: '//{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		}),
		'Refuges.info': new MRI(),

		'IGN TOP25': new IGN(options.ign), // options include key
		'IGN V2': new IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels',
			format: 'image/png',
		}),
		'IGN cartes 1950': new IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950',
			key: 'cartes/geoportail',
		}),

		'SwissTopo': new SwissTopo(),
		'Autriche Kompass': new Kompass({
			subLayer: 'osm', // No key
		}),
		'Angleterre': new OS(options.os), // options include key
		'Italie': new IGM(),

		'Espagne': new IgnES(),

		'Photo Google': new Google({
			subLayers: 's',
		}),
		'Photo ArcGIS': new ArcGIS(),
		'Photo Bing': new Bing({
			...options.bing, // Include key
			imagerySet: 'Aerial',
		}),
		'Photo IGN': new IGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS',
			key: 'essentiels',
		}),

		'Photo IGN 1950-65': new IGN({
			layer: 'ORTHOIMAGERY.ORTHOPHOTOS.1950-1965',
			key: 'orthohisto/geoportail',
			style: 'BDORTHOHISTORIQUE',
			format: 'image/png',
		}),

		'IGN E.M. 1820-66': new IGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40',
			key: 'cartes/geoportail',
		}),
		'Cadastre': new IGN({
			layer: 'CADASTRALPARCELS.PARCELLAIRE_EXPRESS',
			key: 'essentiels',
			format: 'image/png',
		}),
		/*'IGN Cassini': new IGN({ //BEST BUG what key for Cassini ?
			...options.ign,
			layer: 'GEOGRAPHICALGRIDSYSTEMS.CASSINI',
		}),*/
	};
}

export function demo(options) {
	options ||= {};

	return {
		...collection(options),

		'OSM': new OpenStreetMap(),

		'ThF cycle': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'cycle',
		}),
		'ThF trains': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'pioneer',
		}),
		'ThF villes': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'neighbourhood',
		}),
		'ThF landscape': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'landscape',
		}),
		'ThF contraste': new Thunderforest({
			...options.thunderforest, // Include key
			subLayer: 'mobile-atlas',
		}),

		'OS light': new OS({
			...options.os, // Include key
			subLayer: 'Light_3857',
		}),
		'OS road': new OS({
			...options.os, // Include key
			subLayer: 'Road_3857',
		}),
		'Kompas topo': new Kompass({
			...options.kompass, // Include key
			subLayer: 'topo',
		}),
		'Kompas winter': new Kompass({
			...options.kompass, // Include key
			subLayer: 'winter',
		}),

		'Bing': new Bing({
			...options.bing, // Include key
			imagerySet: 'Road',
		}),
		'Bing hybrid': new Bing({
			...options.bing, // Include key
			imagerySet: 'AerialWithLabels',
		}),

		'Photo Swiss': new SwissTopo({
			subLayer: 'ch.swisstopo.swissimage',
		}),
		'Photo Espagne': new IgnES({
			server: 'pnoa-ma',
			subLayer: 'OI.OrthoimageCoverage',
		}),

		'Google road': new Google(),
		'Google terrain': new Google({
			subLayers: 'p',
		}),
		'Google hybrid': new Google({
			subLayers: 's,h',
		}),
		'Stamen': new Stamen(),
		'Toner': new Stamen({
			layer: 'toner',
		}),
		'Watercolor': new Stamen({
			layer: 'watercolor',
		}),
		'Blank': new ol.layer.Tile(),
	};
}