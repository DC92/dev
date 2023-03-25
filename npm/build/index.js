// This file defines the contents of the myol.js myol.css, myol.js & myol.css libraries
//TODO Don't export all ol

// Openlayers
import 'ol/ol.css';
export * from 'ol/index.js';

// MyOl
import '../src/controls.css';
import '../src/layerSwitcher.css';
import '../src/editor.css';
export * from '../src/Controls.js';
export * from '../src/Files.js';
export * from '../src/Geolocation.js';
export * from '../src/controlsCollection.js';
export * from '../src/Marker.js';
export * from '../src/layerSwitcher.js';
export * from '../src/TileLayerCollection.js';
export * from '../src/VectorLayer.js';
export * from '../src/VectorLayerCollection.js';
export * from '../src/editor.js';

// Geocoder
import '@kirtandesai/ol-geocoder/dist/ol-geocoder.css';
import '@kirtandesai/ol-geocoder/dist/ol-geocoder-debug.js';

// Debug
import {VERSION} from 'ol/util.js';
console.log('OL V' + VERSION);
