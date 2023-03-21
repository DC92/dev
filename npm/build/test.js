import '../node_modules/rbush/rbush.min.js';

import 'ol/ol.css';
import '../src/controls.css';
import '../src/layerSwitcher.css';

import Map from '../node_modules/ol/Map.js';
import View from '../node_modules/ol/View.js';
import {
	controlLayerSwitcher,
} from '../src/LayerSwitcher.js';
import {
	collectionTileLayer,
} from '../src/TileLayerCollection.js';
import {
	controlsCollection,
} from '../src/controlsCollection.js';

import {VERSION} from '../node_modules/ol/util.js';
console.log('OL V' + VERSION);

export function map(){
	return new Map({
		target: 'map',
		view: new View({
			enableRotation: false,
		}),
		controls: [
			...controlsCollection(),
			controlLayerSwitcher({
				layers: collectionTileLayer(),
			}),
		],
	});
}
