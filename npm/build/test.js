import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';

import {
	controlsCollection,
} from '../src/controlsCollection.js';
import {
	controlLayerSwitcher,
} from '../src/LayerSwitcher.js';
import {
	collectionTileLayer,
} from '../src/TileLayerCollection.js';

import {VERSION} from 'ol/util.js';
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
