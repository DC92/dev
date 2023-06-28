/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
import 'ol/ol.css';
import GeoJSON from 'ol/format/GeoJSON.js';
import Icon from 'ol/style/Icon.js';
import OSMXML from 'ol/format/OSMXML.js';
import {
	Fill,
	Stroke,
} from 'ol/style.js';

// MyOl
import {
	basicStylesOptions,
	concatenateStylesOptions,
	labelStylesOptions,
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
			query: query_,
			convertProperties: convertProperties_,
		});

		function query_(opt) {
			return {
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: opt.selector.getSelection(),

				// For server cluster layer
				layer: opt.altLayer ? null : 'cluster',
			};
		}

		function convertProperties_(properties) {
			return {
				...properties,
				icon: options.host + 'ext/Dominique92/GeoBB/icones/' + (properties.type || 'a63') + '.svg',
				link: options.host + 'viewtopic.php?t=' + properties.id,
				attribution: '&copy;chemineur.fr',
			};
		}
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
			query: query_,
			convertProperties: convertProperties_,
		});

		function query_(opt) {
			return {
				_path: 'ext/Dominique92/GeoBB/gis.php',
				forums: opt.selector.getSelection(),
			};
		}

		function convertProperties_(properties) {
			return {
				...properties,
				icon: chemIconUrl(properties.type), // Replace the alpages icon
				link: options.host + 'viewtopic.php?t=' + properties.id,
				attribution: '&copy;alpages.info',
			};
		}
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
			host: '//www.refuges.info/',
			...opt,
		};

		super({
			...options,
			query: query_,
			convertProperties: convertProperties_,
		});

		function query_(queryOptions) {
			return {
				_path: 'api/bbox',
				nb_points: 'all',
				type_points: queryOptions.selector ? queryOptions.selector.getSelection() : null,

				// For server cluster layer
				cluster: queryOptions.altLayer ? null : 0.1,

				// Specific inherited
				...(opt.query ? opt.query(...arguments) : null),
			};
		}

		function convertProperties_(properties) {
			return {
				...properties,
				icon: options.host + 'images/icones/' + (properties.type || {}).icone + '.svg',
				name: properties.nom,
				ele: (properties.coord || {}).alt,
				bed: (properties.places || {}).valeur,
				type: (properties.type || {}).valeur,
				link: properties.lien,
				attribution: '&copy;refuges.info',
				...(options.convertProperties ? options.convertProperties(...arguments) : null)
			};
		}
	}
}