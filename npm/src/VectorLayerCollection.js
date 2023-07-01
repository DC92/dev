/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
import 'ol/ol.css';
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
			browserClusterMinResolution: 50,
			serverClusterMinResolution: 100,
			...opt,
		};

		super({
			...options,

			query: (queryOptions) => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: queryOptions.selector.getSelection(),
				layer: queryOptions.altLayer ? null : 'cluster', // For server cluster layer
			}),

			convertProperties: (properties) => ({
				...properties,
				icon: options.host + 'ext/Dominique92/GeoBB/icones/' +
					(properties.type || 'a63') + '.svg',
				link: options.host + 'viewtopic.php?t=' + properties.id,
				attribution: '&copy;chemineur.fr',
			}),
		});
	}
};

// alpages.info
export class LayerAlpages extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//alpages.info/',
			browserClusterMinResolution: 50,
			...opt,
		};

		super({
			...options,

			query: (queryOptions) => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				forums: queryOptions.selector.getSelection(),
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

// Get icon from chemineur.fr
export function chemIconUrl(type) {
	const icons = (type || 'a63').split(' ');

	return '//chemineur.fr/ext/Dominique92/GeoBB/icones/' +
		icons[0] +
		(icons.length > 1 ? '_' + icons[1] : '') + // Limit to 2 type names & ' ' -> '_'
		'.svg';
}

// refuges.info
export class LayerWri extends MyVectorLayer {
	constructor(opt) {
		const options = {
				host: '//dom.refuges.info/', //TODO www
				browserClusterMinResolution: 50,
				serverClusterMinResolution: 100,
				convertProperties: () => {}, // For inheritance
				...opt,
			},
			massifSelector = new Selector(opt.selectMassifName, () => layer.refresh());

		super({
			...options,
			query: query_,
			convertProperties: convertProperties_,
		});

		const layer = this; // For use in Selector callBack

		function query_(queryOptions) {
			const selection = massifSelector.getSelection();

			return {
				_path: selection.length ? 'api/massif' : 'api/bbox',
				massif: selection,
				nb_points: 'all',
				type_points: queryOptions.selector.getSelection(),
				cluster: queryOptions.altLayer ? null : 0.1, // For server cluster layer
			};
		}

		function convertProperties_(properties) {
			if (properties.type)
				return {
					...properties,
					name: properties.nom,
					icon: options.host + 'images/icones/' + properties.type.icone + '.svg',
					ele: properties.coord.alt,
					bed: properties.places.valeur,
					type: properties.type.valeur,
					link: properties.lien,
					attribution: '&copy;refuges.info',
					...options.convertProperties(properties), // Inheritance
				};
			else
				return properties; // Clusters
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