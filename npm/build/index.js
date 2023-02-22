/**
 * @module myol
 */

import 'ol/ol.css';
export {Map, View} from 'ol';
export {default as TileLayer } from 'ol/layer/Tile.js';
export {default as XYZ} from 'ol/source/XYZ';

import '../src/controls.css';
import '../src/editor.css';
import '../src/layerSwitcher.css';

export * from '../src/TileLayerCollection.js';

import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.js';
