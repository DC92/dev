/**
 * VectorLayerCollection.js
 * Various acces to geoJson services
 */

// Openlayers
//TODO verify if all are used
import GeoJSON from 'ol/format/GeoJSON';
import OSMXML from 'ol/format/OSMXML';
import * as loadingstrategy from 'ol/loadingstrategy';
import * as proj from 'ol/proj';
import * as style from 'ol/style';

// MyOl
import * as stylesOptions from './stylesOptions';
import {
	MyVectorLayer,
} from './MyVectorLayer';


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

// chemineur.fr
export class Chemineur extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//chemineur.fr/',
			browserClusterMinDistance: 50,
			browserClusterFeaturelMaxPerimeter: 300,
			serverClusterMinResolution: 100,
			attribution: '&copy;chemineur.fr',
			...opt,
		};

		super({
			...options,
			query: (extent, resolution) => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				cat: this.selector.getSelection(),
				layer: resolution < options.serverClusterMinResolution ? null : 'cluster', // For server cluster layer
			}),
		});
	}
};

// alpages.info
export class Alpages extends MyVectorLayer {
	constructor(opt) {
		const options = {
			host: '//alpages.info/',
			browserClusterMinDistance: 50,
			browserClusterFeaturelMaxPerimeter: 300,
			attribution: '&copy;alpages.info',
			...opt,
		};

		super({
			...options,

			query: () => ({
				_path: 'ext/Dominique92/GeoBB/gis.php',
				forums: this.selector.getSelection(),
			}),

			addProperties: properties => ({
				icon: chemIconUrl(properties.type), // Replace the alpages icon
				link: options.host + 'viewtopic.php?t=' + properties.id,
			}),
		});
	}
}

// refuges.info
export class WRI extends MyVectorLayer {
	constructor(options) {
		super({
			host: '//www.refuges.info/',
			browserClusterMinDistance: 50,
			serverClusterMinResolution: 100,
			attribution: '&copy;refuges.info',

			...options,

			query: query_,

			addProperties: properties => ({
				name: properties.nom,
				icon: this.options.host + 'images/icones/' + properties.type.icone + '.svg',
				ele: properties.coord.alt,
				bed: properties.places.valeur,
				type: properties.type.valeur,
				link: properties.lien,
			}),
		});

		const layer = this; // For use in query_ //TODO optimise

		function query_(extent, resolution) {
			return {
				_path: 'api/bbox',
				nb_points: 'all',
				type_points: layer.selector.getSelection(),
				cluster: resolution > options.serverClusterMinResolution ? 0.1 : null, // For server cluster layer
			};
		}
	}
}

// pyrenees-refuges.com
export class PRC extends MyVectorLayer {
	constructor(options) {
		super({
			url: 'https://www.pyrenees-refuges.com/api.php?type_fichier=GEOJSON',
			strategy: loadingstrategy.all,
			browserClusterMinDistance: 50,
			attribution: '&copy;Pyrenees-Refuges',
			...options,

			addProperties: properties => ({
				type: properties.type_hebergement,
				icon: chemIconUrl(properties.type_hebergement),
				ele: properties.altitude,
				capacity: properties.cap_ete,
				link: properties.url,
			}),
		});
	}
}

// CampToCamp.org
export class C2C extends MyVectorLayer {
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
			attribution: '&copy;Camp2camp',
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

/**
 * OSM XML overpass POI layer
 * From: https://openlayers.org/en/latest/examples/vector-osm.html
 * Doc: http://wiki.openstreetmap.org/wiki/Overpass_API/Language_Guide
 */
export class Overpass extends MyVectorLayer {
	constructor(options) {
		const format_ = new OSMXML(),
			statusEl = document.getElementById(options.selectName),
			selectEls = document.getElementsByName(options.selectName);

		super({
			host: 'https://overpass-api.de',
			//host: 'https://lz4.overpass-api.de',
			//host: 'https://overpass.kumi.systems',
			browserClusterMinDistance: 50,
			query: query_,
			bbox: () => null, // No bbox at the end of the url
			format: format_,
			maxResolution: 50,
			...options,
		});

		const layer = this;

		function query_(extent, resolution, projection) {
			const selections = layer.selector.getSelection(),
				items = selections[0].split(','), // The 1st (and only) selector
				ex4326 = proj.transformExtent(extent, projection, 'EPSG:4326').map(c => c.toPrecision(6)),
				bbox = '(' + ex4326[1] + ',' + ex4326[0] + ',' + ex4326[3] + ',' + ex4326[2] + ');',
				args = [];

			// Convert selected items on overpass_api language
			for (let l = 0; l < items.length; l++) {
				const champs = items[l].split('+');

				for (let ls = 0; ls < champs.length; ls++)
					args.push(
						'node' + champs[ls] + bbox + // Ask for nodes in the bbox
						'way' + champs[ls] + bbox // Also ask for areas
					);
			}

			return {
				_path: '/api/interpreter',
				data: '[timeout:5];(' + args.join('') + ');out center;',
			};
		}

		// List of acceptable tags in the request return
		let tags = '';

		for (let e in selectEls)
			if (selectEls[e].value)
				tags += selectEls[e].value.replace('private', '');

		// Extract features from data when received
		format_.readFeatures = function(doc, opt) {
			// Transform an area to a node (picto) at the center of this area

			for (let node = doc.documentElement.firstElementChild; node; node = node.nextSibling) {
				// Translate attributes to standard MyOl
				for (let tag = node.firstElementChild; tag; tag = tag.nextSibling)
					if (tag.attributes) {
						if (tags.indexOf(tag.getAttribute('k')) !== -1 &&
							tags.indexOf(tag.getAttribute('v')) !== -1 &&
							tag.getAttribute('k') != 'type') {
							addTag(node, 'type', tag.getAttribute('v'));
							addTag(node, 'icon', chemIconUrl(tag.getAttribute('v')));
							// Only once for a node
							addTag(node, 'link', 'https://www.openstreetmap.org/node/' + node.id);
							addTag(node, 'attribution', '&copy;OpenStreetMap'); //TODO move to layer.options
						}

						if (tag.getAttribute('k') && tag.getAttribute('k').includes('capacity:'))
							addTag(node, 'capacity', tag.getAttribute('v'));
					}

				// Create a new 'node' element centered on the surface
				if (node.nodeName == 'way') {
					const newNode = doc.createElement('node');
					newNode.id = node.id;
					doc.documentElement.appendChild(newNode);

					// Browse <way> attributes to build a new node
					for (let subTagNode = node.firstElementChild; subTagNode; subTagNode = subTagNode.nextSibling)
						switch (subTagNode.nodeName) {
							case 'center':
								// Set node attributes
								newNode.setAttribute('lon', subTagNode.getAttribute('lon'));
								newNode.setAttribute('lat', subTagNode.getAttribute('lat'));
								newNode.setAttribute('nodeName', subTagNode.nodeName);
								break;

							case 'tag': {
								// Get existing properties
								newNode.appendChild(subTagNode.cloneNode());

								// Add a tag to mem what node type it was (for link build)
								addTag(newNode, 'nodetype', node.nodeName);
							}
						}
				}

				// Status 200 / error message
				if (node.nodeName == 'remark' && statusEl)
					statusEl.textContent = node.textContent;
			}

			function addTag(node, k, v) {
				const newTag = doc.createElement('tag');
				newTag.setAttribute('k', k);
				newTag.setAttribute('v', v);
				node.appendChild(newTag);
			}

			return OSMXML.prototype.readFeatures.call(this, doc, opt);
		};
	}
}