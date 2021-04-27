/**
 * This module defines many WMTS EPSG:3857 tiles layers
 */

//HACKS For JS validators
/* jshint esversion: 6 */
if (!ol) var ol = {};
if (!mapKeys) var mapKeys = {};

/*--*/
/**
 * Openstreetmap
 */
function layerOsm(url, attribution, maxZoom) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: url,
			maxZoom: maxZoom || 21,
			attributions: [
				attribution || '',
				ol.source.OSM.ATTRIBUTION,
			],
		}),
	});
}

function layerOsmOpenTopo() {
	return layerOsm(
		'//{a-c}.tile.opentopomap.org/{z}/{x}/{y}.png',
		'<a href="https://opentopomap.org">OpenTopoMap</a> ' +
		'(<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
		17
	);
}

function layerOsmMri() {
	return layerOsm(
		'//maps.refuges.info/hiking/{z}/{x}/{y}.png',
		'<a href="//wiki.openstreetmap.org/wiki/Hiking/mri">MRI</a>'
	);
}

/**
 * Kompas (Austria)
 * Requires layerOsm
 */
function layerKompass(layer) {
	return layerOsm(
		//TODO BUG sur https://wri -> demande le lien https !
		'http://ec{0-3}.cdn.ecmaps.de/WmsGateway.ashx.jpg?' + // Not available via https
		'Experience=ecmaps&MapStyle=' + layer + '&TileX={x}&TileY={y}&ZoomLevel={z}',
		'<a href="http://www.kompass.de/livemap/">KOMPASS</a>'
	);
}

/**
 * Thunderforest
 * Requires layerOsm
 * var mapKeys.thunderforest = Get your own (free) THUNDERFOREST key at https://manage.thunderforest.com
 */
function layerThunderforest(layer) {
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.thunderforest ?
		null :
		layerOsm(
			'//{a-c}.tile.thunderforest.com/' + layer + '/{z}/{x}/{y}.png?apikey=' + mapKeys.thunderforest,
			'<a href="http://www.thunderforest.com">Thunderforest</a>'
		);
}

/**
 * Google
 */
function layerGoogle(layer) {
	return new ol.layer.Tile({
		source: new ol.source.XYZ({
			url: '//mt{0-3}.google.com/vt/lyrs=' + layer + '&hl=fr&x={x}&y={y}&z={z}',
			attributions: '&copy; <a href="https://www.google.com/maps">Google</a>',
		})
	});
}
//BEST lien vers GGstreet

/**
 * Stamen http://maps.stamen.com
 */
function layerStamen(layer) {
	return new ol.layer.Tile({
		source: new ol.source.Stamen({
			layer: layer,
		})
	});
}

/**
 * IGN France
 * Doc on http://api.ign.fr
 * var mapKeys.ign = Get your own (free)IGN key at http://professionnels.ign.fr/user
 */
function layerIGN(layer, format, key) {
	let IGNresolutions = [],
		IGNmatrixIds = [];
	for (let i = 0; i < 18; i++) {
		IGNresolutions[i] = ol.extent.getWidth(ol.proj.get('EPSG:3857').getExtent()) / 256 / Math.pow(2, i);
		IGNmatrixIds[i] = i.toString();
	}
	return (typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.ign) &&
		(typeof key === 'undefined' || !key) ?
		null :
		new ol.layer.Tile({
			source: new ol.source.WMTS({
				url: '//wxs.ign.fr/' + (key || mapKeys.ign) + '/wmts',
				layer: layer,
				matrixSet: 'PM',
				format: 'image/' + (format || 'jpeg'),
				tileGrid: new ol.tilegrid.WMTS({
					origin: [-20037508, 20037508],
					resolutions: IGNresolutions,
					matrixIds: IGNmatrixIds,
				}),
				style: 'normal',
				attributions: '&copy; <a href="http://www.geoportail.fr/" target="_blank">IGN</a>',
			})
		});
}

/**
 * Layers with not all resolutions or area available
 * Virtual class
 * Displays Stamen outside the layer zoom range or extend
 * Requires myol:onadd
 */
//BEST document all options in options = Object.assign
function layerTileIncomplete(options) {
	const layer = options.extraLayer || layerStamen('terrain');
	options.sources[999999] = layer.getSource(); // Add extrabound source on the top of the list

	//HACK : Avoid to call the layer initiator if this layer is not required
	if (typeof options.addSources == 'function')
		layer.on('change:opacity', function() {
			if (layer.getOpacity())
				options.sources = Object.assign(
					options.sources,
					options.addSources()
				);
		});

	layer.once('myol:onadd', function(evt) {
		evt.map.on('moveend', change);
		evt.map.getView().on('change:resolution', change);
		change(); // At init
	});

	function change() {
		if (layer.getOpacity()) {
			const view = layer.map_.getView();
			let currentResolution = 999999; // Init loop at max resolution

			// Search for sources according to the map resolution
			if (ol.extent.intersects(options.extent, view.calculateExtent(layer.map_.getSize())))
				currentResolution = Object.keys(options.sources).filter(function(evt) { //HACK : use of filter to perform an action
					return evt > view.getResolution();
				})[0];

			// Update layer if necessary
			if (layer.getSource() != options.sources[currentResolution])
				layer.setSource(options.sources[currentResolution]);
		}
	}

	return layer;
}

