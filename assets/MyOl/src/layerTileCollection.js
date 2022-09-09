/**
 * This module defines many WMTS EPSG:3857 tiles layers
 */

/**
 * Openstreetmap
 */
function layerOSM(options) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			maxZoom: 21,
			attributions: ol.source.OSM.ATTRIBUTION,
			...options
		}),
	});
}

function layerOpenTopo(options) {
	return layerOSM({
		url: '//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		attributions: '<a href="https://opentopomap.org">OpenTopoMap</a> ' +
			'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
		maxZoom: 17,
		...options
	});
}

function layerMRI(options) {
	return layerOSM({
		url: '//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		attributions: '<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">Refuges.info</a>',
		...options
	});
}

/**
 * Kompas (Austria)
 * Requires layerOSM
 */
//TODO layerKompass BUG don't work
function layerKompass(opt) {
	const options = {
		subLayer: 'KOMPASS Touristik',
		...opt
	};

	return layerOSM({
		url: 'https://chemineur.fr/assets/proxy/?s=ecmaps.de&type=x-icon' + // Not available via https
			'&Experience=ecmaps&MapStyle=' + options.subLayer + '&TileX={x}&TileY={y}&ZoomLevel={z}',
		attributions: '<a href="http://www.kompass.de/livemap/">KOMPASS</a>',
		...options
	});
}

/**
 * Thunderforest
 * Requires layerOSM
 * var mapKeys.thunderforest = Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
 */
function layerThunderforest(opt) {
	const options = {
		subLayer: 'outdoors',
		...opt
	};

	if (options.key)
		return layerOSM({
			url: '//{a-c}.tile.thunderforest.com/' + options.subLayer +
				'/{z}/{x}/{y}.png?apikey=' + options.key,
			attributions: '<a href="http://www.thunderforest.com">Thunderforest</a>',
			...options
		});
}

/**
 * IGN France
 * var options.key = Get your own (free)IGN key at https://geoservices.ign.fr/
 * doc : https://geoservices.ign.fr/services-web
 */
function layerIGN(opt) {
	let options = {
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS', // Top 25
			...opt
		},
		IGNresolutions = [],
		IGNmatrixIds = [];

	for (let i = 0; i < 18; i++) {
		IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
		IGNmatrixIds[i] = i.toString();
	}

	if (options.key) // Don't display if no key provided
		return new ol.layer.Tile({
			source: new ol.source.WMTS({
				url: 'https://wxs.ign.fr/' + options.key + '/wmts',
				style: 'normal',
				matrixSet: 'PM',
				format: 'image/jpeg',
				attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>',
				tileGrid: new ol.tilegrid.WMTS({
					origin: [-20037508, 20037508],
					resolutions: IGNresolutions,
					matrixIds: IGNmatrixIds,
				}),
				...options
			}),
		});
}

/**
 * Swisstopo https://api.geo.admin.ch/
 */
