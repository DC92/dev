// Openlayers
import 'ol/ol.css';
import Map from 'ol/Map.js';
import View from 'ol/View.js';

// Geocoder
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.js';

// MyOl
import {
	controlsCollection,
} from '../src/controlsCollection.js';
import {
	controlLayerSwitcher,
} from '../src/LayerSwitcher.js';
import {
	collectionTileLayer,
} from '../src/TileLayerCollection.js';

// Debug
import {VERSION} from 'ol/util.js';
console.log('OL V' + VERSION);


export default function (layersKeys){
	return new Map({
		target: 'map',
		view: new View({
			enableRotation: false,
		}),
		controls: [
			...controlsCollection(),
			controlLayerSwitcher({
				layers: collectionTileLayer(layersKeys),
			}),
		],
	});
}