/**
 * Swisstopo https://api.geo.admin.ch/
 * Register your domain: https://shop.swisstopo.admin.ch/fr/products/geoservice/swisstopo_geoservices/WMTS_info
 * Requires layerTileIncomplete
 */
function layerSwissTopo(layer, extraLayer) {
	const projectionExtent = ol.proj.get('EPSG:3857').getExtent();
	let resolutions = [],
		matrixIds = [];
	for (let r = 0; r < 18; ++r) {
		resolutions[r] = ol.extent.getWidth(projectionExtent) / 256 / Math.pow(2, r);
		matrixIds[r] = r;
	}
	return layerTileIncomplete({
		extraLayer: extraLayer,
		extent: [664577, 5753148, 1167741, 6075303], // EPSG:21781 (Swiss CH1903 / LV03)
		sources: {
			500: new ol.source.WMTS(({
				crossOrigin: 'anonymous',
				url: '//wmts2{0-4}.geo.admin.ch/1.0.0/' + layer + '/default/current/3857/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
				tileGrid: new ol.tilegrid.WMTS({
					origin: ol.extent.getTopLeft(projectionExtent),
					resolutions: resolutions,
					matrixIds: matrixIds,
				}),
				requestEncoding: 'REST',
				attributions: '&copy <a href="https://map.geo.admin.ch/">SwissTopo</a>',
			}))
		},
	});
}

/**
 * Spain
 */
function layerSpain(serveur, layer) {
	return layerTileIncomplete({
		//extraLayer: extraLayer,
		extent: [-1036000, 4300000, 482000, 5434000],
		sources: {
			1000: new ol.source.XYZ({
				url: '//www.ign.es/wmts/' + serveur + '?layer=' + layer +
					'&Service=WMTS&Request=GetTile&Version=1.0.0&Format=image/jpeg' +
					'&style=default&tilematrixset=GoogleMapsCompatible' +
					'&TileMatrix={z}&TileCol={x}&TileRow={y}',
				attributions: '&copy; <a href="http://www.ign.es/">IGN España</a>',
			})
		},
	});
}

/**
 * Italy IGM
 * Requires layerTileIncomplete
 */
function layerIGM() {
	function igmSource(url, layer) {
		return new ol.source.TileWMS({
			url: 'http://wms.pcn.minambiente.it/ogc?map=/ms_ogc/WMS_v1.3/raster/' + url + '.map',
			params: {
				layers: layer,
			},
			attributions: '&copy <a href="http://www.pcn.minambiente.it/viewer">IGM</a>',
		});
	}
	return layerTileIncomplete({
		extent: [660124, 4131313, 2113957, 5958411], // EPSG:6875 (Italie)
		sources: {
			100: igmSource('IGM_250000', 'CB.IGM250000'),
			25: igmSource('IGM_100000', 'MB.IGM100000'),
			5: igmSource('IGM_25000', 'CB.IGM25000'),
		},
	});
}

/**
 * Ordnance Survey : Great Britain
 * Requires layerTileIncomplete
 * var mapKeys.bing = Get your own (free) key at http://www.ordnancesurvey.co.uk/business-and-government/products/os-openspace/
 */
function layerOS() {
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.bing ?
		null :
		layerTileIncomplete({
			extent: [-841575, 6439351, 198148, 8589177], // EPSG:27700 (G.B.)
			sources: {},

			addSources: function() {
				return {
					50: new ol.source.BingMaps({
						imagerySet: 'OrdnanceSurvey',
						key: mapKeys.bing,
					})
				};
			},
		});
}

/**
 * Bing (Microsoft)
 * var mapKeys.bing = Get your own (free) key at http://www.ordnancesurvey.co.uk/business-and-government/products/os-openspace/
 */
function layerBing(subLayer) {
	const layer = new ol.layer.Tile();

	//HACK : Avoid to call https://dev.virtualearth.net/... if no bing layer is required
	layer.on('change:opacity', function() {
		if (layer.getVisible() && !layer.getSource()) {
			layer.setSource(new ol.source.BingMaps({
				imagerySet: subLayer,
				key: mapKeys.bing,
			}));
		}
	});
	return typeof mapKeys === 'undefined' || !mapKeys || !mapKeys.bing ? null : layer;
}

