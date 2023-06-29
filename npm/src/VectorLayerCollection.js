/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
import 'ol/ol.css';
import OSMXML from 'ol/format/OSMXML.js'; //TODO used ?

// MyOl
import {
	MyVectorLayer,
	ServerClusterVectorLayer,
} from './MyVectorLayer.js';


// chemineur.fr
export class LayerChemineur extends ServerClusterVectorLayer {
	constructor(opt) {
		const options = {
			host: '//chemineur.fr/',
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
export class LayerWri extends ServerClusterVectorLayer {
	constructor(opt) {
		const options = {
			host: '//dom.refuges.info/', //TODO www
			...opt,
		};

		super({
			...options,

			query: (queryOptions) => ({
				_path: 'api/bbox',
				nb_points: 'all',
				type_points: queryOptions.selector ? queryOptions.selector.getSelection() : null,
				cluster: queryOptions.altLayer ? null : 0.1, // For server cluster layer
			}),

			convertProperties: (properties) => ({
				...properties,
				icon: options.host + 'images/icones/' + (properties.type || {}).icone + '.svg',
				name: properties.nom || properties.name,
				ele: (properties.coord || {}).alt,
				bed: (properties.places || {}).valeur,
				type: (properties.type || {}).valeur,
				link: properties.lien,
				attribution: '&copy;refuges.info',
				...(options.convertProperties ? // Inherited
					options.convertProperties(properties) :
					null),
			}),
		});
	}
}