/**
 * @module myol
 */

// openlayers.org
import 'ol/ol.css';
export {Map, View} from 'ol';
export {default as Attribution} from 'ol/control/Attribution';
export {default as Zoom} from 'ol/control/Zoom';

// MyOl
import '../src/controls.css';
import '../src/editor.css';
import '../src/layerSwitcher.css';
export * from '../src/TileLayerCollection.js';

// Geocoder
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';
import '@kirtandesai/ol-geocoder/dist/ol-geocoder-debug.js';