/**
 * Tile layers examples
 */
function layersCollection() {
	return {
		'OpenTopo': layerOsmOpenTopo(),
		'OSM outdoors': layerThunderforest('outdoors'),
		'OSM transport': layerThunderforest('transport'),
		'MRI': layerOsmMri(),
		'OSM fr': layerOsm('//{a-c}.tile.openstreetmap.fr/osmfr/{z}/{x}/{y}.png'),
		'Photo Google': layerGoogle('s'),
		'Photo IGN': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS', 'jpeg', 'pratique'),
		'IGN TOP25': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS'),
		'IGN V2': layerIGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGNV2', 'png', 'pratique'),
		'SwissTopo': layerSwissTopo('ch.swisstopo.pixelkarte-farbe'),
		'Swiss photo': layerSwissTopo('ch.swisstopo.swissimage', layerGoogle('s')), //TODO ?????? layerGoogle
		'Autriche': layerKompass('KOMPASS Touristik'),
		'Angleterre': layerOS(),
		'Espagne': layerSpain('mapa-raster', 'MTN'),
		'Espagne photo': layerSpain('pnoa-ma', 'OI.OrthoimageCoverage'),
	};
}

function layersDemo() {
	return Object.assign(layersCollection(), {
		'OSM': layerOsm('//{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'),
		'Hike & Bike': layerOsm(
			'http://{a-c}.tiles.wmflabs.org/hikebike/{z}/{x}/{y}.png',
			'<a href="//www.hikebikemap.org/">hikebikemap.org</a>'
		), // Not on https
		'OSM cycle': layerThunderforest('cycle'),
		'OSM landscape': layerThunderforest('landscape'),
		'OSM trains': layerThunderforest('pioneer'),
		'OSM villes': layerThunderforest('neighbourhood'),
		'OSM contraste': layerThunderforest('mobile-atlas'),

		'IGN Classique': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.CLASSIQUE'),
		'IGN Standard': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.STANDARD'),
		//403 'IGN Spot': layerIGN('ORTHOIMAGERY.ORTHO-SAT.SPOT.2017', 'png'),
		//Double 	'SCAN25TOUR': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN25TOUR'),
		'IGN 1950': layerIGN('ORTHOIMAGERY.ORTHOPHOTOS.1950-1965', 'png'),
		//Le style normal n'est pas geré	'Cadast.Exp': layerIGN('CADASTRALPARCELS.PARCELLAIRE_EXPRESS', 'png'),
		'Cadastre': layerIGN('CADASTRALPARCELS.PARCELS', 'png'),
		'IGN plan': layerIGN('GEOGRAPHICALGRIDSYSTEMS.PLANIGN'),
		'IGN route': layerIGN('GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-EXPRESS.ROUTIER'),
		'IGN noms': layerIGN('GEOGRAPHICALNAMES.NAMES', 'png'),
		'IGN rail': layerIGN('TRANSPORTNETWORKS.RAILWAYS', 'png'),
		'IGN hydro': layerIGN('HYDROGRAPHY.HYDROGRAPHY', 'png'),
		'IGN forêt': layerIGN('LANDCOVER.FORESTAREAS', 'png'),
		'IGN limites': layerIGN('ADMINISTRATIVEUNITS.BOUNDARIES', 'png'),
		//Le style normal n'est pas geré 'SHADOW': layerIGN('ELEVATION.ELEVATIONGRIDCOVERAGE.SHADOW', 'png'),
		//Le style normal n'est pas geré 'PN': layerIGN('PROTECTEDAREAS.PN', 'png'),
		'PNR': layerIGN('PROTECTEDAREAS.PNR', 'png'),
		//403 'Avalanches': layerIGN('IGN avalanches', GEOGRAPHICALGRIDSYSTEMS.SLOPES.MOUNTAIN'),
		'Etat major': layerIGN('GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR40'),
		'ETATMAJOR10': layerIGN('GEOGRAPHICALGRIDSYSTEMS.ETATMAJOR10'),

		'Italie': layerIGM(),
		'Kompas': layerKompass('KOMPASS'),

		'Bing': layerBing('Road'),
		'Bing photo': layerBing('Aerial'),
		'Bing hybrid': layerBing('AerialWithLabels'),
		'Google road': layerGoogle('m'),
		'Google terrain': layerGoogle('p'),
		'Google hybrid': layerGoogle('s,h'),
		'Stamen': layerStamen('terrain'),
		'Toner': layerStamen('toner'),
		'Watercolor': layerStamen('watercolor'),
		//BEST neutral layer
	});
}