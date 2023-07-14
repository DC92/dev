/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON.js';
import OSMXML from 'ol/format/OSMXML.js'; //TODO used ?
import {
	all,
} from 'ol/loadingstrategy.js';
import {
	Fill,
	Stroke,
} from 'ol/style.js';

// MyOl
import {
	labelStylesOptions,
	Selector,
	MyVectorLayer,
} from './MyVectorLayer.js';


// chemineur.fr
export class LayerChemineur extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//chemineur.fr/',
			browserClusterMinDistance: 50,
			serverClusterMinResolution: 100,
			browserClusterFeaturelMaxPerimeter: 300,
			...opt,
		};

		super({
			...options,

			query: (queryOptions, _, resolution) => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: this.selector.getSelection(),
				layer: resolution < options.serverClusterMinResolution ? null : 'cluster', // For server cluster layer
			}),

			convertProperties: (properties) => ({
				...properties,
				icon: chemIconUrl(properties.type, options.host),
				link: options.host + 'viewtopic.php?t=' + properties.id,
				attribution: '&copy;chemineur.fr',
			}),
		});
	}
};

// Get icon from chemineur.fr
function chemIconUrl(type, host) {
	if (type) {
		const icons = type.split(' ');

		return (host || '//chemineur.fr/') +
			'ext/Dominique92/GeoBB/icones/' +
			icons[0] +
			(icons.length > 1 ? '_' + icons[1] : '') + // Limit to 2 type names & ' ' -> '_'
			'.svg';
	}
}

// alpages.info
export class LayerAlpages extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//alpages.info/',
			browserClusterMinDistance: 50,
			browserClusterFeaturelMaxPerimeter: 300,
			...opt,
		};

		super({
			...options,

			query: (queryOptions) => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				forums: this.selector.getSelection(),
			}),

			convertProperties: (properties) => ({
				...properties,
				icon: chemIconUrl(properties.type), // Replace the alpages icon
				link: options.host + 'viewtopic.php?t=' + properties.id,
				attribution: '&copy;alpages.info',
			}),
		});
	}
}

// pyrenees-refuges.com
export class LayerPrc extends MyVectorLayer {
	constructor(options) {
		super({
			url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
			strategy: all,
			browserClusterMinDistance: 50,
			...options,

			convertProperties: (properties) => ({
				...properties,
				type: properties.type_hebergement,
				icon: chemIconUrl(properties.type_hebergement),
				ele: properties.altitude,
				capacity: properties.cap_ete,
				link: properties.url,
				attribution: '&copy;Pyrenees-Refuges',
			}),
		});
	}
}

// CampToCamp.org
export class LayerC2C extends MyVectorLayer {
	constructor(options) {
		const format_ = new GeoJSON({ // Format of received data
			dataProjection: 'EPSG:3857',
		});

		super({
			host: 'https://api.camptocamp.org/',
			query: () => ({
				_path: 'waypoints',
				wtyp: this.selector.getSelection(),
			}),
			projection: 'EPSG:3857',
			format: format_,
			browserClusterMinDistance: 50,
			...options,
		});

		format_.readFeatures = function(json, opt) {
			const features = [],
				objects = JSON.parse(json);

			for (let o in objects.documents) {
				const properties = objects.documents[o];

				features.push({
					id: properties.document_id,
					type: 'Feature',
					geometry: JSON.parse(properties.geometry.geom),
					properties: {
						name: properties.locales[0].title,
						type: properties.waypoint_type,
						icon: chemIconUrl(properties.waypoint_type),
						ele: properties.elevation,
						link: '//www.camptocamp.org/waypoints/' + properties.document_id,
						attribution: '&copy;Camp2camp',
					},
				});
			}

			return format_.readFeaturesFromObject({
				type: 'FeatureCollection',
				features: features,
			});
		};
	}
}

// refuges.info
export class LayerWri extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//dom.refuges.info/', //TODO www
			browserClusterMinDistance: 50,
			serverClusterMinResolution: 100,
			convertProperties: () => {}, // For inheritance
			...opt,
		};

		super({
			...options,
			query: query_,
			convertProperties: convertProperties_, // This class
		});

		this.massifSelector = new Selector(opt.selectMassifName, () => this.refresh(this.selector.getSelection().length, true));

		const layer = this; // For use in query_

		function query_(queryOptions, _, resolution) {
			const selectionMassif = layer.massifSelector.getSelection();

			return {
				_path: selectionMassif.length ? 'api/massif' : 'api/bbox',
				massif: selectionMassif,
				nb_points: 'all',
				type_points: layer.selector.getSelection(),
				cluster: resolution > options.serverClusterMinResolution ? 0.1 : null, // For server cluster layer
			};
		}

		function convertProperties_(properties) {
			if (!properties.cluster) // Points
				properties = {
					name: properties.nom,
					icon: options.host + 'images/icones/' + properties.type.icone + '.svg',
					ele: properties.coord.alt,
					bed: properties.places.valeur,
					type: properties.type.valeur,
					link: properties.lien,
					attribution: '&copy;refuges.info',
				};

			return {
				...properties,
				...options.convertProperties(properties), // Inherited
			};
		}
	}
}

export class layerWriAreas extends MyVectorLayer {
	constructor(options) {
		super({
			host: '//www.refuges.info/',
			strategy: all,
			...options,

			query: () => ({
				_path: 'api/polygones',
				type_polygon: 1, // Massifs
			}),
			convertProperties: properties => ({
				label: properties.nom,
				name: properties.nom,
				link: properties.lien,
				type: null,
				attribution: null,
			}),
			stylesOptions: areasStylesOptions_,
		});

		function areasStylesOptions_(feature, _, hover) {
			const properties = feature.getProperties(),
				colors = properties.couleur
				.match(/([0-9a-f]{2})/ig)
				.map(c => parseInt(c, 16));

			return [{
				...labelStylesOptions(...arguments),

				stroke: new Stroke({
					color: hover ? properties.couleur : 'transparent',
					width: 2,
				}),

				fill: new Fill({
					color: 'rgba(' + colors.join(',') + ',0.3)'
				}),
			}];
		}
	}
}