//BEST fall back out of valid area
function layerSwissTopo(opt) {
	const options = {
			host: 'https://wmts2{0-4}.geo.admin.ch/1.0.0/',
			subLayer: 'ch.swisstopo.pixelkarte-farbe',
			...opt
		},
		projectionExtent = ol.proj.get('EPSG:3857').getExtent(),
		resolutions = [],
		matrixIds = [];

	for (let r = 0; r < 18; ++r) {
		resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}

	return [
		layerStamen('terrain', 300),
		new ol.layer.Tile({
			maxResolution: 300,
			source: new ol.source.WMTS(({
				crossOrigin: 'anonymous',
				url: options.host + options.subLayer +
					'/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: new ol.tilegrid.WMTS({
					origin: ol.extent.getTopLeft(projectionExtent),
					resolutions: resolutions,
					matrixIds: matrixIds,
				}),
				requestEncoding: 'REST',
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>',
			})),
			...options
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
		...opt
	};

	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: options.host + options.server + '?layer=' + options.subLayer +
				'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
				'&style=default&tilematrixset=GoogleMapsCompatible' +
				'&TileMatrix={z}&TileCol={x}&TileRow={y}',
			attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',
			...options
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
		return new ol.layer.Tile({
			minResolution: minResolution,
			maxResolution: maxResolution,
			source: new ol.source.TileWMS({
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
 * var mapKeys.os = Get your own (free) key at https://osdatahub.os.uk/
 */
function layerOS(opt) {
	const options = {
		subLayer: 'Outdoor_3857',
		...opt
	};

	if (options.key)
		return [
			layerStamen('terrain', 1700),
			new ol.layer.Tile({
				extent: [-1198263, 6365000, 213000, 8702260],
				minResolution: 2,
				maxResolution: 1700,
				source: new ol.source.XYZ({
					url: 'https://api.os.uk/maps/raster/v1/zxy/' + options.subLayer +
						'/{z}/{x}/{y}.png?key=' + options.key,
					attributions: '&copy <a href="https://explore.osmaps.com">UK Ordnancesurvey maps</a>',
					...options
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
		...opt
	};

	return new ol.layer.Tile({
		source: new ol.source.XYZ({
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
	return new ol.layer.Tile({
		source: new ol.source.Stamen({
			layer: subLayer,
		}),
		minResolution: minResolution || 0,
	});
}

/**
 * Google
 */
function layerGoogle(subLayer) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: '//mt{0-3}.google.com/vt/lyrs=' + subLayer + '&hl=fr&x={x}&y={y}&z={z}',
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',
		}),
	});
}

/**
 * Bing (Microsoft)
 * var mapKeys.bing = Get your own (free) key at https://docs.microsoft.com/en-us/bingmaps/getting-started/
 */
function layerBing(subLayer) {
	if (typeof mapKeys == 'undefined' || !mapKeys) mapKeys = {};

	if (mapKeys.bing) { // Don't display if no key provided
		const layer = new ol.layer.Tile();

		//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is visible
		layer.on('change:visible', function(evt) {
			if (evt.target.getVisible() && // When the layer becomes visible
				!layer.getSource()) { // Only once
				layer.setSource(new ol.source.BingMaps({
					imagerySet: subLayer,
					key: mapKeys.bing,
					// Attributions: defined by source.BingMaps
				}));
			}
		});

		return layer;
	}
}

/**
 * Tile layers examples
 */
function layerTileCollection(options) {
	options = options || {};
	options.keys = options.keys || {};

	// Get keys from options.keys
	for (let k in options.keys)
		options[k] = {
			key: options.keys[k],
			...options[k]
		};

	return {
		'OSM fr': layerOSM({
			url: '//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png',
		}),
		'OSM cyclo': layerOSM({
			url: '//{a-c}.tile-cyclosm.openstreetmap.fr/cyclosm/{z}/{x}/{y}.png',
		}),
		'OSM outdoors': layerThunderforest(),
		'OSM transport': layerThunderforest({
			subLayer: 'transport',
		}),
		'OpenTopo': layerOpenTopo(),
		'Refuges.info': layerMRI(),

		'IGN TOP25': layerIGN(options.ign),
		'IGN V2': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2',
			key: 'essentiels',
			format: 'image/png',
		}),
		'IGN cartes 1950': layerIGN({
			layer: 'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN50.1950',
			key: 'cartes/geoportail',
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

		'SwissTopo': layerSwissTopo(),
		//'Autriche': layerKompass(), //TODO BUG don't work
		'Angleterre': layerOS(),
		'Italie': layerIGM(),
		'Espagne': layerSpain(),

		'Photo ArcGIS': layerArcGIS(),
		'Photo Bing': layerBing('Aerial'),
		'Photo Google': layerGoogle('s'),
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
	};
}

function layersDemo(options) {
	return {
		// Benefit of layerTileCollection keys management as argument is passed by reference
		...layerTileCollection(options),

		'OSM': layerOSM({
			url: '//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png',
		}),

		'ThF cycle': layerThunderforest({
			subLayer: 'cycle',
		}),
		'ThF landscape': layerThunderforest({
			subLayer: 'landscape',
		}),
		'ThF trains': layerThunderforest({
			subLayer: 'pioneer',
		}),
		'ThF villes': layerThunderforest({
			subLayer: 'neighbourhood',
		}),
		'ThF contraste': layerThunderforest({
			subLayer: 'mobile-atlas',
		}),

		'OS light': layerOS({
			subLayer: 'Light_3857',
		}),
		'OS road': layerOS({
			subLayer: 'Road_3857',
		}),
		//'Kompas': layerKompass({subLayer:'KOMPASS',}), //TODO BUG

		'Bing': layerBing('Road'),
		'Bing hybrid': layerBing('AerialWithLabels'),

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